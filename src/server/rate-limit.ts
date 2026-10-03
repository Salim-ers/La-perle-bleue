/**
 * Limitation de débit sans Redis : compteur par fenêtre fixe dans Postgres,
 * incrémenté en une seule requête atomique (INSERT … ON CONFLICT).
 */
import "server-only";
import { lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { rateLimits } from "./db/schema";

/** Adresse IP du client : `x-real-ip` est posé par Vercel (non falsifiable par le navigateur). */
export function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (real || forwarded || "inconnue").trim();
}

/** `true` si la requête est autorisée. En cas de panne de la base, on laisse passer. */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  try {
    const db = await getDb();
    const windowMs = windowSeconds * 1000;
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
    const [row] = await db
      .insert(rateLimits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count });
    // Nettoyage occasionnel des anciennes fenêtres.
    if (Math.random() < 0.02) {
      await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(Date.now() - 86_400_000)));
    }
    return row.count <= limit;
  } catch {
    return true;
  }
}
