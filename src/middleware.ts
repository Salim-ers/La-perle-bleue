/**
 * Protège l'admin cuisine et ses API. Les routes revérifient aussi la session
 * (défense en profondeur). Fichiers PWA et page de connexion restent publics.
 */
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, getSessionSecret, verifySessionToken } from "@/lib/admin-session";

const PUBLIC = [
  /^\/admin\/login\/?$/,
  /^\/api\/admin\/login\/?$/,
  /^\/admin\/manifest\.webmanifest$/,
  /^\/admin\/sw\.js$/,
  /^\/admin\/offline\.html$/,
  /^\/admin\/icons\//,
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((r) => r.test(pathname))) return withAdminHeaders(NextResponse.next());

  const ok = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value, getSessionSecret());
  if (ok) return withAdminHeaders(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("suite", pathname + search);
  return NextResponse.redirect(login);
}

function withAdminHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/kitchen/:path*", "/api/admin/:path*"],
};
