import type { Day, TimeRange } from "@/data/restaurant";

export const WEEK: { id: Day; label: string }[] = [
  { id: "monday", label: "Lundi" },
  { id: "tuesday", label: "Mardi" },
  { id: "wednesday", label: "Mercredi" },
  { id: "thursday", label: "Jeudi" },
  { id: "friday", label: "Vendredi" },
  { id: "saturday", label: "Samedi" },
  { id: "sunday", label: "Dimanche" },
];

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "23:00" -> "23 h", "11:30" -> "11 h 30" */
export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};

export const formatRanges = (ranges: TimeRange[]) =>
  ranges.length === 0
    ? "Fermé"
    : ranges.map((r) => `${formatTime(r.open)} – ${formatTime(r.close)}`).join(", ");

/** Jour et minute courants à Paris, quel que soit le fuseau du visiteur. */
export function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday").toLowerCase() as Day;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { dayIndex: WEEK.findIndex((d) => d.id === day), minutes };
}

export type OpenStatus = { open: boolean; label: string };

export function getOpenStatus(
  hours: Record<Day, TimeRange[]>,
  now = parisNow(),
): OpenStatus {
  const today = WEEK[now.dayIndex];
  for (const r of hours[today.id]) {
    const open = toMinutes(r.open);
    let close = toMinutes(r.close);
    if (close <= open) close += 24 * 60; // fermeture après minuit
    if (now.minutes >= open && now.minutes < close) {
      return { open: true, label: `Ouvert jusqu'à ${formatTime(r.close)}` };
    }
  }
  // Prochaine ouverture
  for (let offset = 0; offset < 7; offset++) {
    const d = WEEK[(now.dayIndex + offset) % 7];
    const next = hours[d.id].find((r) => offset > 0 || toMinutes(r.open) > now.minutes);
    if (next) {
      const when =
        offset === 0 ? "aujourd'hui" : offset === 1 ? "demain" : d.label.toLowerCase();
      return { open: false, label: `Fermé, ouvre ${when} à ${formatTime(next.open)}` };
    }
  }
  return { open: false, label: "Fermé" };
}

/** Résumé lisible : "du lundi au samedi de 11 h à 23 h" (jours consécutifs identiques). */
export function hoursSummary(hours: Record<Day, TimeRange[]>) {
  const open = WEEK.filter((d) => hours[d.id].length > 0);
  if (open.length === 0) return "";
  const first = hours[open[0].id];
  const same = open.every((d) => JSON.stringify(hours[d.id]) === JSON.stringify(first));
  const idx = open.map((d) => WEEK.indexOf(d));
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (same && consecutive && first.length === 1) {
    const days =
      open.length === 7
        ? "tous les jours"
        : `du ${open[0].label.toLowerCase()} au ${open.at(-1)!.label.toLowerCase()}`;
    return `${days} de ${formatTime(first[0].open)} à ${formatTime(first[0].close)}`;
  }
  return "";
}
