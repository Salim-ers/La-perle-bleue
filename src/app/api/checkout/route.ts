/**
 * POST /api/checkout — crée la commande puis le paiement Mollie (autorisation).
 *
 * Le navigateur n'envoie que des identifiants (produits, options), des
 * quantités, ses coordonnées et l'heure de retrait. Total, prix et
 * suppléments sont TOUJOURS recalculés ici : un total envoyé est ignoré.
 */
import { checkoutRequestSchema } from "@/features/order/schemas";
import type { CheckoutResponse } from "@/features/order/types";
import { createCheckout } from "@/server/checkout";
import { json, serverError } from "@/server/http";
import { logEvent } from "@/server/logger";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (status: number, body: CheckoutResponse) => json(body, status);

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 32_000) return reply(413, { ok: false, code: "BAD_REQUEST", message: "Requête trop volumineuse." });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false, code: "BAD_REQUEST", message: "Requête invalide." });
  }
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return reply(400, { ok: false, code: "BAD_REQUEST", message: "Commande invalide. Rechargez la page et réessayez." });
  }

  try {
    // 20 tentatives / 10 min : plusieurs clients d'un même réseau mobile peuvent partager une IP.
    if (!(await rateLimit(`checkout:${clientIp(request)}`, 20, 600))) {
      return reply(429, { ok: false, code: "RATE_LIMITED", message: "Trop de tentatives. Patientez quelques minutes." });
    }
    const result = await createCheckout(parsed.data);
    if (result.ok) return reply(200, result);
    const { httpStatus, ...error } = result;
    return reply(httpStatus, error);
  } catch (error) {
    await logEvent("error", "checkout.error", `Checkout en erreur : ${(error as Error).message}`);
    if ((error as Error).name === "DatabaseNotConfiguredError") return serverError(error);
    return reply(500, { ok: false, code: "SERVER_ERROR", message: "Erreur serveur. Votre carte n'a pas été débitée. Réessayez." });
  }
}
