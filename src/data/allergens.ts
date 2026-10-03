/**
 * Allergènes par produit (14 allergènes réglementaires, voir ALLERGENS).
 *
 * Obligatoire pour la vente en ligne : l'information doit être disponible
 * AVANT l'achat. Ne JAMAIS deviner : seul le restaurateur peut remplir ce
 * fichier, d'après ses fiches recettes et les étiquettes de ses fournisseurs.
 * Un produit absent de cette liste affiche « allergènes : renseignez-vous ».
 *
 * Exemple : "sandwich-merguez": ["gluten", "moutarde", "sesame"],
 */
import type { Allergen } from "@/features/order/types";

// TODO(restaurateur) : allergènes de chaque plat, sauce et boisson.
export const productAllergens: Partial<Record<string, Allergen[]>> = {};
