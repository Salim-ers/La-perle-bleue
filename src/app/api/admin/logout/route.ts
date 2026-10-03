import { ADMIN_COOKIE } from "@/lib/admin-session";
import { isSameOrigin, json } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origine refusée." }, 403);
  const response = json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
