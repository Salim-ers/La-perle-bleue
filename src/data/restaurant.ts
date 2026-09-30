/**
 * Informations pratiques de La Perle Bleue.
 * Règle : uniquement des données confirmées. Toute valeur "TODO_CONTENT"
 * est détectée par `isFilled()` et masquée ou signalée dans l'interface.
 */

export type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type TimeRange = { open: string; close: string };

export interface Restaurant {
  name: string;
  tagline: string;
  address: { street: string; postalCode: string; city: string; country: string };
  phone: string;
  email: string;
  googleMapsUrl: string;
  googleReviewsUrl: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  priceRange: string;
  servesCuisine: string[];
  socialLinks: { instagram: string; facebook: string; tiktok: string };
  openingHours: Record<Day, TimeRange[]>;
  services: { dineIn: boolean; takeaway: boolean; delivery: boolean | null };
}

export const restaurant: Restaurant = {
  name: "La Perle Bleue",
  // Mention présente sur l'enseigne et les vitrines.
  tagline: "Restaurant grillade",
  address: {
    street: "TODO_CONTENT",
    postalCode: "TODO_CONTENT",
    city: "TODO_CONTENT",
    country: "FR",
  },
  phone: "TODO_CONTENT", // format conseillé : "+33 X XX XX XX XX"
  email: "TODO_CONTENT",
  googleMapsUrl: "TODO_CONTENT",
  googleReviewsUrl: "TODO_CONTENT",
  // Ne jamais renseigner sans la vraie donnée Google.
  googleRating: null,
  googleReviewCount: null,
  // Déduit de la carte (1€20 à 14€00).
  priceRange: "€",
  servesCuisine: ["Kebab", "Grillades", "Tacos", "Burgers", "Sandwichs"],
  socialLinks: {
    instagram: "TODO_CONTENT",
    facebook: "TODO_CONTENT",
    tiktok: "TODO_CONTENT",
  },
  // Source : carte du restaurant, « Ouvert du lundi au samedi de 11h à 23h ».
  // Dimanche non mentionné : considéré fermé, À CONFIRMER.
  openingHours: {
    monday: [{ open: "11:00", close: "23:00" }],
    tuesday: [{ open: "11:00", close: "23:00" }],
    wednesday: [{ open: "11:00", close: "23:00" }],
    thursday: [{ open: "11:00", close: "23:00" }],
    friday: [{ open: "11:00", close: "23:00" }],
    saturday: [{ open: "11:00", close: "23:00" }],
    sunday: [],
  },
  services: {
    dineIn: true, // salle visible sur les photos
    takeaway: true, // commandes emballées au comptoir
    delivery: null, // non confirmé : ne rien afficher
  },
};
