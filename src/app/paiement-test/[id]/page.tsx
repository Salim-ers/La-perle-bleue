import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { formatEuros } from "@/lib/money";
import { getDb } from "@/server/db";
import { payments } from "@/server/db/schema";
import { isMockPaymentsAllowed } from "@/server/payments/mock";
import { MockPaymentButtons } from "./MockPaymentButtons";

export const metadata: Metadata = { title: "Paiement de test", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Simule la page Mollie en local (PAYMENT_PROVIDER=mock). Introuvable en production. */
export default async function MockPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isMockPaymentsAllowed()) notFound();
  const { id } = await params;
  const db = await getDb();
  const [payment] = await db.select().from(payments).where(eq(payments.providerPaymentId, id));
  if (!payment) notFound();
  return (
    <main className="grid min-h-svh place-items-center bg-[#f4f4f6] p-6 font-sans text-night">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-xs font-bold tracking-widest text-[#b42318] uppercase">Mode test — aucune carte</p>
        <h1 className="mt-2 text-2xl font-bold">Paiement simulé</h1>
        <p className="mt-1 text-slate">Montant : <strong>{formatEuros(payment.amount)}</strong></p>
        <MockPaymentButtons id={id} orderId={payment.orderId} />
      </div>
    </main>
  );
}
