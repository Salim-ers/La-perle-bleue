import type { Metadata } from "next";
import { DemoPayment } from "./DemoPayment";

export const metadata: Metadata = { title: "Paiement (démonstration)", robots: { index: false, follow: false } };

/** Page de paiement simulée du mode démonstration (remplace la page Mollie). */
export default async function DemoPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DemoPayment id={id} />;
}
