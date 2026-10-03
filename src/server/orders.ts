/**
 * Cycle de vie des commandes et des paiements.
 *
 * Idempotence : chaque transition est UNE requête UPDATE … WHERE statut = attendu.
 * Si deux webhooks (ou deux clics) arrivent en même temps, un seul change la
 * ligne ; l'autre ne fait rien. Les e-mails ne partent que si la transition a
 * réellement eu lieu (et email_log empêche tout doublon).
 *
 *   PENDING_PAYMENT --(paiement autorisé)--> NEW --(cuisine accepte + capture)--> ACCEPTED
 *     --(commencer)--> PREPARING --(prête)--> READY --(récupérée)--> COMPLETED
 *   NEW | ACCEPTED --(refus)--> CANCELLED (autorisation libérée ou remboursement)
 */
import "server-only";
import { after } from "next/server";
import { and, asc, desc, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";
import type { KitchenOrder } from "@/features/kitchen/types";
import type { KitchenAction, OrderStatus, PaymentStatus, PublicOrderStatus, RefusalReason } from "@/features/order/types";
import { orderingSettings } from "@/data/ordering";
import { getDb } from "./db";
import { orderStatusHistory, orders, payments } from "./db/schema";
import { sendOrderEmail, type EmailType } from "./email";
import { logEvent } from "./logger";
import { getProviderByName } from "./payments";
import type { ProviderPayment } from "./payments/types";
import { getRestaurantId } from "./restaurant";
import { formatParisTime } from "./time";

type Actor = "customer" | "kitchen" | "webhook" | "system";

/** Envoi après la réponse HTTP (ne ralentit ni la cuisine ni le webhook). */
function later(task: () => Promise<unknown>) {
  try {
    after(task);
  } catch {
    void task();
  }
}
const email = (orderId: string, type: EmailType) => later(() => sendOrderEmail(orderId, type));

async function transition(input: {
  orderId: string;
  from: OrderStatus[];
  to: OrderStatus;
  set?: Partial<typeof orders.$inferInsert>;
  actor: Actor;
  note?: string;
}) {
  const db = await getDb();
  const [row] = await db
    .update(orders)
    .set({ ...input.set, status: input.to, updatedAt: new Date() })
    .where(and(eq(orders.id, input.orderId), inArray(orders.status, input.from)))
    .returning();
  if (!row) return null;
  await db.insert(orderStatusHistory).values({
    orderId: input.orderId,
    fromStatus: input.from.length === 1 ? input.from[0] : null,
    toStatus: input.to,
    paymentStatus: row.paymentStatus,
    actor: input.actor,
    note: input.note,
  });
  return row;
}

async function setPaymentStatus(paymentId: string, from: PaymentStatus[], to: PaymentStatus, set: Partial<typeof payments.$inferInsert> = {}) {
  const db = await getDb();
  const [row] = await db
    .update(payments)
    .set({ ...set, status: to, updatedAt: new Date() })
    .where(and(eq(payments.id, paymentId), inArray(payments.status, from)))
    .returning();
  return row ?? null;
}

// ——— Synchronisation avec le fournisseur (webhook, retour client, cuisine) ———

/**
 * Relit le statut RÉEL chez Mollie et met la commande à jour. Seule source de
 * vérité du paiement : le navigateur ne peut rien déclarer lui-même.
 * Lève une erreur si la base est indisponible -> le webhook répond 500 et Mollie réessaie.
 */
export async function syncPayment(providerPaymentId: string, actor: Actor = "webhook") {
  const db = await getDb();
  const row = await db.query.payments.findFirst({ where: eq(payments.providerPaymentId, providerPaymentId), with: { order: true } });
  if (!row) {
    await logEvent("warn", "webhook.unknown_payment", `Paiement inconnu : ${providerPaymentId}`);
    return null;
  }
  const provider = getProviderByName(row.provider);
  if (!provider) throw new Error(`Fournisseur « ${row.provider} » non configuré.`);
  const remote = await provider.getPayment(providerPaymentId);
  if (row.provider === "mollie") {
    await db.update(payments).set({ providerStatus: remote.status, updatedAt: new Date() }).where(eq(payments.id, row.id));
  }

  const orderId = row.orderId;
  switch (remote.status) {
    case "authorized": {
      await setPaymentStatus(row.id, ["PENDING"], "AUTHORIZED", { authorizedAt: new Date() });
      const order = await transition({ orderId, from: ["PENDING_PAYMENT"], to: "NEW", set: { paymentStatus: "AUTHORIZED" }, actor, note: "Paiement autorisé" });
      if (order) {
        await logEvent("info", "payment.authorized", `Commande #${order.orderNumber} : paiement autorisé.`, { orderId });
        email(orderId, "received");
      } else if (row.order.status === "CANCELLED") {
        await releaseLateAuthorization(row.id, providerPaymentId, row.provider, orderId);
      }
      break;
    }
    case "paid": {
      if (remote.amount > 0 && remote.amountRefunded >= remote.amount) {
        await onRefunded(row.id, orderId, remote);
        break;
      }
      await setPaymentStatus(row.id, ["PENDING", "AUTHORIZED"], "CAPTURED", { capturedAt: new Date() });
      // Méthode sans capture différée ou capture faite depuis Mollie : la commande doit quand même arriver en cuisine.
      const order = await transition({ orderId, from: ["PENDING_PAYMENT"], to: "NEW", set: { paymentStatus: "CAPTURED" }, actor, note: "Paiement encaissé" });
      if (order) {
        email(orderId, "received");
      } else {
        await db
          .update(orders)
          .set({ paymentStatus: "CAPTURED", updatedAt: new Date() })
          .where(and(eq(orders.id, orderId), ne(orders.status, "CANCELLED"), inArray(orders.paymentStatus, ["PENDING", "AUTHORIZED"])));
        const fresh = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
        if (fresh?.status === "CANCELLED" && fresh.paymentStatus !== "REFUNDED") {
          await logEvent("error", "payment.captured", "Paiement encaissé sur une commande annulée : remboursement automatique.", { orderId });
          await refundPayment(row.id, providerPaymentId, row.provider, remote.amount, orderId);
        }
      }
      break;
    }
    case "canceled":
    case "expired": {
      await setPaymentStatus(row.id, ["PENDING", "AUTHORIZED"], "CANCELLED", { cancelledAt: new Date() });
      const abandoned = await transition({
        orderId,
        from: ["PENDING_PAYMENT"],
        to: "CANCELLED",
        set: { paymentStatus: "CANCELLED", cancelledAt: new Date(), cancelReason: "Paiement non finalisé" },
        actor,
      });
      if (!abandoned) {
        const expired = await transition({
          orderId,
          from: ["NEW"],
          to: "CANCELLED",
          set: { paymentStatus: "CANCELLED", cancelledAt: new Date(), cancelReason: "Autorisation de paiement expirée" },
          actor,
        });
        if (expired) email(orderId, "cancelled");
      }
      await logEvent("info", "payment.cancelled", `Paiement ${remote.status}.`, { orderId });
      break;
    }
    case "failed": {
      await setPaymentStatus(row.id, ["PENDING"], "FAILED");
      await transition({
        orderId,
        from: ["PENDING_PAYMENT"],
        to: "CANCELLED",
        set: { paymentStatus: "FAILED", cancelledAt: new Date(), cancelReason: "Paiement refusé" },
        actor,
      });
      await logEvent("warn", "payment.failed", "Paiement refusé par la banque.", { orderId });
      break;
    }
    default:
      break; // open / pending : le client n'a pas encore terminé
  }
  return db.query.orders.findFirst({ where: eq(orders.id, orderId) });
}

async function onRefunded(paymentRowId: string, orderId: string, remote: ProviderPayment) {
  const db = await getDb();
  const updated = await setPaymentStatus(paymentRowId, ["CAPTURED", "AUTHORIZED", "PENDING"], "REFUNDED", { refundedAmount: remote.amountRefunded });
  await db.update(orders).set({ paymentStatus: "REFUNDED", updatedAt: new Date() }).where(eq(orders.id, orderId));
  if (updated) await logEvent("info", "payment.refunded", "Paiement remboursé.", { orderId });
}

async function releaseLateAuthorization(paymentRowId: string, providerPaymentId: string, providerName: "mollie" | "mock", orderId: string) {
  const provider = getProviderByName(providerName);
  try {
    await provider?.cancel(providerPaymentId);
    await setPaymentStatus(paymentRowId, ["PENDING", "AUTHORIZED"], "CANCELLED", { cancelledAt: new Date() });
    await logEvent("warn", "payment.late_authorization", "Autorisation reçue sur une commande déjà annulée : libérée.", { orderId });
  } catch (error) {
    await logEvent("error", "payment.cancel_failed", `Autorisation tardive non libérée : ${(error as Error).message}`, { orderId });
  }
}

async function refundPayment(paymentRowId: string, providerPaymentId: string, providerName: "mollie" | "mock", amount: number, orderId: string) {
  const provider = getProviderByName(providerName);
  if (!provider) throw new Error("Fournisseur de paiement non configuré.");
  await provider.refund(providerPaymentId, amount, `refund-${orderId}`);
  const db = await getDb();
  await setPaymentStatus(paymentRowId, ["CAPTURED"], "REFUNDED", { refundedAmount: amount });
  await db.update(orders).set({ paymentStatus: "REFUNDED", updatedAt: new Date() }).where(eq(orders.id, orderId));
  await logEvent("info", "payment.refunded", "Commande remboursée.", { orderId });
}

// ——— Actions cuisine ———

export type ActionResult = { ok: true; status: OrderStatus } | { ok: false; httpStatus: number; message: string };

async function loadForAction(orderId: string) {
  const db = await getDb();
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.restaurantId, await getRestaurantId())),
    with: { payments: { orderBy: (p, { desc: d }) => [d(p.createdAt)], limit: 1 } },
  });
  return order ? { order, payment: order.payments[0] ?? null } : null;
}

