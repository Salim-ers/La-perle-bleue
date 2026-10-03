/**
 * Journal minimal : console (visible dans les logs Vercel) + table event_logs.
 * Ne lève jamais d'erreur : un journal en panne ne doit pas bloquer une commande.
 */
import "server-only";
import { getDb } from "./db";
import { eventLogs } from "./db/schema";

export type LogType =
  | "order.created"
  | "payment.created"
  | "payment.authorized"
  | "payment.captured"
  | "payment.capture_failed"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.cancel_failed"
  | "payment.refunded"
  | "payment.refund_failed"
  | "payment.late_authorization"
  | "order.accepted"
  | "order.cancelled"
  | "order.status"
  | "webhook.error"
  | "webhook.unknown_payment"
  | "email.sent"
  | "email.failed"
  | "admin.login_failed"
  | "admin.settings"
  | "checkout.error"
  | "config.error";

export async function logEvent(
  level: "info" | "warn" | "error",
  type: LogType,
  message: string,
  extra: { orderId?: string; data?: Record<string, unknown> } = {},
) {
  const line = JSON.stringify({ ...extra.data, level, type, message, orderId: extra.orderId });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  try {
    const db = await getDb();
    await db.insert(eventLogs).values({ level, type, message, orderId: extra.orderId, data: extra.data ?? null });
  } catch {
    // Base indisponible : la ligne reste dans les logs Vercel.
  }
}
