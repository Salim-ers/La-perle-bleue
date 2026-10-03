/**
 * Mode démonstration (présentation au restaurateur), 100 % dans le navigateur.
 *
 * Activé seulement sur l'appareil qui ouvre le site avec `?demo=1` (désactivé
 * avec `?demo=0` ou le bouton « Quitter »). Aucune commande n'est envoyée au
 * restaurant, aucun paiement n'a lieu, aucune base n'est utilisée : les
 * commandes de démo vivent dans le localStorage, partagé entre les onglets du
 * même navigateur (un onglet « client » + un onglet « cuisine » se répondent).
 */
import { create } from "zustand";
import { restaurant } from "@/data/restaurant";
import type { KitchenOrder, KitchenSnapshot } from "@/features/kitchen/types";
import { computePickupAvailability, minutesToTime, type PickupAvailability } from "@/features/order/pickup";
import type { Customer, KitchenAction, OrderStatus, PaymentStatus, PickupTime, PublicOrderStatus, RefusalReason } from "@/features/order/types";
import { parisNow, toMinutes } from "@/lib/hours";

const FLAG = "lpb-demo";
const ORDERS = "lpb-demo-orders";
export const DEMO_PREPARATION_DELAY = 20;

export interface DemoOrder {
  id: string;
  number: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  pickupType: "ASAP" | "SCHEDULED";
  pickupAt: string;
  total: number;
  customer: Customer;
  notes?: string;
  cancelReason?: string;
  items: { productName: string; quantity: number; summary: string[]; kitchenLines: string[]; note?: string }[];
}

const storage = () => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export function isDemoActive() {
  return storage()?.getItem(FLAG) === "1";
}

export const useDemo = create<{ active: boolean; sync: () => void; set: (on: boolean) => void }>()((set) => ({
  active: false,
  sync: () => set({ active: isDemoActive() }),
  set: (on) => {
    const s = storage();
    if (on) s?.setItem(FLAG, "1");
    else {
      s?.removeItem(FLAG);
      s?.removeItem(ORDERS);
    }
    set({ active: on });
  },
}));

function readOrders(): DemoOrder[] {
  try {
    return JSON.parse(storage()?.getItem(ORDERS) ?? "[]") as DemoOrder[];
  } catch {
    return [];
  }
}

function writeOrders(orders: DemoOrder[]) {
  storage()?.setItem(ORDERS, JSON.stringify(orders.slice(-50)));
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const parisTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Créneaux de démo : horaires réels, ou toute la journée si le restaurant est fermé au moment de la présentation. */
export function demoPickupAvailability(): PickupAvailability {
  const base = { now: parisNow(), ordersEnabled: true, preparationDelay: DEMO_PREPARATION_DELAY, maxOrdersPerSlot: 99, slotCounts: {} };
  const real = computePickupAvailability({ ...base, hours: restaurant.openingHours });
  if (real.asap.available || real.slots.length) return real;
  const allDay = { open: "00:00", close: "23:59" };
  const hours = Object.fromEntries(Object.keys(restaurant.openingHours).map((d) => [d, [allDay]])) as typeof restaurant.openingHours;
  return computePickupAvailability({ ...base, hours });
}

export function createDemoOrder(input: {
  customer: Customer;
  pickup: PickupTime;
  note?: string;
  total: number;
  items: DemoOrder["items"];
}): DemoOrder {
  const orders = readOrders();
  const pickupAt =
    input.pickup.type === "ASAP"
      ? minutesToTime(parisNow().minutes + DEMO_PREPARATION_DELAY)
      : minutesToTime(toMinutes(input.pickup.time));
  const order: DemoOrder = {
    id: newId(),
    number: 100 + orders.length,
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    createdAt: new Date().toISOString(),
    pickupType: input.pickup.type,
    pickupAt,
    total: input.total,
    customer: input.customer,
    notes: input.note,
    items: input.items,
  };
  writeOrders([...orders, order]);
  return order;
}

export function getDemoOrder(id: string) {
  return readOrders().find((o) => o.id === id) ?? null;
}

function update(id: string, patch: Partial<DemoOrder>) {
  writeOrders(readOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

/** Résultat de la page de paiement simulée. */
export function demoPayment(id: string, outcome: "authorized" | "failed" | "canceled") {
  if (outcome === "authorized") update(id, { status: "NEW", paymentStatus: "AUTHORIZED" });
  else update(id, { status: "CANCELLED", paymentStatus: outcome === "failed" ? "FAILED" : "CANCELLED", cancelReason: "Paiement non finalisé" });
}

export function demoPublicStatus(id: string): PublicOrderStatus | null {
  const o = getDemoOrder(id);
  if (!o) return null;
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    paymentStatus: o.paymentStatus,
    pickupType: o.pickupType,
    pickupAt: o.pickupAt,
    total: o.total,
    firstName: o.customer.firstName,
    items: o.items.map((i) => ({ quantity: i.quantity, productName: i.productName, summary: i.summary })),
    createdAt: o.createdAt,
    cancelReason: o.cancelReason,
  };
}

const KITCHEN: OrderStatus[] = ["NEW", "ACCEPTED", "PREPARING", "READY"];

export function demoKitchenSnapshot(): KitchenSnapshot {
  const orders: KitchenOrder[] = readOrders()
    .filter((o) => KITCHEN.includes(o.status))
    .map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      createdLabel: parisTime(o.createdAt),
      pickupType: o.pickupType,
      pickupLabel: o.pickupAt,
      total: o.total,
      notes: o.notes ?? null,
      customer: { name: `${o.customer.firstName} ${o.customer.lastName.charAt(0).toUpperCase()}.`, phone: o.customer.phone },
      items: o.items.map((i) => ({ quantity: i.quantity, productName: i.productName, kitchenLines: i.kitchenLines, note: i.note ?? null })),
    }));
  return { orders, settings: { ordersEnabled: true, preparationDelay: DEMO_PREPARATION_DELAY }, serverTime: new Date().toISOString() };
}

const NEXT: Partial<Record<KitchenAction, { from: OrderStatus[]; to: OrderStatus; payment?: PaymentStatus }>> = {
  accept: { from: ["NEW"], to: "ACCEPTED", payment: "CAPTURED" },
  start: { from: ["ACCEPTED"], to: "PREPARING" },
  ready: { from: ["PREPARING", "ACCEPTED"], to: "READY" },
  complete: { from: ["READY"], to: "COMPLETED" },
};

export async function demoKitchenAction(id: string, action: KitchenAction, reason?: RefusalReason): Promise<string | null> {
  const o = getDemoOrder(id);
  if (!o) return "Commande introuvable.";
  if (action === "refuse") {
    update(id, { status: "CANCELLED", paymentStatus: o.paymentStatus === "CAPTURED" ? "REFUNDED" : "CANCELLED", cancelReason: reason ?? "autre" });
    return null;
  }
  const step = NEXT[action];
  if (!step || !step.from.includes(o.status)) return "La commande a changé entre-temps.";
  update(id, { status: step.to, ...(step.payment ? { paymentStatus: step.payment } : {}) });
  return null;
}
