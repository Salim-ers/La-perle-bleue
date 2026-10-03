/**
 * POST /api/admin/login — mot de passe unique du restaurant (ADMIN_PASSWORD),
 * comparé en temps constant, 5 essais par quart d'heure et par adresse IP.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ADMIN_COOKIE, ADMIN_SESSION_DAYS, createSessionToken, getSessionSecret } from "@/lib/admin-session";
import { isSameOrigin, json } from "@/server/http";
import { logEvent } from "@/server/logger";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const digest = (value: string) => createHash("sha256").update(value).digest();

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origine refusée." }, 403);
  const password = process.env.ADMIN_PASSWORD;
  const secret = getSessionSecret();
  if (!password || password.length < 10 || !secret) {
    return json({ error: "Connexion non configurée (ADMIN_PASSWORD, ADMIN_SESSION_SECRET)." }, 503);
  }
  const ip = clientIp(request);
  if (!(await rateLimit(`login:${ip}`, 5, 900))) {
    return json({ error: "Trop d'essais. Réessayez dans 15 minutes." }, 429);
  }
  const parsed = z.object({ password: z.string().min(1).max(200) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || !timingSafeEqual(digest(parsed.data.password), digest(password))) {
    await logEvent("warn", "admin.login_failed", "Mot de passe admin incorrect.", { data: { ip } });
    return json({ error: "Mot de passe incorrect." }, 401);
  }
  const response = json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DAYS * 86_400,
  });
  return response;
}
