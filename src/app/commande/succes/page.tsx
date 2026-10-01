import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { getOrderById } from "@/features/order/orders";
import { phoneHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Confirmation de commande",
  robots: { index: false, follow: false },
};

/**
 * Retour de Stripe : /commande/succes?commande=<orderId>.
 * Le statut est relu côté serveur ; la redirection seule ne vaut pas paiement.
 * Phase suivante : /suivi/[orderId] pour le suivi en temps réel.
 */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const { commande } = await searchParams;
  const order = commande && /^[\w-]{1,64}$/.test(commande) ? await getOrderById(commande) : null;
  return (
    <div className="min-h-[80svh] bg-cream pt-[var(--header-h)]">
      <OrderConfirmation order={order} phoneHref={phoneHref} />
    </div>
  );
}
