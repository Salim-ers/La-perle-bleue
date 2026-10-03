/**
 * URL publique utilisée dans les e-mails, le retour de paiement et le webhook.
 * - production : NEXT_PUBLIC_SITE_URL (domaine final, ex. https://laperlebleue.fr), obligatoire ;
 * - preview Vercel : l'URL du déploiement (paiements de test reçus par la base de preview) ;
 * - développement : NEXT_PUBLIC_SITE_URL ou http://localhost:3000.
 * Aucun domaine *.vercel.app n'est écrit en dur.
 */
import "server-only";

export function getBaseUrl() {
  if (process.env.VERCEL_ENV === "preview") {
    const host = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
    if (host) return `https://${host}`;
  }
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL doit être définie en production (domaine final).");
  }
  return "http://localhost:3000";
}

/**
 * URL du webhook de paiement. `null` en local : Mollie ne peut pas joindre localhost
 * (le statut est alors relu au retour du client et par la cuisine).
 * Sur un déploiement preview protégé, ajoute le jeton de contournement Vercel.
 */
export function getWebhookUrl(path: string) {
  const base = getBaseUrl();
  if (/\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(base)) return null;
  const url = new URL(path, base);
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (process.env.VERCEL_ENV === "preview" && bypass) url.searchParams.set("x-vercel-protection-bypass", bypass);
  return url.toString();
}
