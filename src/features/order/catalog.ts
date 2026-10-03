/**
 * Catalogue commandable, construit à partir de la carte (src/data/menu.ts),
 * des options (src/data/options.ts) et des allergènes (src/data/allergens.ts).
 * Une seule source pour le navigateur ET le serveur : /api/checkout recalcule
 * les prix avec ce même catalogue. Les ruptures (base de données) sont
 * appliquées par-dessus avec withAvailability().
 */
import { productAllergens } from "@/data/allergens";
import { products as menuProducts, tacos, type MenuProduct } from "@/data/menu";
import {
  categoryOptionGroups,
  productOptionGroups,
  productsWithCustomPriceOptions,
  tacosOptionGroups,
} from "@/data/options";
import { slugify } from "@/lib/utils";
import type { LiveSettings, OptionGroup, Product } from "./types";

export const TACOS_PRODUCT_ID = "tacos";

/** Variantes de prix de la carte (`priceOptions`) -> groupe d'options. */
function priceVariantGroup(p: MenuProduct, basePrice: number): OptionGroup | null {
  if (!p.priceOptions?.length || productsWithCustomPriceOptions.has(p.id)) return null;
  const options = p.priceOptions.map((o) => ({
    id: slugify(o.label),
    name: o.label,
    priceDelta: o.price - basePrice,
    default: o.price === basePrice,
  }));
  // Pas de prix de base (ex. Frites : petite / grande) : la taille est obligatoire.
  if (p.price === null) return { id: "taille", name: "Taille", required: true, min: 1, max: 1, options };
  return { id: "variante", name: "Option", required: false, min: 0, max: 1, options };
}

function toProduct(p: MenuProduct): Product | null {
  const basePrice = p.price ?? (p.priceOptions?.length ? Math.min(...p.priceOptions.map((o) => o.price)) : null);
  // Prix non communiqué : le produit reste sur la carte mais n'est pas commandable.
  if (basePrice === null) return null;
  const variant = priceVariantGroup(p, basePrice);
  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    description: p.description,
    category: p.categoryId,
    basePrice,
    image: p.imageKey,
    badge: p.badge,
    available: p.available,
    optionGroups: [...(variant ? [variant] : []), ...(productOptionGroups[p.id] ?? categoryOptionGroups[p.categoryId] ?? [])],
    allergens: productAllergens[p.id] ?? null,
  };
}

const tacosProduct: Product = {
  id: TACOS_PRODUCT_ID,
  slug: "tacos",
  name: "Tacos",
  description: "Frites et sauce fromagère maison incluses",
  category: "tacos",
  basePrice: tacos.formulas[0].price,
  image: "tacos-carre",
  available: true,
  optionGroups: tacosOptionGroups,
  allergens: productAllergens[TACOS_PRODUCT_ID] ?? null,
};

export const catalog: Product[] = [
  ...menuProducts.map(toProduct).filter((p): p is Product => p !== null),
  tacosProduct,
];

const byId = new Map(catalog.map((p) => [p.id, p]));

export function getProduct(id: string): Product | null {
  return byId.get(id) ?? null;
}

/** Applique les ruptures en direct (admin) : produit et options deviennent indisponibles. */
export function withAvailability(
  product: Product,
  live: Pick<LiveSettings, "unavailableProducts" | "unavailableOptions"> | null | undefined,
): Product {
  if (!live || (!live.unavailableProducts.length && !live.unavailableOptions.length)) return product;
  const off = new Set(live.unavailableOptions);
  return {
    ...product,
    available: product.available && !live.unavailableProducts.includes(product.id),
    optionGroups: product.optionGroups.map((g) => ({
      ...g,
      options: g.options.map((o) => (off.has(o.id) ? { ...o, available: false } : o)),
    })),
  };
}

/** Options pouvant être mises en rupture (écran « Ruptures » de l'admin). */
export function allOptions() {
  const skip = new Set(["formule", "taille", "variante", "frites"]);
  const map = new Map<string, { id: string; name: string; groups: Set<string> }>();
  for (const p of catalog) {
    for (const g of p.optionGroups) {
      if (skip.has(g.id)) continue;
      for (const o of g.options) {
        const entry = map.get(o.id) ?? { id: o.id, name: o.name, groups: new Set<string>() };
        entry.groups.add(g.name);
        map.set(o.id, entry);
      }
    }
  }
  return [...map.values()]
    .map((o) => ({ id: o.id, name: o.name, groups: [...o.groups] }))
    .sort((a, b) => a.groups[0].localeCompare(b.groups[0], "fr") || a.name.localeCompare(b.name, "fr"));
}
