/**
 * Catalogue commandable, construit à partir de la carte (src/data/menu.ts)
 * et des options (src/data/options.ts). Une seule source pour le navigateur
 * ET le serveur : /api/checkout recalcule les prix avec ce même catalogue.
 *
 * Phase 2 : remplacer la construction ci-dessous par une lecture Supabase
 * (tables products / option_groups / options) en gardant `getProduct()`.
 */
import { products as menuProducts, tacos, type MenuProduct } from "@/data/menu";
import { categoryOptionGroups, productOptionGroups, tacosOptionGroups } from "@/data/options";
import { slugify } from "@/lib/utils";
import type { OptionGroup, Product } from "./types";

export const TACOS_PRODUCT_ID = "tacos";

/** Variantes de prix de la carte (`priceOptions`) -> groupe d'options. */
function priceVariantGroup(p: MenuProduct, basePrice: number): OptionGroup | null {
  if (!p.priceOptions?.length) return null;
  const options = p.priceOptions.map((o) => ({
    id: slugify(o.label),
    name: o.label,
    priceDelta: o.price - basePrice,
    default: o.price === basePrice,
  }));
  // Pas de prix de base (ex. Frites : petite / grande) : la taille est obligatoire.
  if (p.price === null) {
    return { id: "taille", name: "Taille", required: true, min: 1, max: 1, options };
  }
  // Prix de base + variante (ex. Berliner « avec frites ») : variante facultative.
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
    optionGroups: [
      ...(variant ? [variant] : []),
      ...(productOptionGroups[p.id] ?? categoryOptionGroups[p.categoryId] ?? []),
    ],
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
};

export const catalog: Product[] = [
  ...menuProducts.map(toProduct).filter((p): p is Product => p !== null),
  tacosProduct,
];

const byId = new Map(catalog.map((p) => [p.id, p]));

export function getProduct(id: string): Product | null {
  return byId.get(id) ?? null;
}
