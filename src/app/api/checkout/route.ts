/**
 * POST /api/checkout — création du paiement d'une commande à emporter.
 *
 * Règle d'or : le navigateur n'envoie que des identifiants (produits, options)
 * et des quantités. Le serveur relit le catalogue, vérifie la disponibilité,
 * recalcule chaque prix avec calculateItemPrice() et refuse toute donnée
 * invalide. Le montant payé ne vient JAMAIS du navigateur.
 *
 * Flux complet (phase 2, Stripe + Supabase) :
 *   1. Le client clique sur « Payer ».
 *   2. Le serveur relit produits et options en base (aujourd'hui : catalogue statique).
 *   3. Le serveur recalcule le total et vérifie le créneau de retrait.
 *   4. Il enregistre la commande en PENDING_PAYMENT puis crée une Stripe Checkout
 *      Session avec ces montants (price_data en centimes, metadata.orderId).
 *   5. Stripe encaisse le paiement sur sa page sécurisée.
 *   6. Le webhook signé /api/webhooks/stripe reçoit checkout.session.completed.
 *   7. La commande passe en PAID (et seulement à ce moment-là).
 * La redirection vers /commande/succes n'est jamais une preuve de paiement.
 */
import { NextResponse } from "next/server";
import { orderingSettings } from "@/data/ordering";
import { priceOrder } from "@/features/order/checkout";
import { isPickupAvailable } from "@/features/order/pickup";
import type { CheckoutResponse } from "@/features/order/types";
import { parseCheckoutRequest, validateCustomer } from "@/features/order/validation";
import { formatEuros } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_LENGTH = 32_000;

const reply = (status: number, body: CheckoutResponse) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  // TODO(phase 2) : limitation de débit par IP (Vercel KV / Upstash) avant toute écriture en base.
  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) {
    return reply(413, { ok: false, code: "BAD_REQUEST", message: "Requête trop volumineuse." });
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false, code: "BAD_REQUEST", message: "Requête invalide." });
  }

  const parsed = parseCheckoutRequest(json);
  if (!parsed.ok) return reply(400, { ok: false, code: "BAD_REQUEST", message: parsed.message });
  const order = parsed.value;

  if (!orderingSettings.fulfillmentTypes.includes(order.fulfillment)) {
    return reply(422, {
      ok: false,
      code: "FULFILLMENT_UNAVAILABLE",
      message: "La livraison n'est pas disponible : retrait sur place uniquement.",
    });
  }

  const fieldErrors = validateCustomer(order.customer);
  if (Object.keys(fieldErrors).length > 0) {
    return reply(422, { ok: false, code: "INVALID_CUSTOMER", message: "Vérifiez vos coordonnées.", fieldErrors });
  }

  // 2 + 3. Catalogue relu, disponibilités vérifiées, prix recalculés côté serveur.
  const priced = priceOrder(order.items);
  if (!priced.ok) return reply(422, { ok: false, code: "INVALID_ITEMS", message: priced.message });

  if (!isPickupAvailable(order.pickup)) {
    return reply(409, {
      ok: false,
      code: "PICKUP_UNAVAILABLE",
      message: "Ce créneau de retrait n'est plus disponible. Choisissez-en un autre.",
      total: priced.total,
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // Paiement pas encore branché : on le dit clairement, sans rien enregistrer ni simuler.
    return reply(503, {
      ok: false,
      code: "PAYMENT_UNAVAILABLE",
      message: `Le paiement en ligne ouvre très bientôt. Votre panier (${formatEuros(priced.total)}) est conservé : en attendant, commandez directement au comptoir.`,
      total: priced.total,
    });
  }

  // 4. TODO(phase 2) — à implémenter avec `npm install stripe` et Supabase :
  //   const orderId = await createOrder({ ...order, items: priced.items, total: priced.total, status: "PENDING_PAYMENT" });
  //   const session = await stripe.checkout.sessions.create({
  //     mode: "payment",
  //     currency: "eur",
  //     line_items: priced.items.map((l) => ({
  //       quantity: l.quantity,
  //       price_data: { currency: "eur", unit_amount: l.unitPrice, product_data: { name: l.productName } },
  //     })),
  //     customer_email: order.customer.email,
  //     metadata: { orderId },
  //     success_url: `${siteUrl}/commande/succes?commande=${orderId}`,
  //     cancel_url: `${siteUrl}/commande`,
  //   }, { idempotencyKey: orderId });
  //   await attachCheckoutSession(orderId, session.id);
  //   return reply(200, { ok: true, checkoutUrl: session.url! });
  return reply(501, {
    ok: false,
    code: "PAYMENT_UNAVAILABLE",
    message: "Le paiement en ligne n'est pas encore activé.",
    total: priced.total,
  });
}
