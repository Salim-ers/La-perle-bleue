/**
 * Créneaux de retrait (heure de Paris), calculés à partir des horaires,
 * du délai de préparation et du nombre maximum de commandes par créneau.
 * Fonction pure : le serveur lui fournit les réglages et le nombre de
 * commandes déjà prises par créneau, puis revérifie au moment du paiement.
 */
import { orderingSettings } from "@/data/ordering";
import type { Day, TimeRange } from "@/data/restaurant";
import { WEEK, toMinutes } from "@/lib/hours";

const pad = (n: number) => String(n).padStart(2, "0");

/** 1170 -> "19:30" */
export const minutesToTime = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

/** "19:30" -> "19 h 30" */
export const formatSlot = (time: string) => {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};

export interface PickupSlot {
  time: string;
  available: boolean;
}

export interface PickupAvailability {
  ordersEnabled: boolean;
  /** Retrait « dès que possible » ouvert maintenant, et heure estimée. */
  asap: { available: boolean; readyAt: string | null };
  slots: PickupSlot[];
  preparationDelay: number;
}

export interface PickupInput {
  now: { dayIndex: number; minutes: number };
  hours: Record<Day, TimeRange[]>;
  ordersEnabled: boolean;
  preparationDelay: number;
  maxOrdersPerSlot: number;
  /** Nombre de commandes déjà prises par créneau "HH:MM". */
  slotCounts: Record<string, number>;
  slotInterval?: number;
  lastPickupBeforeClose?: number;
}

/** Créneau de rattachement d'une heure (arrondi au créneau supérieur). */
export const slotFor = (minutes: number, interval = orderingSettings.slotInterval) =>
  minutesToTime(Math.ceil(minutes / interval) * interval);

export function computePickupAvailability(input: PickupInput): PickupAvailability {
  const interval = input.slotInterval ?? orderingSettings.slotInterval;
  const buffer = input.lastPickupBeforeClose ?? orderingSettings.lastPickupBeforeClose;
  const { now, preparationDelay: delay } = input;
  const slots: PickupSlot[] = [];
  let asap: PickupAvailability["asap"] = { available: false, readyAt: null };
  const hasRoom = (time: string) => (input.slotCounts[time] ?? 0) < input.maxOrdersPerSlot;

  if (input.ordersEnabled) {
    // TODO(phase 2) : précommande pour un autre jour et services ouverts après minuit (veille).
    for (const r of input.hours[WEEK[now.dayIndex].id] ?? []) {
      const open = toMinutes(r.open);
      let close = toMinutes(r.close);
      if (close <= open) close += 24 * 60;
      const last = close - buffer;
      const ready = now.minutes + delay;
      if (now.minutes >= open && ready <= last && hasRoom(slotFor(ready, interval))) {
        asap = { available: true, readyAt: minutesToTime(ready) };
      }
      const earliest = Math.max(open + delay, now.minutes + delay);
      const first = Math.ceil(earliest / interval) * interval;
      for (let t = first; t <= last; t += interval) {
        const time = minutesToTime(t);
        slots.push({ time, available: hasRoom(time) });
      }
    }
  }
  return { ordersEnabled: input.ordersEnabled, asap, slots, preparationDelay: delay };
}
