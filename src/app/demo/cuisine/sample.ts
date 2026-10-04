/**
 * Commande de démonstration générée depuis l'écran cuisine (bouton
 * « Simuler une commande ») : permet de montrer la cuisine seule, sur une
 * tablette qui n'a pas passé de commande elle-même. Produits et choix réels.
 */
import { createDemoOrder } from "@/features/demo/store";
import { getProduct, TACOS_PRODUCT_ID } from "@/features/order/catalog";
import {
  calculateConfiguredProductPrice,
  describeForKitchen,
  describeSelection,
  getDefaultSelection,
  getGroupLimits,
  isGroupVisible,
  normalizeSelection,
} from "@/features/order/pricing";
import type { Product, Selection } from "@/features/order/types";
import { validateSelection } from "@/features/order/validation";

const PRODUCTS = ["berliner-kebab", "sandwich-merguez", TACOS_PRODUCT_ID, "double-cheese", "assiette-mixte", "assiette-kebab", "sandwich-chicken", "nuggets-frites"];
const EXTRAS = ["canette", "tiramisu", "frites", "baklava"];
const CUSTOMERS = [
  ["Yanis", "Benali"],
  ["Sarah", "Martin"],
  ["Lucas", "Dubois"],
  ["Inès", "Karimi"],
  ["Thomas", "Robert"],
  ["Léa", "Moreau"],
];
const ITEM_NOTES = ["Bien cuit", "Sauce à part", "Coupé en deux"];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const chance = (p: number) => Math.random() < p;
const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

/** Choix plausibles : formule menu une fois sur deux, sauces, parfois « sans oignons »… */
function randomSelection(product: Product): Selection {
  let selection = getDefaultSelection(product);
  // Deux passes : le choix « menu » fait apparaître la boisson.
  for (let pass = 0; pass < 2; pass++) {
    for (const group of product.optionGroups) {
      if (!isGroupVisible(group, selection) || group.id === "supplements") continue;
      const available = group.options.filter((o) => o.available !== false);
      const current = selection[group.id] ?? [];
      const { min, max } = getGroupLimits(group, selection);
      if (pass === 0 && group.id === "formule" && chance(0.5)) selection[group.id] = [available[available.length - 1].id];
      else if (pass === 0 && group.id === "crudites" && chance(0.4) && current.length > 1) selection[group.id] = current.slice(0, -1);
      else if (pass === 0 && (group.id === "pain" || group.id === "taille") && chance(0.4)) selection[group.id] = [pick(available).id];
      else if (current.length < min || (group.id === "sauces" && current.length === 0)) {
        const count = Math.min(max, Math.max(min, group.id === "sauces" ? 1 + Math.round(Math.random()) : min));
        selection[group.id] = shuffle(available)
          .slice(0, count)
          .map((o) => o.id);
      }
      selection = normalizeSelection(product, selection);
    }
  }
  return Object.keys(validateSelection(product, selection)).length ? getDefaultSelection(product) : selection;
}

function line(product: Product) {
  const selection = randomSelection(product);
  const quantity = chance(0.2) ? 2 : 1;
  return {
    total: calculateConfiguredProductPrice(product, selection, quantity).total,
    item: {
      productName: product.name,
      quantity,
      summary: describeSelection(product, selection),
      kitchenLines: describeForKitchen(product, selection),
      note: chance(0.25) ? pick(ITEM_NOTES) : undefined,
    },
  };
}

export function simulateDemoOrder() {
  const ids = [...shuffle(PRODUCTS).slice(0, chance(0.5) ? 2 : 1), ...(chance(0.5) ? [pick(EXTRAS)] : [])];
  const lines = ids.flatMap((id) => {
    const product = getProduct(id);
    return product && product.available ? [line(product)] : [];
  });
  const [firstName, lastName] = pick(CUSTOMERS);
  return createDemoOrder({
    customer: { firstName, lastName, phone: `06${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`, email: "client@example.fr" },
    pickup: { type: "ASAP" },
    note: chance(0.2) ? "Je passe dans 10 minutes" : undefined,
    total: lines.reduce((sum, l) => sum + l.total, 0),
    items: lines.map((l) => l.item),
    paid: true,
  });
}
