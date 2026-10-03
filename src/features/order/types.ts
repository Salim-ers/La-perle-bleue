/**
 * Types du domaine « commande ». Partagés par le configurateur, le panier,
 * l'API, le webhook Mollie et l'interface cuisine.
 * Tous les montants sont en centimes (entiers).
 */
import type { ImageKey } from "@/data/images";
import type { MenuCategoryId } from "@/data/menu";

export type Cents = number;

// ——— Catalogue ———

/** Les 14 allergènes à déclaration obligatoire (règlement UE 1169/2011). */
export const ALLERGENS = {
  gluten: "Gluten",
  crustaces: "Crustacés",
  oeufs: "Œufs",
  poissons: "Poissons",
  arachides: "Arachides",
  soja: "Soja",
  lait: "Lait",
  "fruits-a-coque": "Fruits à coque",
  celeri: "Céleri",
  moutarde: "Moutarde",
  sesame: "Sésame",
  sulfites: "Sulfites",
  lupin: "Lupin",
  mollusques: "Mollusques",
} as const;
export type Allergen = keyof typeof ALLERGENS;

export interface Option {
  /** Identifiant global : une rupture « kebab » s'applique à tous les groupes qui le proposent. */
  id: string;
  name: string;
  /** Supplément en centimes (0 = inclus). */
  priceDelta: Cents;
  /** Coché par défaut (ex. crudités incluses, pain classique). */
  default?: boolean;
  /** `false` = rupture : visible mais impossible à choisir. */
  available?: boolean;
}

/** Condition d'affichage d'un groupe selon le choix fait dans un autre groupe. */
export interface GroupCondition {
  groupId: string;
  optionIds: string[];
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: Option[];
  /** Texte d'aide. Sinon, calculé à partir de min / max. */
  hint?: string;
  /** Unité affichée dans l'aide : ["sauce", "sauces"] -> « Jusqu'à 2 sauces ». */
  unit?: [singular: string, plural: string];
  /**
   * Résumé panier :
   * - "always" (défaut) : « Sauces : Blanche, Harissa »
   * - "changes" : seulement si différent du choix par défaut (« Galette »)
   * - "removed" : ingrédients retirés (« Sans oignons »)
   */
  summary?: "always" | "changes" | "removed";
  /** Limites dépendant d'un autre groupe (ex. tacos : nombre de viandes selon la taille). */
  limitsFrom?: { groupId: string; byOption: Record<string, { min: number; max: number }> };
  /** Groupe affiché seulement si ce choix est fait (ex. boisson si formule = menu). */
  visibleIf?: GroupCondition;
  /** Groupe masqué si ce choix est fait (ex. frites à part masquées si menu, déjà incluses). */
  hiddenIf?: GroupCondition;
  /** Nombre de choix inclus ; au-delà, chaque choix coûte `extraPriceDelta` (ex. 2 sauces incluses). */
  included?: number;
  extraPriceDelta?: Cents;
  /** Point à faire valider par le restaurateur. */
  toConfirm?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: MenuCategoryId;
  basePrice: Cents;
  image?: ImageKey;
  badge?: string;
  available: boolean;
  optionGroups: OptionGroup[];
  /** `null` = non communiqués par le restaurant (jamais inventés). */
  allergens: Allergen[] | null;
}

/** Choix du client pour un produit : groupId -> optionIds. */
export type Selection = Record<string, string[]>;

/** Un produit configuré, tel qu'envoyé au serveur (jamais de prix). */
export interface ProductConfiguration {
  productId: string;
  options: Selection;
  quantity: number;
  note?: string;
}

export interface PriceBreakdown {
  basePrice: Cents;
  optionsPrice: Cents;
  unitPrice: Cents;
  total: Cents;
}

// ——— Commandes ———

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "AUTHORIZED", "CAPTURED", "CANCELLED", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Paiement en cours",
  NEW: "Commande reçue",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY: "Prête",
  COMPLETED: "Récupérée",
  CANCELLED: "Annulée",
};

/** Actions cuisine possibles selon le statut. */
export const KITCHEN_ACTIONS = {
  NEW: ["accept", "refuse"],
  ACCEPTED: ["start", "refuse"],
  PREPARING: ["ready"],
  READY: ["complete"],
} as const satisfies Partial<Record<OrderStatus, readonly string[]>>;
export type KitchenAction = "accept" | "refuse" | "start" | "ready" | "complete";

export const REFUSAL_REASONS = {
  rupture: "Produit en rupture",
  affluence: "Trop de commandes",
  fermeture: "Fermeture",
  autre: "Autre raison",
} as const;
export type RefusalReason = keyof typeof REFUSAL_REASONS;

/** V1 : PICKUP uniquement. DELIVERY est prévu dans le modèle mais refusé par l'API. */
export type FulfillmentType = "PICKUP" | "DELIVERY";

/** Heure de retrait, en heure de Paris ("HH:MM"). */
export type PickupTime = { type: "ASAP" } | { type: "SCHEDULED"; time: string };

export interface Customer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

/** Ligne de commande figée au moment du paiement (le catalogue peut changer ensuite). */
export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Cents;
  totalPrice: Cents;
  note?: string;
  /** Résumé client (« Galette », « Sans oignons »…). */
  summary: string[];
  /** Détail complet pour la cuisine (tous les choix, rien de masqué). */
  kitchenLines: string[];
  options: {
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    priceDelta: Cents;
  }[];
}

// ——— Contrat de l'API POST /api/checkout ———

export interface CheckoutRequest {
  /** Identifiant de tentative généré par le navigateur : un double clic ne crée qu'une commande. */
  attemptId: string;
  items: ProductConfiguration[];
  customer: Customer;
  pickup: PickupTime;
  fulfillment: FulfillmentType;
  note?: string;
}

export type CheckoutErrorCode =
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "ORDERS_PAUSED"
  | "INVALID_CUSTOMER"
  | "INVALID_ITEMS"
  | "FULFILLMENT_UNAVAILABLE"
  | "PICKUP_UNAVAILABLE"
  | "PAYMENT_UNAVAILABLE"
  | "SERVER_ERROR";

export type CheckoutResponse =
  | { ok: true; orderId: string; checkoutUrl: string }
  | {
      ok: false;
      code: CheckoutErrorCode;
      message: string;
      total?: Cents;
      fieldErrors?: Partial<Record<keyof Customer, string>>;
    };

/** Statut public d'une commande (page de suivi). Aucune donnée personnelle sensible. */
export interface PublicOrderStatus {
  id: string;
  number: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  pickupType: "ASAP" | "SCHEDULED";
  pickupAt: string;
  total: Cents;
  firstName: string;
  items: { quantity: number; productName: string; summary: string[] }[];
  createdAt: string;
  cancelReason?: string;
}

/** Réglages publics en direct (pause, délai, ruptures). */
export interface LiveSettings {
  ordersEnabled: boolean;
  preparationDelay: number;
  unavailableProducts: string[];
  unavailableOptions: string[];
}
