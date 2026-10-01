/**
 * Types du domaine « commande ». Partagés par le configurateur, le panier,
 * l'API /api/checkout et, en phase 2, le back-office et Supabase.
 * Tous les montants sont en centimes (entiers).
 */
import type { ImageKey } from "@/data/images";
import type { MenuCategoryId } from "@/data/menu";

export type Cents = number;

// ——— Catalogue ———

export interface Option {
  id: string;
  name: string;
  /** Supplément en centimes (0 = inclus). */
  priceDelta: Cents;
  /** Coché par défaut (ex. crudités incluses, pain classique). */
  default?: boolean;
  /** `false` = rupture : l'option reste visible mais ne peut pas être choisie. */
  available?: boolean;
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
   * Résumé dans le panier :
   * - "always" (défaut) : « Sauces : Blanche, Harissa »
   * - "changes" : seulement si différent du choix par défaut (« Galette »)
   * - "removed" : ingrédients retirés (« Sans oignons »)
   */
  summary?: "always" | "changes" | "removed";
  /** Limites qui dépendent d'un autre groupe (ex. tacos : nombre de viandes selon la taille). */
  limitsFrom?: { groupId: string; byOption: Record<string, { min: number; max: number }> };
  /** Point à faire valider par le restaurateur avant l'ouverture du paiement. */
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
}

/** Choix du client pour un produit : groupId -> optionIds. */
export type Selection = Record<string, string[]>;

// ——— Commandes ———

export const ORDER_STATUSES = [
  "PENDING",
  "PENDING_PAYMENT",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Créée",
  PENDING_PAYMENT: "Paiement en cours",
  PAID: "Payée",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY: "Prête à retirer",
  COMPLETED: "Retirée",
  CANCELLED: "Annulée",
};

/** Transitions autorisées (back-office de la phase 2). PAID n'est posé QUE par le webhook Stripe. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** Statuts qui prouvent un paiement confirmé par le serveur. */
export const PAID_STATUSES: OrderStatus[] = ["PAID", "ACCEPTED", "PREPARING", "READY", "COMPLETED"];

/** V1 : PICKUP uniquement. DELIVERY est prévu dans le modèle mais non activé. */
export type FulfillmentType = "PICKUP" | "DELIVERY";

/** Heure de retrait, en heure de Paris ("HH:MM"). */
export type PickupTime = { type: "ASAP" } | { type: "SCHEDULED"; time: string };

export interface Customer {
  firstName: string;
  phone: string;
  email: string;
}

export interface OrderItemOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: Cents;
}

export interface OrderItem {
  id: string;
  productId: string;
  /** Nom et prix figés au moment de la commande (le catalogue peut changer ensuite). */
  productName: string;
  options: OrderItemOption[];
  quantity: number;
  unitPrice: Cents;
  totalPrice: Cents;
  note?: string;
}

export interface Order {
  id: string;
  /** Numéro court lisible au comptoir, ex. « A-042 ». */
  number: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  pickup: PickupTime;
  customer: Customer;
  items: OrderItem[];
  subtotal: Cents;
  total: Cents;
  currency: "EUR";
  note?: string;
  createdAt: string;
  paidAt?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
}

// ——— Contrat de l'API POST /api/checkout ———

/** Le client n'envoie QUE des identifiants et des quantités : jamais de prix. */
export interface CheckoutRequestItem {
  productId: string;
  options: Selection;
  quantity: number;
  note?: string;
}

export interface CheckoutRequest {
  items: CheckoutRequestItem[];
  customer: Customer;
  pickup: PickupTime;
  fulfillment: FulfillmentType;
  note?: string;
}

export type CheckoutErrorCode =
  | "BAD_REQUEST"
  | "INVALID_CUSTOMER"
  | "INVALID_ITEMS"
  | "FULFILLMENT_UNAVAILABLE"
  | "PICKUP_UNAVAILABLE"
  | "PAYMENT_UNAVAILABLE";

export type CheckoutResponse =
  | { ok: true; checkoutUrl: string }
  | {
      ok: false;
      code: CheckoutErrorCode;
      message: string;
      /** Total recalculé par le serveur, quand la commande est valide. */
      total?: Cents;
      fieldErrors?: Partial<Record<keyof Customer, string>>;
    };
