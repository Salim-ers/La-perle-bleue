/**
 * Création d'une commande et de son paiement Mollie.
 *
 * Ordre volontaire : la commande est enregistrée (PENDING_PAYMENT) AVANT la
 * création du paiement. Ainsi, quoi qu'il arrive ensuite, le webhook Mollie
 * retrouve toujours la commande : aucune transaction ne peut être perdue.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { orderingSettings } from "@/data/ordering";
import { priceOrder } from "@/features/order/checkout";
import { slotFor } from "@/features/order/pickup";
import type { CheckoutErrorCode, CheckoutRequest, Customer } from "@/features/order/types";
import { validateCustomer } from "@/features/order/validation";
import { parisNow, toMinutes } from "@/lib/hours";
import { getBaseUrl, getWebhookUrl } from "./base-url";
import { getDb } from "./db";
import { customers, orderItemOptions, orderItems, orderStatusHistory, orders, payments } from "./db/schema";
import { logEvent } from "./logger";
import { getPaymentProvider } from "./payments";
import { getLiveSettings, getPickupAvailability, getRestaurantId } from "./restaurant";
import { parisTodayAt } from "./time";

export type CheckoutResult =
  | { ok: true; orderId: string; checkoutUrl: string }
  | { ok: false; httpStatus: number; code: CheckoutErrorCode; message: string; total?: number; fieldErrors?: Partial<Record<keyof Customer, string>> };

const fail = (httpStatus: number, code: CheckoutErrorCode, message: string, extra = {}): CheckoutResult => ({
  ok: false,
  httpStatus,
  code,
  message,
  ...extra,
});

export async function createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const db = await getDb();

  // Double clic / rafraîchissement : même tentative -> même paiement.
  const existing = await db.query.orders.findFirst({
    where: eq(orders.idempotencyKey, request.attemptId),
    with: { payments: true },
  });
  if (existing) {
    const url = existing.payments[0]?.checkoutUrl;
    if (existing.status === "PENDING_PAYMENT" && url) return { ok: true, orderId: existing.id, checkoutUrl: url };
    return fail(409, "BAD_REQUEST", "Cette commande a déjà été envoyée. Rechargez la page.");
  }

  const payment = getPaymentProvider();
  const live = await getLiveSettings();
  if (!live.ordersEnabled || !payment.ok) {
    return fail(409, "ORDERS_PAUSED", "Les commandes en ligne sont temporairement suspendues.");
  }
  if (!orderingSettings.fulfillmentTypes.includes(request.fulfillment)) {
    return fail(422, "FULFILLMENT_UNAVAILABLE", "La livraison n'est pas disponible : retrait sur place uniquement.");
  }
  const fieldErrors = validateCustomer(request.customer);
  if (Object.keys(fieldErrors).length) return fail(422, "INVALID_CUSTOMER", "Vérifiez vos coordonnées.", { fieldErrors });

  // Prix, options et ruptures relus côté serveur : rien ne vient du navigateur.
  const priced = priceOrder(request.items, live);
  if (!priced.ok) return fail(422, "INVALID_ITEMS", priced.message);

  // Créneau : horaires, délai de préparation et capacité du créneau revérifiés maintenant.
  const availability = await getPickupAvailability();
  let pickupMinutes: number;
  if (request.pickup.type === "ASAP") {
    if (!availability.asap.available || !availability.asap.readyAt) {
      return fail(409, "PICKUP_UNAVAILABLE", "Le retrait « dès que possible » n'est plus disponible. Choisissez un créneau.", { total: priced.total });
    }
    pickupMinutes = parisNow().minutes + availability.preparationDelay;
  } else {
    const time = request.pickup.time;
    if (!availability.slots.some((s) => s.time === time && s.available)) {
      return fail(409, "PICKUP_UNAVAILABLE", "Ce créneau n'est plus disponible. Choisissez-en un autre.", { total: priced.total });
    }
    pickupMinutes = toMinutes(time);
  }
  const pickupTime = parisTodayAt(pickupMinutes);
  const pickupSlot = slotFor(pickupMinutes);

  const restaurantId = await getRestaurantId();
  const c = request.customer;
  const [customer] = await db
    .insert(customers)
    .values({ email: c.email, firstName: c.firstName, lastName: c.lastName, phone: c.phone })
    .onConflictDoUpdate({
      target: customers.email,
      set: { firstName: c.firstName, lastName: c.lastName, phone: c.phone, updatedAt: new Date() },
    })
    .returning({ id: customers.id });

  const orderId = randomUUID();
  let orderNumber: number;
  try {
    const [order] = await db
      .insert(orders)
      .values({
        id: orderId,
        restaurantId,
        customerId: customer.id,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        fulfillment: "PICKUP",
        pickupType: request.pickup.type,
        pickupTime,
        pickupSlot,
        subtotal: priced.subtotal,
        total: priced.total,
        notes: request.note || null,
        idempotencyKey: request.attemptId,
      })
      .returning({ orderNumber: orders.orderNumber });
    orderNumber = order.orderNumber;
  } catch (error) {
    // Deux requêtes simultanées avec la même tentative : la seconde rejoint la première.
    const twin = await db.query.orders.findFirst({ where: eq(orders.idempotencyKey, request.attemptId), with: { payments: true } });
    const url = twin?.payments[0]?.checkoutUrl;
    if (twin && url) return { ok: true, orderId: twin.id, checkoutUrl: url };
    throw error;
  }

  try {
    const itemRows = priced.lines.map((l, position) => ({
      id: randomUUID(),
      orderId,
      position,
      productId: l.productId,
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      totalPrice: l.totalPrice,
      note: l.note ?? null,
      summary: l.summary,
      kitchenLines: l.kitchenLines,
    }));
    await db.insert(orderItems).values(itemRows);
    const optionRows = priced.lines.flatMap((l, i) => l.options.map((o) => ({ ...o, orderItemId: itemRows[i].id })));
    if (optionRows.length) await db.insert(orderItemOptions).values(optionRows);
    await db.insert(orderStatusHistory).values({ orderId, toStatus: "PENDING_PAYMENT", paymentStatus: "PENDING", actor: "customer" });
  } catch (error) {
    await db.update(orders).set({ status: "CANCELLED", cancelReason: "Erreur d'enregistrement", cancelledAt: new Date() }).where(eq(orders.id, orderId));
    throw error;
  }
  await logEvent("info", "order.created", `Commande #${orderNumber} créée (${priced.total} cts).`, { orderId });

  // Paiement : ligne locale d'abord, puis Mollie.
  const paymentRowId = randomUUID();
  await db.insert(payments).values({ id: paymentRowId, orderId, provider: payment.provider.name, amount: priced.total, status: "PENDING" });
  try {
    const base = getBaseUrl();
    const created = await payment.provider.createPayment({
      orderId,
      orderNumber,
      amount: priced.total,
      description: `La Perle Bleue — commande #${orderNumber}`,
      redirectUrl: `${base}/suivi/${orderId}?retour=1`,
      cancelUrl: `${base}/commande?paiement=annule`,
      webhookUrl: getWebhookUrl("/api/webhooks/mollie"),
    });
    await db
      .update(payments)
      .set({ providerPaymentId: created.id, providerStatus: created.status, checkoutUrl: created.checkoutUrl, updatedAt: new Date() })
      .where(eq(payments.id, paymentRowId));
    await logEvent("info", "payment.created", `Paiement ${created.id} créé.`, { orderId });
    return { ok: true, orderId, checkoutUrl: created.checkoutUrl };
  } catch (error) {
    await db.update(payments).set({ status: "FAILED", updatedAt: new Date() }).where(eq(payments.id, paymentRowId));
    await db
      .update(orders)
      .set({ status: "CANCELLED", paymentStatus: "FAILED", cancelReason: "Paiement indisponible", cancelledAt: new Date() })
      .where(eq(orders.id, orderId));
    await logEvent("error", "checkout.error", `Création du paiement impossible : ${(error as Error).message}`, { orderId });
    return fail(502, "PAYMENT_UNAVAILABLE", "Le service de paiement ne répond pas. Réessayez dans un instant.");
  }
}
