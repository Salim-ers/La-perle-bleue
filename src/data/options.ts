/**
 * Options de commande utilisées par le configurateur produit.
 *
 * IMPORTANT : la carte du restaurant ne détaille ni les sauces, ni le choix
 * pain / galette, ni les suppléments des sandwichs, ni les formules. Tout ce qui
 * porte `toConfirm` est une PROPOSITION à valider par le restaurateur avant
 * d'ouvrir le paiement en ligne. Modifier ce fichier suffit : le configurateur,
 * le panier et le recalcul côté serveur suivent automatiquement.
 *
 * Ce qui vient réellement de la carte : les viandes des paninis, la composition
 * des tacos (tailles, viandes, suppléments) et les tailles du « Petit plus »
 * (générées dans src/features/order/catalog.ts à partir de `priceOptions`).
 *
 * Prix en centimes.
 */
import type { MenuCategoryId } from "./menu";
import { tacos } from "./menu";
import type { Option, OptionGroup } from "@/features/order/types";
import { slugify } from "@/lib/utils";

const opt = (name: string, priceDelta = 0, extra: Partial<Option> = {}): Option => ({
  id: slugify(name),
  name,
  priceDelta,
  ...extra,
});

// ——— Groupes réutilisables ———

const crudites = (names: string[]): OptionGroup => ({
  id: "crudites",
  name: "Crudités",
  required: false,
  min: 0,
  max: names.length,
  summary: "removed",
  hint: "Incluses : décochez ce que vous ne voulez pas",
  options: names.map((n) => opt(n, 0, { default: true })),
});

const sauces: OptionGroup = {
  id: "sauces",
  name: "Sauces",
  required: false,
  min: 0,
  max: 2,
  unit: ["sauce", "sauces"],
  options: ["Blanche", "Algérienne", "Samouraï", "Harissa", "Ketchup", "Mayonnaise", "Barbecue", "Biggy"].map(
    (n) => opt(n),
  ),
  toConfirm:
    "Liste des sauces absente de la carte : liste proposée. Confirmer les sauces et le nombre offert (2 ?).",
};

const pain: OptionGroup = {
  id: "pain",
  name: "Pain",
  required: true,
  min: 1,
  max: 1,
  summary: "changes",
  options: [opt("Pain", 0, { default: true }), opt("Galette")],
  toConfirm: "Choix pain / galette non indiqué sur la carte.",
};

const supplements = (withMeat: boolean): OptionGroup => ({
  id: "supplements",
  name: "Suppléments",
  required: false,
  min: 0,
  max: 3,
  options: [
    opt("Cheddar", 50),
    ...(withMeat ? [opt("Viande supplémentaire", 200)] : []),
    opt("Œuf", 100),
  ],
  toConfirm:
    "Prix repris des suppléments tacos (cheddar 0€50, œuf 1€00). Viande supplémentaire : aucun prix sur la carte, 2€00 proposé.",
});

const formule = (menuLabel: string, priceDelta: number, toConfirm: string): OptionGroup => ({
  id: "formule",
  name: "Formule",
  required: true,
  min: 1,
  max: 1,
  summary: "changes",
  options: [opt("Seul", 0, { default: true }), { ...opt("Menu", priceDelta), name: menuLabel }],
  toConfirm,
});

/** Sandwichs et paninis sont déjà servis avec frites : le menu ajoute une boisson. */
const formuleSandwich = formule(
  "Menu : + canette 33 cl",
  150,
  "Aucune formule sur la carte. Prix proposé = prix de la canette (1€50), sans remise. Choix de la boisson à prévoir.",
);

const formuleBurger = formule(
  "Menu : + frites + canette 33 cl",
  350,
  "Aucune formule sur la carte. Prix proposé = petite frite (2€00) + canette (1€50), sans remise.",
);

const viandePanini: OptionGroup = {
  id: "viande",
  name: "Viande",
  required: true,
  min: 1,
  max: 1,
  // Source : carte, « Chawarma, kebab, poulet, kefta ou merguez ».
  options: ["Chawarma", "Kebab", "Poulet", "Kefta", "Merguez"].map((n) => opt(n)),
};

// ——— Tacos : entièrement dérivé de la carte (src/data/menu.ts) ———

const tacosSizeGroup: OptionGroup = {
  id: "taille",
  name: "Taille",
  required: true,
  min: 1,
  max: 1,
  options: tacos.formulas.map((f, i) =>
    opt(f.label, f.price - tacos.formulas[0].price, { default: i === 0 }),
  ),
};

const tacosMeatsGroup: OptionGroup = {
  id: "viandes",
  name: "Viandes",
  required: true,
  min: 1,
  max: 1,
  unit: ["viande", "viandes"],
  options: tacos.meats.map((n) => opt(n)),
  // Le nombre de viandes suit la taille choisie.
  limitsFrom: {
    groupId: tacosSizeGroup.id,
    byOption: Object.fromEntries(
      tacos.formulas.map((f) => [slugify(f.label), { min: f.meats, max: f.meats }]),
    ),
  },
  toConfirm: "Peut-on choisir deux fois la même viande (ex. 2 × kebab) ? Actuellement : viandes différentes.",
};

const tacosSupplementsGroup: OptionGroup = {
  id: "supplements",
  name: "Suppléments",
  required: false,
  min: 0,
  max: 5,
  // La carte affiche « Frites, cheddar : 0€50 » et « Chèvre, œuf : 1€00 » : un prix par supplément.
  options: tacos.supplements.flatMap((s) =>
    s.label.split(",").map((part) => {
      const name = part.trim();
      return opt(name.charAt(0).toUpperCase() + name.slice(1), s.price);
    }),
  ),
  toConfirm: "Prix par supplément déduit de la carte (« Frites, cheddar : 0€50 ») : à confirmer.",
};

export const tacosOptionGroups: OptionGroup[] = [
  tacosSizeGroup,
  tacosMeatsGroup,
  sauces,
  tacosSupplementsGroup,
];

// ——— Affectation aux produits ———

/** Groupes par défaut d'une catégorie. */
export const categoryOptionGroups: Partial<Record<MenuCategoryId, OptionGroup[]>> = {
  sandwichs: [pain, crudites(["Salade", "Tomates", "Oignons"]), sauces, supplements(true), formuleSandwich],
  burgers: [crudites(["Salade", "Tomate"]), sauces, supplements(false), formuleBurger],
  paninis: [viandePanini, sauces, formuleSandwich],
  assiettes: [sauces],
};

/** Exceptions produit par produit (prioritaires sur la catégorie). */
export const productOptionGroups: Record<string, OptionGroup[]> = {
  // Recette composée (chou rouge, carotte, feta, sauce bergère) : pas de crudités ni sauces au choix.
  "berliner-kebab": [formuleSandwich],
  "sandwich-vegetarien": [
    pain,
    crudites(["Salade", "Concombre", "Tomates", "Oignons"]),
    sauces,
    supplements(false),
    formuleSandwich,
  ],
  // Burgers sans crudités dans leur description.
  country: [sauces, supplements(false), formuleBurger],
  "fish-burger": [sauces, supplements(false), formuleBurger],
  "panini-nutella": [],
  "cristaline-aromatisee": [
    { id: "parfum", name: "Parfum", required: true, min: 1, max: 1, options: [opt("Pêche"), opt("Fraise")] },
  ],
};
