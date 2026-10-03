/** Contrat commun des fournisseurs de paiement (Mollie en réel, « mock » en test local). */

export type ProviderStatus = "open" | "pending" | "authorized" | "paid" | "canceled" | "expired" | "failed";

export interface ProviderPayment {
  id: string;
  status: ProviderStatus;
  /** Montant en centimes. */
  amount: number;
  amountRefunded: number;
  isCancelable: boolean;
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: number;
  /** Centimes, recalculés par le serveur. */
  amount: number;
  description: string;
  redirectUrl: string;
  cancelUrl: string;
  webhookUrl: string | null;
}

export interface PaymentProvider {
  name: "mollie" | "mock";
  createPayment(input: CreatePaymentInput): Promise<{ id: string; checkoutUrl: string; status: ProviderStatus }>;
  getPayment(id: string): Promise<ProviderPayment>;
  /** Encaisse un paiement autorisé. `idempotencyKey` empêche toute double capture. */
  capture(id: string, amount: number, idempotencyKey: string): Promise<{ captureId: string }>;
  /** Libère une autorisation (aucun débit). */
  cancel(id: string): Promise<void>;
  refund(id: string, amount: number, idempotencyKey: string): Promise<void>;
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}
