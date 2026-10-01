import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { phoneHref, shortAddress } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Ma commande",
  description: "Finalisez votre commande à retirer à La Perle Bleue.",
  alternates: { canonical: "/commande" },
  robots: { index: false, follow: false },
};

export default function CommandePage() {
  return (
    <div className="min-h-[80svh] bg-cream pt-[var(--header-h)]">
      <CheckoutView address={shortAddress} phoneHref={phoneHref} />
    </div>
  );
}
