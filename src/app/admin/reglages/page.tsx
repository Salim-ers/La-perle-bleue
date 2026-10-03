import type { Metadata } from "next";
import { SettingsApp } from "@/components/admin/SettingsApp";
import { categories } from "@/data/menu";
import { orderingSettings } from "@/data/ordering";
import { allOptions, catalog } from "@/features/order/catalog";

export const metadata: Metadata = { title: "Réglages" };

export default function ReglagesPage() {
  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const products = catalog.map((p) => ({ id: p.id, name: p.name, group: `Carte — ${categoryName[p.category] ?? p.category}` }));
  const options = allOptions().map((o) => ({ id: o.id, name: o.name, group: `Options — ${o.groups[0]}` }));
  return <SettingsApp products={products} options={options} delays={orderingSettings.preparationDelayChoices} />;
}
