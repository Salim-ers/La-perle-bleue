/**
 * Choix du fournisseur de paiement selon l'environnement.
 * Garde-fous : clé « live_ » refusée hors production (aucun vrai débit depuis
 * une preview), clé « test_ » refusée en production sauf répétition explicite
 * (ALLOW_TEST_PAYMENTS_IN_PRODUCTION=true, à retirer avant l'ouverture).
 */
import "server-only";
import { getBaseUrl } from "../base-url";
import { createMockProvider, isMockPaymentsAllowed } from "./mock";
import { createMollieProvider } from "./mollie";
import type { PaymentProvider } from "./types";

export type PaymentConfig = { ok: true; provider: PaymentProvider } | { ok: false; reason: string };

export function getPaymentProvider(): PaymentConfig {
  if (isMockPaymentsAllowed()) return { ok: true, provider: createMockProvider(getBaseUrl()) };
  const key = process.env.MOLLIE_API_KEY;
  if (!key) return { ok: false, reason: "MOLLIE_API_KEY n'est pas définie." };
  const production = process.env.VERCEL_ENV === "production";
  if (production && key.startsWith("test_") && process.env.ALLOW_TEST_PAYMENTS_IN_PRODUCTION !== "true") {
    return { ok: false, reason: "Clé Mollie de test refusée en production." };
  }
  if (!production && key.startsWith("live_")) {
    return { ok: false, reason: "Clé Mollie live refusée hors production (utilisez une clé test_)." };
  }
  return { ok: true, provider: createMollieProvider(key) };
}

export function getProviderByName(name: "mollie" | "mock"): PaymentProvider | null {
  const config = getPaymentProvider();
  return config.ok && config.provider.name === name ? config.provider : null;
}

export * from "./types";
