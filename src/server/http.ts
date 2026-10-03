/** Aides communes aux routes API. */
import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getSessionSecret, verifySessionToken } from "@/lib/admin-session";
import { DatabaseNotConfiguredError } from "./db";

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value, getSessionSecret());
}

/** Refuse les requêtes d'écriture venant d'un autre site (protection CSRF). */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host || new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** Garde des routes admin : session valide + même origine pour les écritures. */
export async function guardAdmin(request: Request, write = false) {
  if (!(await isAdmin())) return json({ error: "Session expirée. Reconnectez-vous." }, 401);
  if (write && !isSameOrigin(request)) return json({ error: "Origine refusée." }, 403);
  return null;
}

export function serverError(error: unknown) {
  if (error instanceof DatabaseNotConfiguredError) {
    return json({ error: "Base de données non configurée (DATABASE_URL)." }, 503);
  }
  console.error(error);
  return json({ error: "Erreur serveur. Réessayez dans un instant." }, 500);
}
