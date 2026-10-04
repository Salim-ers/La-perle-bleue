import { categories } from "@/data/menu";
import { allOptions, catalog } from "./catalog";

/** Produits et options affichés dans l'écran « Ruptures » des réglages. */
export function settingsItems() {
  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return {
    products: catalog.map((p) => ({ id: p.id, name: p.name, group: `Carte — ${categoryName[p.category] ?? p.category}` })),
    options: allOptions().map((o) => ({ id: o.id, name: o.name, group: `Options — ${o.groups[0]}` })),
  };
}
