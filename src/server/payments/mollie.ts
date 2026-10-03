/**
 * Mollie (API v2, appels HTTP directs). Le compte Mollie appartient au restaurant ;
 * la clé est uniquement dans les variables d'environnement Vercel (MOLLIE_API_KEY).
 *
 * Paiement en deux temps (`captureMode: "manual"`) :
 *   1. le client autorise sa carte sur la page Mollie -> statut « authorized » ;
 *   2. la cuisine accepte -> capture (débit réel) ; ou refuse -> annulation (autorisation libérée).
 * Méthodes : MOLLIE_METHODS (défaut « creditcard ») ; seules les méthodes compatibles
 * avec la capture manuelle doivent y figurer.
 */
import "server-only";
import { PaymentProviderError, type CreatePaymentInput, type PaymentProvider, type ProviderPayment } from "./types";

const API = "https://api.mollie.com/v2";

const toValue = (cents: number) => (cents / 100).toFixed(2);
const toCents = (value: string | undefined) => (value ? Math.round(Number(value) * 100) : 0);

interface MolliePayment {
  id: string;
  status: ProviderPayment["status"];
  amount: { value: string };
  amountRefunded?: { value: string };
  isCancelable?: boolean;
  _links: { checkout?: { href: string } };
}

export function createMollieProvider(apiKey: string): PaymentProvider {
  async function call<T>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}) {
    const res = await fetch(`${API}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (res.status === 204) return null as T;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = (json as { detail?: string; title?: string }).detail ?? (json as { title?: string }).title;
      throw new PaymentProviderError(`Mollie ${res.status} : ${detail ?? "erreur inconnue"}`, res.status);
    }
    return json as T;
  }

  const methods = (process.env.MOLLIE_METHODS ?? "creditcard")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    name: "mollie",

    async createPayment(input: CreatePaymentInput) {
      const payment = await call<MolliePayment>("/payments", {
        method: "POST",
        idempotencyKey: `create-${input.orderId}`,
        body: {
          amount: { currency: "EUR", value: toValue(input.amount) },
          description: input.description,
          redirectUrl: input.redirectUrl,
          cancelUrl: input.cancelUrl,
          ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
          captureMode: "manual",
          method: methods,
          locale: "fr_FR",
          metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
        },
      });
      const checkoutUrl = payment._links.checkout?.href;
      if (!checkoutUrl) throw new PaymentProviderError("Mollie n'a pas renvoyé de page de paiement.");
      return { id: payment.id, checkoutUrl, status: payment.status };
    },

    async getPayment(id) {
      const p = await call<MolliePayment>(`/payments/${encodeURIComponent(id)}`);
      return {
        id: p.id,
        status: p.status,
        amount: toCents(p.amount.value),
        amountRefunded: toCents(p.amountRefunded?.value),
        isCancelable: !!p.isCancelable,
      };
    },

    async capture(id, amount, idempotencyKey) {
      const capture = await call<{ id: string }>(`/payments/${encodeURIComponent(id)}/captures`, {
        method: "POST",
        idempotencyKey,
        body: { amount: { currency: "EUR", value: toValue(amount) } },
      });
      return { captureId: capture.id };
    },

    async cancel(id) {
      await call(`/payments/${encodeURIComponent(id)}`, { method: "DELETE" });
    },

    async refund(id, amount, idempotencyKey) {
      await call(`/payments/${encodeURIComponent(id)}/refunds`, {
        method: "POST",
        idempotencyKey,
        body: { amount: { currency: "EUR", value: toValue(amount) }, description: "Commande annulée par le restaurant" },
      });
    },
  };
}
