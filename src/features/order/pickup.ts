/**
 * Créneaux de retrait (heure de Paris). Utilisé par le formulaire de commande
 * et revérifié par /api/checkout au moment du paiement.
 */
import { orderingSettings, type OrderingSettings } from "@/data/ordering";
import { restaurant, type Day, type TimeRange } from "@/data/restaurant";
import { WEEK, parisNow, toMinutes } from "@/lib/hours";
import type { PickupTime } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** 1170 -> "19:30" */
export const minutesToTime = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

/** "19:30" -> "19 h 30" */
export const formatSlot = (time: string) => {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};

export interface PickupAvailability {
  /** Retrait « dès que possible » ouvert maintenant. */
  asap: boolean;
  /** Créneaux restants aujourd'hui, "HH:MM". */
  slots: string[];
}

export function getPickupAvailability(
  now = parisNow(),
  hours: Record<Day, TimeRange[]> = restaurant.openingHours,
  s: OrderingSettings = orderingSettings,
): PickupAvailability {
  const slots: string[] = [];
  let asap = false;
  // TODO(phase 2) : précommande pour le lendemain et services ouverts après minuit (veille).
  for (const r of hours[WEEK[now.dayIndex].id]) {
    const open = toMinutes(r.open);
    let close = toMinutes(r.close);
    if (close <= open) close += 24 * 60;
    const last = close - s.lastPickupBeforeClose;
    if (now.minutes >= open && now.minutes + s.prepTime.min <= last) asap = true;
    const earliest = Math.max(open + s.prepTime.min, now.minutes + s.prepTime.max);
    const first = Math.ceil(earliest / s.slotInterval) * s.slotInterval;
    for (let t = first; t <= last; t += s.slotInterval) slots.push(minutesToTime(t));
  }
  return { asap, slots };
}

export function isPickupAvailable(pickup: PickupTime, availability = getPickupAvailability()) {
  return pickup.type === "ASAP" ? availability.asap : availability.slots.includes(pickup.time);
}
