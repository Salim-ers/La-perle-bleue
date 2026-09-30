import { restaurant } from "@/data/restaurant";
import { isFilled } from "./utils";
import { hoursSummary } from "./hours";

/** URL publique : variable d'environnement, puis domaine de production Vercel. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const city = isFilled(restaurant.address.city) ? restaurant.address.city : null;

export const defaultTitle = city
  ? `${restaurant.name} | Kebab, Tacos & Grillades à ${city}`
  : `${restaurant.name} | Kebab, Tacos & Grillades`;

export const defaultDescription = `${restaurant.name}, restaurant grillade${
  city ? ` à ${city}` : ""
} : kebabs, tacos, burgers, sandwichs et assiettes grillées. Sur place ou à emporter${
  hoursSummary(restaurant.openingHours) ? `, ${hoursSummary(restaurant.openingHours)}` : ""
}.`;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/menu", label: "Notre carte" },
  { href: "/#incontournables", label: "Nos spécialités" },
  { href: "/galerie", label: "Galerie" },
  { href: "/#avis", label: "Avis", requiresReviews: true },
  { href: "/contact", label: "Contact" },
] as const;
