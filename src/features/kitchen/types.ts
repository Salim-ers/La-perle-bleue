import type { Cents, OrderStatus, PaymentStatus } from "@/features/order/types";

/** Commande telle qu'affichée en cuisine (aucune donnée inutile : pas d'e-mail, nom abrégé). */
export interface KitchenOrder {
  id: string;
  number: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  createdLabel: string;
  pickupType: "ASAP" | "SCHEDULED";
  pickupLabel: string;
  total: Cents;
  notes: string | null;
  customer: { name: string; phone: string };
  items: { quantity: number; productName: string; kitchenLines: string[]; note: string | null }[];
}

export interface KitchenSnapshot {
  orders: KitchenOrder[];
  settings: { ordersEnabled: boolean; preparationDelay: number };
  serverTime: string;
}
