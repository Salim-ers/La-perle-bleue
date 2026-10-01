/**
 * Réglages de la commande en ligne.
 * Phase 2 : ces valeurs seront administrables depuis /admin (table Supabase
 * `settings`) ; d'ici là, les modifier ici suffit.
 */
import type { FulfillmentType } from "@/features/order/types";

export const orderingSettings = {
  /** Temps de préparation annoncé, en minutes (barre d'information, retrait). */
  prepTime: { min: 15, max: 25 },
  /** Pas des créneaux de retrait, en minutes. */
  slotInterval: 15,
  /** Dernier retrait possible avant la fermeture, en minutes. */
  lastPickupBeforeClose: 15,
  /** V1 : retrait sur place uniquement. Ajouter "DELIVERY" activera la livraison (non implémentée). */
  fulfillmentTypes: ["PICKUP"] as FulfillmentType[],
  maxQuantityPerItem: 20,
  maxItemsPerOrder: 30,
  /** Durée de conservation du panier dans le navigateur. */
  cartMaxAgeHours: 24,
};

export type OrderingSettings = typeof orderingSettings;
