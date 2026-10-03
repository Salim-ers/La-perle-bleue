/**
 * Faux fournisseur de paiement pour les tests LOCAUX (aucune carte, aucun appel externe).
 * Activé seulement si PAYMENT_PROVIDER=mock ET hors production Vercel.
 * L'état est stocké dans payments.provider_status ; la page /paiement-test/[id]
 * simule la page Mollie (autoriser / refuser / abandonner).
 */
import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { payments } from "../db/schema";
import type { PaymentProvider, ProviderStatus } from "./types";
import { PaymentProviderError } from "./types";

export const isMockPaymentsAllowed = () =>
  process.env.PAYMENT_PROVIDER === "mock" && process.env.VERCEL_ENV !== "production";

async function setStatus(id: string, status: ProviderStatus) {
  const db = await getDb();
  await db.update(payments).set({ providerStatus: status }).where(eq(payments.providerPaymentId, id));
}

export function createMockProvider(baseUrl: string): PaymentProvider {
  return {
    name: "mock",
    async createPayment(input) {
      const id = `mock_${input.orderId}`;
      return { id, checkoutUrl: `${baseUrl}/paiement-test/${id}`, status: "open" };
    },
    async getPayment(id) {
      const db = await getDb();
      const [row] = await db.select().from(payments).where(eq(payments.providerPaymentId, id));
      if (!row) throw new PaymentProviderError("Paiement test introuvable.", 404);
      const status = (row.providerStatus ?? "open") as ProviderStatus | "refunded";
      return {
        id,
        status: status === "refunded" ? "paid" : status,
        amount: row.amount,
        amountRefunded: status === "refunded" ? row.amount : 0,
        isCancelable: status === "authorized" || status === "open",
      };
    },
    async capture(id) {
      await setStatus(id, "paid");
      return { captureId: `mock_cap_${id}` };
    },
    async cancel(id) {
      await setStatus(id, "canceled");
    },
    async refund(id) {
      const db = await getDb();
      await db.update(payments).set({ providerStatus: "refunded" }).where(eq(payments.providerPaymentId, id));
    },
  };
}
