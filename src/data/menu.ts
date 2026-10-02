/**
 * Carte de La Perle Bleue — transcription fidèle du tableau de menu fourni
 * (Perle_Image_ChatGPT_30_sept__2026__16_20_31-1.png) + affiche « Berliner ».
 *
 * Prix en centimes (entiers) pour éviter les erreurs d'arrondi : prêt pour
 * un futur panier / Stripe. `available` servira à la gestion des ruptures.
 * Tout champ marqué `toConfirm` doit être validé par le restaurateur.
 */

export type MenuCategoryId =
  | "burgers"
  | "sandwichs"
  | "paninis"
  | "assiettes"
  | "tacos"
  | "petit-plus"
  | "desserts"
  | "boissons";

export interface MenuCategory {
  id: MenuCategoryId;
  name: string;
  note?: string;
}

import type { ImageKey } from "./images";

export interface MenuProduct {
  id: string;
  categoryId: MenuCategoryId;
  name: string;
  description?: string;
  /** Prix en centimes. `null` = prix non communiqué. */
  price: number | null;
  /** Variantes de prix (ex. petite / grande portion). */
  priceOptions?: { label: string; price: number }[];
  /** Clé du registre `images.ts`, si une vraie photo existe (format 1:1 pour les miniatures). */
  imageKey?: ImageKey;
  badge?: string;
  available: boolean;
  toConfirm?: string;
}

export interface TacosFormula {
  label: string;
  price: number;
}

export interface TacosSize extends TacosFormula {
  /** Nombre de viandes à choisir (utilisé par le configurateur). */
  meats: number;
}

export const categories: MenuCategory[] = [
  { id: "assiettes", name: "Assiettes", note: "Servies avec boulgour, frites et crudités" },
  { id: "sandwichs", name: "Sandwichs", note: "Servis avec frites" },
  {
    id: "tacos",
    name: "Tacos",
    note: "Tous nos tacos sont garnis de frites et de sauce fromagère maison",
  },
  { id: "burgers", name: "Burgers" },
  { id: "paninis", name: "Paninis", note: "Servis avec frites" },
  { id: "petit-plus", name: "Petit plus" },
  { id: "desserts", name: "Desserts" },
  { id: "boissons", name: "Boissons" },
];

