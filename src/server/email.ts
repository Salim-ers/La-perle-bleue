/**
 * E-mails clients via Resend (RESEND_API_KEY, RESEND_FROM).
 * Idempotence : une ligne email_log (order_id, type) unique est posée AVANT
 * l'envoi ; un webhook rejoué ne renvoie donc jamais le même e-mail.
 * Un e-mail en échec n'interrompt jamais le traitement de la commande.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { restaurant } from "@/data/restaurant";
import { REFUSAL_REASONS, type RefusalReason } from "@/features/order/types";
import { fullAddress, phoneHref } from "@/lib/contact";
import { formatEuros } from "@/lib/money";
import { getBaseUrl } from "./base-url";
import { getDb } from "./db";
import { customers, emailLog, orderItems, orders } from "./db/schema";
import { logEvent } from "./logger";
import { formatParisTime } from "./time";

export type EmailType = "received" | "accepted" | "ready" | "cancelled";

const SUBJECTS: Record<EmailType, (n: number) => string> = {
  received: (n) => `Commande #${n} reçue — en attente de validation`,
  accepted: (n) => `Commande #${n} acceptée`,
  ready: (n) => `Commande #${n} prête à retirer`,
  cancelled: (n) => `Commande #${n} annulée`,
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function sendOrderEmail(orderId: string, type: EmailType) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  let logId: string | undefined;
  try {
    const db = await getDb();
    const claimed = await db
      .insert(emailLog)
      .values({ orderId, type, status: apiKey && from ? "sending" : "skipped" })
      .onConflictDoNothing()
      .returning({ id: emailLog.id });
    if (!claimed.length) return; // déjà envoyé (ou en cours)
    logId = claimed[0].id;
    if (!apiKey || !from) {
      await logEvent("warn", "email.failed", "Resend non configuré : e-mail non envoyé.", { orderId, data: { emailType: type } });
      return;
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { customer: true, items: { orderBy: (i, { asc }) => [asc(i.position)] } },
    });
    if (!order) return;
    const content = render(type, order as OrderForEmail);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${orderId}-${type}`,
      },
      body: JSON.stringify({
        from,
        to: [order.customer.email],
        subject: SUBJECTS[type](order.orderNumber),
        html: content.html,
        text: content.text,
        ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(`Resend ${res.status} : ${json.message ?? "erreur"}`);
    await db.update(emailLog).set({ status: "sent", providerId: json.id ?? null }).where(eq(emailLog.id, logId));
    await logEvent("info", "email.sent", `E-mail « ${type} » envoyé.`, { orderId });
  } catch (error) {
    await logEvent("error", "email.failed", `E-mail « ${type} » non envoyé : ${(error as Error).message}`, { orderId });
    if (logId) {
      try {
        const db = await getDb();
        await db.update(emailLog).set({ status: "failed", error: (error as Error).message.slice(0, 500) }).where(eq(emailLog.id, logId));
      } catch {}
    }
  }
}

type OrderForEmail = typeof orders.$inferSelect & {
  customer: typeof customers.$inferSelect;
  items: (typeof orderItems.$inferSelect)[];
};

function render(type: EmailType, order: OrderForEmail) {
  const base = getBaseUrl();
  const trackUrl = `${base}/suivi/${order.id}`;
  const pickup = order.pickupType === "ASAP" ? `dès que possible (vers ${formatParisTime(order.pickupTime)})` : `à ${formatParisTime(order.pickupTime)}`;
  const reason = order.cancelReason && order.cancelReason in REFUSAL_REASONS ? REFUSAL_REASONS[order.cancelReason as RefusalReason] : order.cancelReason;

  const intro: Record<EmailType, string> = {
    received: `Merci ${order.customer.firstName} ! Votre commande est transmise au restaurant. Votre carte est seulement autorisée : elle sera débitée quand la cuisine acceptera la commande.`,
    accepted: `Bonne nouvelle ${order.customer.firstName} : votre commande est acceptée et va être préparée.`,
    ready: `${order.customer.firstName}, votre commande est prête ! Elle vous attend au comptoir.`,
    cancelled: `Désolé ${order.customer.firstName}, votre commande a été annulée${reason ? ` (${reason.toLowerCase()})` : ""}. ${
      order.paymentStatus === "REFUNDED" ? "Le montant payé vous est remboursé." : "Aucun montant n'a été débité."
    }`,
  };

  const lines = order.items.map((i) => ({
    title: `${i.quantity} × ${i.productName}`,
    price: formatEuros(i.totalPrice),
    details: [...i.summary, ...(i.note ? [`« ${i.note} »`] : [])],
  }));

  const text = [
    `La Perle Bleue — commande #${order.orderNumber}`,
    "",
    intro[type],
    "",
    ...lines.flatMap((l) => [`${l.title} — ${l.price}`, ...l.details.map((d) => `  ${d}`)]),
    "",
    `Total : ${formatEuros(order.total)}`,
    `Retrait : ${pickup}`,
    fullAddress ? `Adresse : ${restaurant.name}, ${fullAddress}` : "",
    `Suivre la commande : ${trackUrl}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#06132e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#06132e;padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold">La Perle Bleue</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 4px;font-size:13px;color:#4a5b7a;text-transform:uppercase;letter-spacing:1px">Commande</p>
<p style="margin:0 0 16px;font-size:32px;font-weight:bold;color:#053b8c">#${order.orderNumber}</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5">${esc(intro[type])}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #d6e0ee">
${lines
  .map(
    (l) => `<tr><td style="padding:12px 0;border-bottom:1px solid #d6e0ee;font-size:15px"><strong>${esc(l.title)}</strong>${l.details
      .map((d) => `<br><span style="color:#4a5b7a;font-size:13px">${esc(d)}</span>`)
      .join("")}</td><td align="right" valign="top" style="padding:12px 0;border-bottom:1px solid #d6e0ee;font-size:15px;white-space:nowrap">${esc(l.price)}</td></tr>`,
  )
  .join("")}
<tr><td style="padding:14px 0;font-size:17px;font-weight:bold">Total</td><td align="right" style="padding:14px 0;font-size:17px;font-weight:bold">${esc(formatEuros(order.total))}</td></tr>
</table>
<p style="margin:16px 0 4px;font-size:15px"><strong>Retrait :</strong> ${esc(pickup)}</p>
${fullAddress ? `<p style="margin:0 0 4px;font-size:15px"><strong>Adresse :</strong> ${esc(`${restaurant.name}, ${fullAddress}`)}</p>` : ""}
${phoneHref ? `<p style="margin:0 0 4px;font-size:15px"><strong>Téléphone :</strong> ${esc(restaurant.phone)}</p>` : ""}
${type === "cancelled" ? "" : `<p style="margin:24px 0 0"><a href="${trackUrl}" style="display:inline-block;background:#0140b8;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">Suivre ma commande</a></p>`}
</td></tr></table>
<p style="font-size:12px;color:#4a5b7a;margin:16px 0 0">Commande à retirer sur place à La Perle Bleue.</p>
</td></tr></table></body></html>`;

  return { html, text };
}
