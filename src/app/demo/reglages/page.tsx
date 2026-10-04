import type { Metadata } from "next";
import { orderingSettings } from "@/data/ordering";
import { settingsItems } from "@/features/order/settings-items";
import { DemoSettings } from "./DemoSettings";

export const metadata: Metadata = { title: "Réglages (démonstration)", robots: { index: false, follow: false } };

/** Réglages de démonstration : enregistrés dans ce navigateur, appliqués au site ouvert en mode démo. */
export default function DemoReglagesPage() {
  const { products, options } = settingsItems();
  return (
    <div className="on-dark min-h-svh bg-[#0b1220] text-white antialiased">
      <DemoSettings products={products} options={options} delays={orderingSettings.preparationDelayChoices} />
    </div>
  );
}
