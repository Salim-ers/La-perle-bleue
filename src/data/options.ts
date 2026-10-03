/**
 * Options de commande utilisées par le configurateur produit.
 *
 * Toutes les règles de configuration viennent d'ici : aucun composant ne
 * teste le nom d'un produit. Modifier ce fichier suffit : configurateur,
 * panier, recalcul serveur et cuisine suivent.
 *
 * IMPORTANT : la carte du restaurant ne détaille ni les sauces, ni le choix
 * pain / galette, ni les boissons des menus, ni les prix des suppléments et
 * formules. Tout ce qui porte `toConfirm` est une PROPOSITION à faire valider
 * par le restaurateur (liste dans README-PRODUCTION.md).
 *
 * Ce qui vient réellement de la carte : les viandes des paninis, la
 * composition des tacos, les tailles du « Petit plus » et le Berliner avec frites.
 *
 * Les identifiants d'options sont globaux : mettre « kebab » en rupture dans
 * l'admin le désactive dans tous les groupes qui le proposent.
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

const MENU_SELECTED = { groupId: "formule", optionIds: ["menu"] };

// ——— Listes de référence ———

/** Canettes 33 cl : boisson des menus et choix du produit « Canette 33 cl ». */
const CANETTES = ["Coca-Cola", "Coca-Cola Zero", "Fanta Orange", "Oasis Tropical", "Ice Tea Pêche"];
const CANETTES_TODO = "Parfums de canettes non indiqués sur la carte : liste proposée à valider.";

/** Supplément d'une sauce au-delà des sauces incluses : prix « Sauce » de la carte des tacos. */
const SAUCE_EXTRA = tacos.supplements.find((s) => s.label.toLowerCase() === "sauce")?.price ?? 50;

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

const sauces = (included: number, max: number): OptionGroup => ({
  id: "sauces",
  name: "Sauces",
  required: false,
  min: 0,
  max,
  included,
  extraPriceDelta: SAUCE_EXTRA,
  unit: ["sauce", "sauces"],
  options: ["Blanche", "Algérienne", "Samouraï", "Harissa", "Ketchup", "Mayonnaise", "Barbecue", "Biggy"].map((n) =>
    opt(n),
  ),
  toConfirm: `Liste des sauces absente de la carte : liste proposée. Sauces incluses : ${included}, sauce en plus : prix « Sauce » des tacos.`,
});

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

/** Formule seul / menu. Le menu ajoute toujours une boisson (groupe `boisson` ci-dessous). */
const formule = (menuName: string, priceDelta: number, toConfirm: string): OptionGroup => ({
  id: "formule",
  name: "Votre formule",
  required: true,
  min: 1,
  max: 1,
  summary: "changes",
  options: [opt("Produit seul", 0, { default: true }), { ...opt("Menu", priceDelta), name: menuName }],
  toConfirm,
});

/** Boisson du menu : visible et obligatoire seulement si la formule « menu » est choisie. */
const boissonMenu: OptionGroup = {
  id: "boisson",
  name: "Boisson du menu",
  required: true,
  min: 1,
  max: 1,
  visibleIf: MENU_SELECTED,
  options: CANETTES.map((n) => opt(n)),
  toConfirm: CANETTES_TODO,
};

/** Sandwichs et paninis sont déjà servis avec frites : le menu ajoute une boisson. */
const formuleSandwich = formule(
  "Menu (+ boisson)",
  150,
  "Aucune formule sur la carte. Prix proposé = prix de la canette (1€50), sans remise.",
);

