/**
 * Réglages techniques de la commande en ligne.
 * Les réglages modifiables par le restaurant (pause, délai de préparation,
 * commandes max par créneau, horaires) sont en base (`restaurant_settings`)
 * et se changent depuis /admin : ces valeurs ne servent que de défaut initial.
 */
import type { FulfillmentType } from "@/features/order/types";

export const orderingSettings = {
  /** Délai de préparation initial (minutes), modifiable dans l'admin. */
  defaultPreparationDelay: 20,
  /** Choix proposés dans l'admin. */
  preparationDelayChoices: [15, 20, 30, 45, 60],
  /** Commandes maximum par créneau, valeur initiale. */
  defaultMaxOrdersPerSlot: 6,
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
  /** Une commande non payée après ce délai est annulée (paiement abandonné). */
  pendingPaymentTimeoutMinutes: 30,
};

export type OrderingSettings = typeof orderingSettings;
