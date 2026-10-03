/** Heure de Paris côté serveur (Vercel tourne en UTC). */
import "server-only";

const TZ = "Europe/Paris";

function parisParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const offset = get("timeZoneName").match(/GMT([+-])(\d{2}):?(\d{2})?/);
  const offsetMinutes = offset ? (offset[1] === "-" ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) : 0;
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), offsetMinutes };
}

/** Date UTC correspondant à « aujourd'hui à HH:MM » à Paris (minutes depuis minuit, > 24 h accepté). */
export function parisTodayAt(minutesOfDay: number, now = new Date()): Date {
  const { year, month, day } = parisParts(now);
  const guess = Date.UTC(year, month - 1, day, Math.floor(minutesOfDay / 60), minutesOfDay % 60);
  const { offsetMinutes } = parisParts(new Date(guess));
  return new Date(guess - offsetMinutes * 60_000);
}

/** « 19:45 » à Paris. */
export function formatParisTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Début et fin de la journée en cours à Paris. */
export function parisDayBounds(now = new Date()) {
  return { start: parisTodayAt(0, now), end: parisTodayAt(24 * 60, now) };
}