const formuleBurger = formule(
  "Menu (+ frites et boisson)",
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

// ——— Berliner : seul sandwich servi sans frites (carte : « avec frites 7€50 ») ———

const berlinerFrites: OptionGroup = {
  id: "frites",
  name: "Frites",
  required: true,
  min: 1,
  max: 1,
  summary: "changes",
  // Masqué si menu : les frites sont déjà dans le menu, jamais facturées deux fois.
  hiddenIf: MENU_SELECTED,
  options: [opt("Sans frites", 0, { default: true }), opt("Frites à côté", 50)],
};

const formuleBerliner = formule(
  "Menu (+ frites et boisson)",
  200,
  "Aucune formule sur la carte. Prix proposé = frites (0€50, carte du Berliner) + canette (1€50), sans remise.",
);

// ——— Tacos : dérivé de la carte (src/data/menu.ts) ———

const tacosSizeGroup: OptionGroup = {
  id: "taille",
  name: "Taille",
  required: true,
  min: 1,
  max: 1,
  options: tacos.formulas.map((f, i) => opt(f.label, f.price - tacos.formulas[0].price, { default: i === 0 })),
};

const tacosMeatsGroup: OptionGroup = {
  id: "viandes",
  name: "Viandes",
  required: true,
  min: 1,
  max: 1,
  unit: ["viande", "viandes"],
  options: tacos.meats.map((n) => opt(n)),
  limitsFrom: {
    groupId: tacosSizeGroup.id,
    byOption: Object.fromEntries(tacos.formulas.map((f) => [slugify(f.label), { min: f.meats, max: f.meats }])),
  },
  toConfirm: "Peut-on choisir deux fois la même viande (ex. 2 × kebab) ? Actuellement : viandes différentes.",
};

/** Carte : « Frites, cheddar : 0€50 » et « Chèvre, œuf : 1€00 ». « Sauce » devient le supplément du groupe sauces. */
const tacosSupplementsGroup: OptionGroup = {
  id: "supplements",
  name: "Suppléments",
  required: false,
  min: 0,
  max: 4,
  options: tacos.supplements
    .filter((s) => s.label.toLowerCase() !== "sauce")
    .flatMap((s) =>
      s.label.split(",").map((part) => {
        const name = part.trim();
        return opt(name.charAt(0).toUpperCase() + name.slice(1), s.price);
      }),
    ),
  toConfirm: "Prix par supplément déduit de la carte (« Frites, cheddar : 0€50 ») : à confirmer.",
};

export const tacosOptionGroups: OptionGroup[] = [tacosSizeGroup, tacosMeatsGroup, sauces(2, 3), tacosSupplementsGroup];

// ——— Affectation aux produits ———

const CRUDITES = ["Salade", "Tomates", "Oignons"];

/** Groupes par défaut d'une catégorie. */
export const categoryOptionGroups: Partial<Record<MenuCategoryId, OptionGroup[]>> = {
  sandwichs: [pain, crudites(CRUDITES), sauces(2, 3), supplements(true), formuleSandwich, boissonMenu],
  burgers: [crudites(["Salade", "Tomate"]), sauces(2, 3), supplements(false), formuleBurger, boissonMenu],
  paninis: [viandePanini, sauces(2, 3), formuleSandwich, boissonMenu],
  // Carte : « Servies avec boulgour, frites et crudités ».
  assiettes: [crudites(CRUDITES), sauces(2, 3)],
};

/** Exceptions produit par produit (prioritaires sur la catégorie). */
export const productOptionGroups: Record<string, OptionGroup[]> = {
  // Recette composée (chou rouge, carotte, feta, sauce bergère), servie sans frites.
  "berliner-kebab": [berlinerFrites, formuleBerliner, boissonMenu],
  "sandwich-vegetarien": [
    pain,
    crudites(["Salade", "Concombre", "Tomates", "Oignons"]),
    sauces(2, 3),
    supplements(false),
    formuleSandwich,
    boissonMenu,
  ],
  // Burgers sans crudités dans leur description.
  country: [sauces(2, 3), supplements(false), formuleBurger, boissonMenu],
  "fish-burger": [sauces(2, 3), supplements(false), formuleBurger, boissonMenu],
  // Carte : « Boulgour, frites, 3 steaks, œuf, fromage » (pas de crudités).
  "assiette-rs4": [sauces(2, 3)],
  "panini-nutella": [],
  canette: [
    { id: "parfum", name: "Parfum", required: true, min: 1, max: 1, options: CANETTES.map((n) => opt(n)), toConfirm: CANETTES_TODO },
  ],
  "cristaline-aromatisee": [
    { id: "parfum", name: "Parfum", required: true, min: 1, max: 1, options: [opt("Pêche"), opt("Fraise")] },
  ],
};

/**
 * Prix « Avec frites » du Berliner (carte) géré par le groupe `frites` ci-dessus :
 * la variante de prix générique n'est pas appliquée à ces produits.
 */
export const productsWithCustomPriceOptions = new Set(["berliner-kebab"]);