export const products: MenuProduct[] = [
  // ——— BURGERS ———
  { id: "cheese-burger", categoryId: "burgers", name: "Cheese Burger", description: "Steak, cheddar, salade, tomate", price: 650, imageKey: "cheese-burger-carre", available: true,
    toConfirm: "Prix supérieur au Double Cheese (5,50 €) : vérifier l'alignement des prix sur le tableau." },
  { id: "double-cheese", categoryId: "burgers", name: "Double Cheese", description: "2 steaks, cheddar, salade, tomate", price: 550, imageKey: "double-cheese-carre", available: true },
  { id: "royal-cheese", categoryId: "burgers", name: "Royal Cheese", description: "3 steaks, œuf, cheddar, salade, tomate", price: 700, imageKey: "royal-cheese-carre", available: true },
  { id: "chicken-steak", categoryId: "burgers", name: "Chicken Steak", description: "Chicken steak, cheddar, salade, tomate", price: 550, imageKey: "chicken-steak-carre", available: true },
  { id: "double-cheese-kefta", categoryId: "burgers", name: "Double Cheese Kefta", description: "2 kefta, cheddar, salade, tomate", price: 600, imageKey: "double-cheese-kefta-carre", available: true },
  { id: "country", categoryId: "burgers", name: "Country", description: "Steak, cheddar, galette de pomme de terre", price: 450, imageKey: "country-carre", available: true },
  { id: "fish-burger", categoryId: "burgers", name: "Fish Burger", description: "Poisson pané", price: 500, imageKey: "fish-burger-carre", available: true },

  // ——— SANDWICHS ———
  { id: "berliner-kebab", categoryId: "sandwichs", name: "Berliner Kebab", badge: "Nouveau",
    description: "Chou rouge, carotte râpée, sauce bergère, feta", price: 700,
    priceOptions: [{ label: "Avec frites", price: 750 }], imageKey: "berliner-kebab-carre", available: true,
    toConfirm: "Nom illisible sur l'affiche (« RLINER BAB ») ; texte « …et maison » tronqué. Confirmer le nom exact et la fin de la description. Ce sandwich est-il servi sans frites par défaut, contrairement aux autres ?" },
  { id: "sandwich-merguez", categoryId: "sandwichs", name: "Merguez", description: "Merguez, salades, tomates, oignons", price: 550, imageKey: "sandwich-merguez-carre", available: true },
  { id: "sandwich-rs4", categoryId: "sandwichs", name: "RS4", description: "3 steaks, œuf, salades, tomates, oignons", price: 650, imageKey: "sandwich-rs4-carre", available: true },
  { id: "sandwich-quatro", categoryId: "sandwichs", name: "Quatro", description: "4 steaks, cheddar, salades, tomates, oignons", price: 700, imageKey: "sandwich-quatro-carre", available: true },
  { id: "sandwich-cordon-bleu", categoryId: "sandwichs", name: "Cordon Bleu", description: "Cordon bleu, cheddar, salades, tomates, oignons", price: 600, imageKey: "sandwich-cordon-bleu-carre", available: true },
  { id: "sandwich-poulet", categoryId: "sandwichs", name: "Poulet", description: "Brochette de poulet, poulet paprika, salades, tomates, oignons", price: 600, imageKey: "sandwich-poulet-carre", available: true },
  { id: "sandwich-turbo", categoryId: "sandwichs", name: "Turbo", description: "Poulet pané, galette de pomme de terre, cheddar, salades, tomates, oignons", price: 650, imageKey: "sandwich-turbo-carre", available: true },
  { id: "sandwich-brochette-agneau", categoryId: "sandwichs", name: "Brochette d'agneau", description: "Brochette d'agneau, salades, tomates, oignons", price: 650, imageKey: "sandwich-brochette-agneau-carre", available: true },
  { id: "sandwich-chicken", categoryId: "sandwichs", name: "Chicken", description: "Chicken curry, salades, tomates, oignons", price: 600, imageKey: "sandwich-chicken-carre", available: true },
  { id: "sandwich-libanais", categoryId: "sandwichs", name: "Libanais", description: "Salades, tomates, oignons", price: 600, imageKey: "sandwich-libanais-carre", available: true,
    toConfirm: "Viande non précisée sur le tableau (la photo montre de la viande de kebab)." },
  { id: "sandwich-triple", categoryId: "sandwichs", name: "Triple", description: "3 steaks, salades, tomates, oignons", price: 600, imageKey: "sandwich-triple-carre", available: true },
  { id: "sandwich-vegetarien", categoryId: "sandwichs", name: "Végétarien", description: "Salades, concombre, tomates, oignons", price: 450, imageKey: "sandwich-vegetarien-carre", available: true },

  // ——— PANINIS ———
  { id: "panini-viande", categoryId: "paninis", name: "Panini", description: "Chawarma, kebab, poulet, kefta ou merguez", price: 550, imageKey: "panini-viande-carre", available: true },
  { id: "panini-nutella", categoryId: "paninis", name: "Panini Nutella", price: 400, available: true },

  // ——— ASSIETTES ———
  { id: "assiette-kebab", categoryId: "assiettes", name: "Kebab", description: "Boulgour, frites, crudités, kebab", price: 900, imageKey: "assiette-kebab-carre", available: true },
  { id: "assiette-merguez", categoryId: "assiettes", name: "Merguez", description: "Boulgour, frites, crudités, merguez", price: 850, imageKey: "assiette-merguez-carre", available: true },
  { id: "assiette-rs4", categoryId: "assiettes", name: "RS4", description: "Boulgour, frites, 3 steaks, œuf, fromage", price: 1050, imageKey: "assiette-rs4-carre", available: true },
  { id: "assiette-kefta", categoryId: "assiettes", name: "Kefta", description: "Boulgour, frites, crudités, 4 kefta", price: 900, imageKey: "assiette-kefta-carre", available: true },
  { id: "assiette-steak", categoryId: "assiettes", name: "Steak", description: "Boulgour, frites, crudités, 4 steaks", price: 850, imageKey: "assiette-steak-carre", available: true },
  { id: "assiette-poulet", categoryId: "assiettes", name: "Poulet", description: "Boulgour, frites, crudités, brochette de poulet", price: 850, imageKey: "assiette-poulet-carre", available: true },
  { id: "assiette-adana", categoryId: "assiettes", name: "Adana", description: "Boulgour, frites, crudités, adana", price: 950, imageKey: "assiette-adana-carre", available: true },
  { id: "assiette-brochette-agneau", categoryId: "assiettes", name: "Brochette d'agneau", description: "Boulgour, frites, crudités, brochette d'agneau", price: 1000, imageKey: "assiette-brochette-agneau-carre", available: true },
  { id: "assiette-chicken", categoryId: "assiettes", name: "Chicken", description: "Boulgour, frites, crudités, poulet curry", price: 950, imageKey: "assiette-chicken-carre", available: true },
  { id: "assiette-escalope", categoryId: "assiettes", name: "Escalope", description: "Boulgour, frites, crudités, escalope", price: 950, imageKey: "assiette-escalope-carre", available: true },
  { id: "assiette-entrecote", categoryId: "assiettes", name: "Entrecôte", description: "Boulgour, frites, crudités, entrecôte", price: 1300, imageKey: "assiette-entrecote-carre", available: true },
  { id: "assiette-mixte", categoryId: "assiettes", name: "Mixte", description: "Boulgour, frites, poulet, kebab, merguez", price: 1400, imageKey: "assiette-mixte-carre", available: true,
    toConfirm: "La photo « assiette mixte » montre aussi de la kefta/adana et un steak haché : vérifier qu'elle correspond bien à cette assiette." },

  // ——— PETIT PLUS ———
  { id: "frites", categoryId: "petit-plus", name: "Frites", price: null, priceOptions: [{ label: "Petite", price: 200 }, { label: "Grande", price: 300 }], available: true },
  { id: "viandes", categoryId: "petit-plus", name: "Viandes", price: null, priceOptions: [{ label: "Petite", price: 400 }, { label: "Grande", price: 600 }], available: true },
  { id: "ble", categoryId: "petit-plus", name: "Blé", price: null, priceOptions: [{ label: "Petite", price: 250 }, { label: "Grande", price: 350 }], available: true },
  { id: "nuggets-frites", categoryId: "petit-plus", name: "Nuggets + frites", price: 450, available: true,
    toConfirm: "Moins cher que « 5 nuggets » seuls (5,00 €) : vérifier." },
  { id: "nuggets-5", categoryId: "petit-plus", name: "5 nuggets", price: 500, available: true },

  // ——— DESSERTS ———
  { id: "baklava", categoryId: "desserts", name: "Baklava", price: 400, available: true },
  { id: "tarte-daim", categoryId: "desserts", name: "Tarte Daim", price: 250, available: true },
  { id: "tiramisu", categoryId: "desserts", name: "Tiramisu", price: 300, available: true },
  { id: "tiramisu-maison", categoryId: "desserts", name: "Tiramisu maison", price: 450, available: true },
  { id: "gateau-maison", categoryId: "desserts", name: "Gâteau maison", price: 690, available: true,
    toConfirm: "6,90 € lu sur le tableau : vérifier (part ou gâteau entier ?)." },
  { id: "lokum", categoryId: "desserts", name: "Lokum", price: 250, available: true },

  // ——— BOISSONS ———
  { id: "canette", categoryId: "boissons", name: "Canette 33 cl", price: 150, available: true },
  { id: "cristaline-aromatisee", categoryId: "boissons", name: "Cristaline", description: "Pêche ou fraise", price: 180, available: true },
  { id: "coca-cola", categoryId: "boissons", name: "Coca-Cola", price: 300, available: true, toConfirm: "Contenance non indiquée (1,5 L ?)." },
  { id: "oasis-2l", categoryId: "boissons", name: "Oasis 2 L", price: 350, available: true },
  { id: "cafe", categoryId: "boissons", name: "Café", price: 150, available: true },
  { id: "the", categoryId: "boissons", name: "Thé", price: 120, available: true },
];