export async function kitchenAction(orderId: string, action: KitchenAction, reason?: RefusalReason): Promise<ActionResult> {
  const loaded = await loadForAction(orderId);
  if (!loaded) return { ok: false, httpStatus: 404, message: "Commande introuvable." };
  switch (action) {
    case "accept":
      return acceptOrder(loaded);
    case "refuse":
      return refuseOrder(loaded, reason);
    case "start":
      return advance(loaded.order, ["ACCEPTED"], "PREPARING", {});
    case "ready": {
      const result = await advance(loaded.order, ["PREPARING", "ACCEPTED"], "READY", { readyAt: new Date() });
      if (result.ok && loaded.order.status !== "READY") email(orderId, "ready");
      return result;
    }
    case "complete":
      return advance(loaded.order, ["READY"], "COMPLETED", { completedAt: new Date() });
  }
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadForAction>>>;

async function advance(order: Loaded["order"], from: OrderStatus[], to: OrderStatus, set: Partial<typeof orders.$inferInsert>): Promise<ActionResult> {
  if (order.status === to) return { ok: true, status: to }; // double clic : déjà fait
  const row = await transition({ orderId: order.id, from, to, set, actor: "kitchen" });
  if (!row) return { ok: false, httpStatus: 409, message: "La commande a changé entre-temps. Actualisation…" };
  await logEvent("info", "order.status", `Commande #${row.orderNumber} : ${to}.`, { orderId: order.id });
  return { ok: true, status: to };
}

async function acceptOrder({ order, payment }: Loaded): Promise<ActionResult> {
  if (order.status === "ACCEPTED") return { ok: true, status: "ACCEPTED" };
  if (order.status !== "NEW") return { ok: false, httpStatus: 409, message: "Cette commande n'est plus en attente." };
  if (!payment) return { ok: false, httpStatus: 409, message: "Aucun paiement associé." };
  const db = await getDb();

  if (payment.status === "AUTHORIZED") {
    // Verrou : un seul clic déclenche la capture (le verrou expire après 2 min si le serveur plante).
    const [locked] = await db
      .update(payments)
      .set({ captureRequestedAt: new Date() })
      .where(
        and(
          eq(payments.id, payment.id),
          eq(payments.status, "AUTHORIZED"),
          or(isNull(payments.captureRequestedAt), lt(payments.captureRequestedAt, new Date(Date.now() - 120_000))),
        ),
      )
      .returning();
    if (!locked) return { ok: false, httpStatus: 409, message: "Encaissement déjà en cours…" };

    const provider = getProviderByName(payment.provider);
    try {
      if (!provider || !payment.providerPaymentId) throw new Error("Fournisseur de paiement non configuré.");
      const { captureId } = await provider.capture(payment.providerPaymentId, payment.amount, `capture-${order.id}`);
      await setPaymentStatus(payment.id, ["AUTHORIZED"], "CAPTURED", { captureId, capturedAt: new Date() });
      await logEvent("info", "payment.captured", `Commande #${order.orderNumber} : paiement encaissé.`, { orderId: order.id });
    } catch (error) {
      await db.update(payments).set({ captureRequestedAt: null }).where(eq(payments.id, payment.id));
      await logEvent("error", "payment.capture_failed", `Capture refusée : ${(error as Error).message}`, { orderId: order.id });
      return { ok: false, httpStatus: 502, message: "Le paiement n'a pas pu être encaissé. Réessayez ou refusez la commande." };
    }
  } else if (payment.status !== "CAPTURED") {
    return { ok: false, httpStatus: 409, message: "Le paiement n'est pas autorisé." };
  }

  const row = await transition({
    orderId: order.id,
    from: ["NEW"],
    to: "ACCEPTED",
    set: { paymentStatus: "CAPTURED", acceptedAt: new Date() },
    actor: "kitchen",
  });
  if (row) {
    await logEvent("info", "order.accepted", `Commande #${row.orderNumber} acceptée.`, { orderId: order.id });
    email(order.id, "accepted");
  }
  return { ok: true, status: "ACCEPTED" };
}

async function refuseOrder({ order, payment }: Loaded, reason?: RefusalReason): Promise<ActionResult> {
  if (order.status === "CANCELLED") return { ok: true, status: "CANCELLED" };
  if (order.status !== "NEW" && order.status !== "ACCEPTED") {
    return { ok: false, httpStatus: 409, message: "Une commande en préparation ne peut plus être refusée ici." };
  }
  let paymentStatus: PaymentStatus = order.paymentStatus;
  if (payment?.providerPaymentId) {
    const provider = getProviderByName(payment.provider);
    if (payment.status === "AUTHORIZED") {
      try {
        await provider?.cancel(payment.providerPaymentId);
        await logEvent("info", "payment.cancelled", "Autorisation libérée (refus cuisine).", { orderId: order.id });
      } catch (error) {
        // Une autorisation non capturée expire d'elle-même : le client n'est jamais débité.
        await logEvent("warn", "payment.cancel_failed", `Libération impossible (expirera seule) : ${(error as Error).message}`, { orderId: order.id });
      }
      await setPaymentStatus(payment.id, ["AUTHORIZED"], "CANCELLED", { cancelledAt: new Date() });
      paymentStatus = "CANCELLED";
    } else if (payment.status === "CAPTURED") {
      try {
        await refundPayment(payment.id, payment.providerPaymentId, payment.provider, payment.amount, order.id);
        paymentStatus = "REFUNDED";
      } catch (error) {
        await logEvent("error", "payment.refund_failed", `Remboursement impossible : ${(error as Error).message}`, { orderId: order.id });
        return { ok: false, httpStatus: 502, message: "Remboursement impossible. Faites-le depuis le tableau de bord Mollie, puis réessayez." };
      }
    }
  }
  const row = await transition({
    orderId: order.id,
    from: ["NEW", "ACCEPTED"],
    to: "CANCELLED",
    set: { paymentStatus, cancelReason: reason ?? "autre", cancelledAt: new Date() },
    actor: "kitchen",
    note: reason,
  });
  if (row) {
    await logEvent("info", "order.cancelled", `Commande #${row.orderNumber} refusée (${reason ?? "autre"}).`, { orderId: order.id });
    email(order.id, "cancelled");
  }
  return { ok: true, status: "CANCELLED" };
}

// ——— Lectures ———

const KITCHEN_STATUSES: OrderStatus[] = ["NEW", "ACCEPTED", "PREPARING", "READY"];

export async function listKitchenOrders(): Promise<KitchenOrder[]> {
  const db = await getDb();
  const rows = await db.query.orders.findMany({
    where: and(eq(orders.restaurantId, await getRestaurantId()), inArray(orders.status, KITCHEN_STATUSES)),
    orderBy: [asc(orders.pickupTime), asc(orders.orderNumber)],
    with: {
      customer: { columns: { firstName: true, lastName: true, phone: true } },
      items: { orderBy: (i, { asc: a }) => [a(i.position)] },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    number: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt.toISOString(),
    createdLabel: formatParisTime(o.createdAt),
    pickupType: o.pickupType,
    pickupLabel: formatParisTime(o.pickupTime),
    total: o.total,
    notes: o.notes,
    customer: {
      name: `${o.customer.firstName} ${o.customer.lastName.charAt(0).toUpperCase()}.`,
      phone: o.customer.phone,
    },
    items: o.items.map((i) => ({ quantity: i.quantity, productName: i.productName, kitchenLines: i.kitchenLines, note: i.note })),
  }));
}

export async function getPublicOrder(orderId: string): Promise<PublicOrderStatus | null> {
  const db = await getDb();
  const o = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { customer: { columns: { firstName: true } }, items: { orderBy: (i, { asc: a }) => [a(i.position)] } },
  });
  if (!o) return null;
  return {
    id: o.id,
    number: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    pickupType: o.pickupType,
    pickupAt: formatParisTime(o.pickupTime),
    total: o.total,
    firstName: o.customer.firstName,
    items: o.items.map((i) => ({ quantity: i.quantity, productName: i.productName, summary: i.summary })),
    createdAt: o.createdAt.toISOString(),
    cancelReason: o.cancelReason ?? undefined,
  };
}

