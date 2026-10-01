/**
 * Point d'accès unique aux données. Aujourd'hui : fichiers statiques.
 * Demain : base de données / CMS / back-office de commande, sans toucher aux pages.
 */
import type { ImageKey } from "@/data/images";
import { categories, products, tacos } from "@/data/menu";
import { orderingSettings } from "@/data/ordering";
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

/**
 * « Les favoris » de l'accueil : produits avec une vraie photo 4:5.
 * `badge` remplace celui de la carte. « Best seller » : à attribuer
 * uniquement d'après les ventes réelles (TODO phase 2, statistiques des commandes).
 */
export const featured: { id: string; image: ImageKey; pitch: string; badge?: string }[] = [
  { id: "assiette-mixte", image: "assiette-mixte", pitch: "Poulet, kebab et merguez grillés, boulgour et frites.", badge: "Généreux" },
  { id: "berliner-kebab", image: "berliner-kebab", pitch: "Chou rouge, carotte, feta et sauce bergère." },
  { id: "assiette-entrecote", image: "assiette-entrecote", pitch: "Entrecôte grillée, boulgour, frites et crudités." },
  { id: "assiette-poulet", image: "assiette-poulet", pitch: "Brochette de poulet, boulgour, frites et crudités." },
];

export async function getOrderingSettings() {
  return orderingSettings;
}
