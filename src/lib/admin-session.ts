/**
 * Session admin : jeton signé (HMAC-SHA256) dans un cookie httpOnly.
 * Compatible middleware (Web Crypto). Changer ADMIN_SESSION_SECRET déconnecte
 * toutes les tablettes. Durée longue (30 jours) : la tablette cuisine reste
 * connectée pendant le service.
 */
export const ADMIN_COOKIE = "lpb_admin";
export const ADMIN_SESSION_DAYS = 30;

const encoder = new TextEncoder();

function base64url(buffer: ArrayBuffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export async function createSessionToken(secret: string) {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_DAYS * 86_400;
  return `${expires}.${await sign(secret, `admin:${expires}`)}`;
}

export async function verifySessionToken(token: string | undefined | null, secret: string | null) {
  if (!token || !secret) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(signature, await sign(secret, `admin:${expires}`));
}
