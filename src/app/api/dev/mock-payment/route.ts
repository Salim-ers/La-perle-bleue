/**
 * POST /api/dev/mock-payment — simule la réponse de Mollie (tests locaux uniquement).
 * Inaccessible si PAYMENT_PROVIDER n'est pas « mock » ou en production Vercel.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { json } from "@/server/http";
import { syncPayment } from "@/server/orders";
import { isMockPaymentsAllowed } from "@/server/payments/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isMockPaymentsAllowed()) return json({ error: "Introuvable." }, 404);
  const parsed = z
    .object({ id: z.string().startsWith("mock_"), outcome: z.enum(["authorized", "failed", "canceled", "expired"]), replay: z.number().int().min(1).max(5).optional() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Demande invalide." }, 400);
  const db = await getDb();
  await db.update(payments).set({ providerStatus: parsed.data.outcome }).where(eq(payments.providerPaymentId, parsed.data.id));
  // `replay` simule un webhook reçu plusieurs fois (test d'idempotence).
  for (let i = 0; i < (parsed.data.replay ?? 1); i++) await syncPayment(parsed.data.id, "webhook");
  const [row] = await db.select({ orderId: payments.orderId }).from(payments).where(eq(payments.providerPaymentId, parsed.data.id));
  return json({ ok: true, orderId: row?.orderId });
}
