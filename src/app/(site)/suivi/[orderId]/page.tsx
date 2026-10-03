import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracker } from "@/components/checkout/OrderTracker";
import { phoneHref } from "@/lib/contact";
import { getPublicOrder, refreshPendingOrder } from "@/server/orders";

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retour de Mollie et lien des e-mails. Le statut est relu côté serveur
 * (et chez Mollie si le paiement est encore « en cours ») : arriver ici
 * après la page de paiement ne prouve jamais à lui seul un paiement.
 */
export default async function SuiviPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!UUID.test(orderId)) notFound();
  let order = await getPublicOrder(orderId);
  if (!order) notFound();
  if (order.status === "PENDING_PAYMENT") {
    await refreshPendingOrder(orderId);
    order = (await getPublicOrder(orderId)) ?? order;
  }
  return (
    <div className="min-h-[80svh] bg-cream pt-[var(--header-h)]">
      <OrderTracker initial={order} phoneHref={phoneHref} />
    </div>
  );
}
