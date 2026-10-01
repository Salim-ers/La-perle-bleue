/**
 * POST /api/webhooks/stripe — seule source de vérité du paiement (phase 2).
 *
 * À implémenter :
 *   1. Lire le corps BRUT (`await request.text()`) et vérifier la signature :
 *      stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature"), STRIPE_WEBHOOK_SECRET).
 *      Signature absente ou invalide -> 400, sans rien modifier.
 *   2. `checkout.session.completed` avec payment_status === "paid" :
 *      relire la commande (metadata.orderId), vérifier que amount_total === order.total,
 *      puis passer la commande de PENDING_PAYMENT à PAID (opération idempotente :
 *      Stripe peut envoyer le même événement plusieurs fois).
 *   3. `checkout.session.expired` / `payment_intent.payment_failed` : CANCELLED.
 *   4. Notifier le restaurant (back-office /admin en temps réel via Supabase Realtime).
 *   5. Répondre 200 rapidement ; Stripe relance en cas d'erreur.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ error: "Webhook Stripe non configuré." }, { status: 501 });
}
