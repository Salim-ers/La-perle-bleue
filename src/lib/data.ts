/**
 * Point d'accès unique aux données. Aujourd'hui : fichiers statiques.
 * Demain : base de données / CMS / back-office de commande, sans toucher aux pages.
 */
import { categories, products, tacos } from "@/data/menu";
import { restaurant } from "@/data/restaurant";
import { reviews } from "@/data/reviews";

export async function getRestaurant() {
  return restaurant;
}

export async function getMenu() {
  return {
    categories,
    products: products.filter((p) => p.available),
    tacos,
  };
}

export async function getReviews() {
  return reviews;
}

/** Produits mis en avant sur l'accueil (avec vraie photo). */
export const featuredIds = [
  "assiette-mixte",
  "berliner-kebab",
  "assiette-entrecote",
  "assiette-poulet",
] as const;
