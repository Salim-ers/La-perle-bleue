import type { Metadata } from "next";
import { SettingsApp } from "@/components/admin/SettingsApp";
import { orderingSettings } from "@/data/ordering";
import { settingsItems } from "@/features/order/settings-items";

export const metadata: Metadata = { title: "Réglages" };

export default function ReglagesPage() {
  const { products, options } = settingsItems();
  return <SettingsApp products={products} options={options} delays={orderingSettings.preparationDelayChoices} />;
}