/** Si la commande attend encore son paiement, relit Mollie (webhook perdu, retour client). */
export async function refreshPendingOrder(orderId: string) {
  const db = await getDb();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { payments: { orderBy: (p, { desc: d }) => [d(p.createdAt)], limit: 1 } },
  });
  const payment = order?.payments[0];
  if (order?.status === "PENDING_PAYMENT" && payment?.providerPaymentId) {
    try {
      await syncPayment(payment.providerPaymentId, "customer");
    } catch (error) {
      await logEvent("error", "webhook.error", `Relecture du paiement impossible : ${(error as Error).message}`, { orderId });
    }
  }
}

/**
 * Filet de sécurité appelé par la cuisine (au plus une fois par minute) :
 * relit les paiements restés « en cours » (webhook perdu) et annule les
 * paiements abandonnés depuis plus de 30 minutes.
 */
export async function reconcilePendingPayments() {
  const state = globalThis as unknown as { __lpbReconcile?: number };
  if (state.__lpbReconcile && Date.now() - state.__lpbReconcile < 60_000) return;
  state.__lpbReconcile = Date.now();
  const db = await getDb();
  const pending = await db.query.orders.findMany({
    where: and(eq(orders.status, "PENDING_PAYMENT"), lt(orders.createdAt, new Date(Date.now() - 2 * 60_000))),
    with: { payments: { orderBy: (p, { desc: d }) => [d(p.createdAt)], limit: 1 } },
    orderBy: [desc(orders.createdAt)],
    limit: 10,
  });
  for (const order of pending) {
    const payment = order.payments[0];
    try {
      if (payment?.providerPaymentId) await syncPayment(payment.providerPaymentId, "system");
      const timeout = orderingSettings.pendingPaymentTimeoutMinutes * 60_000;
      if (Date.now() - order.createdAt.getTime() > timeout) {
        const cancelled = await transition({
          orderId: order.id,
          from: ["PENDING_PAYMENT"],
          to: "CANCELLED",
          set: { paymentStatus: "CANCELLED", cancelledAt: new Date(), cancelReason: "Paiement abandonné" },
          actor: "system",
        });
        if (cancelled && payment) {
          await setPaymentStatus(payment.id, ["PENDING"], "CANCELLED", { cancelledAt: new Date() });
          if (payment.providerPaymentId) await getProviderByName(payment.provider)?.cancel(payment.providerPaymentId).catch(() => {});
        }
      }
    } catch (error) {
      await logEvent("error", "webhook.error", `Rapprochement impossible : ${(error as Error).message}`, { orderId: order.id });
    }
  }
}