export const tacos = {
  formulas: [
    { label: "1 viande", price: 600, meats: 1 },
    { label: "2 viandes", price: 700, meats: 2 },
    { label: "3 viandes", price: 900, meats: 3 },
  ] satisfies TacosSize[],
  meats: ["Nuggets", "Chicken", "Cordon bleu", "Kebab", "Merguez", "Kefta", "Poulet", "Steak", "Tenders"],
  supplements: [
    { label: "Frites, cheddar", price: 50 },
    { label: "Chèvre, œuf", price: 100 },
    { label: "Sauce", price: 50 },
  ] satisfies TacosFormula[],
};

/** Points relevés pendant la transcription, à faire valider. */
export const MENU_TODO = [
  "Aucun sandwich « Kebab » classique n'apparaît sur le tableau : oubli ou volontaire ?",
  "Lahmacun photographié mais absent de la carte : à ajouter (nom, prix) ou retirer la photo.",
  "Liste des sauces disponibles : TODO_CONTENT (proposition dans src/data/options.ts)",
  "Formules / menus (boisson incluse ?) : TODO_CONTENT (proposition dans src/data/options.ts)",
];

/** Prix façon carte du restaurant : 850 -> "8€50". */
export const formatPrice = (cents: number) => {
  const euros = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `${euros}€${rest}`;
};

/** Version lue par les lecteurs d'écran : 850 -> "8,50 euros". */
export const spokenPrice = (cents: number) =>
  `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} euros`;
