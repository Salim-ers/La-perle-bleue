import type { StaticImageData } from "next/image";

import assietteEntrecote from "@/assets/images/assiette-entrecote.webp";
import assietteEntrecoteCarre from "@/assets/images/assiette-entrecote-carre.webp";
import assietteMixte from "@/assets/images/assiette-mixte.webp";
import assietteMixteCarre from "@/assets/images/assiette-mixte-carre.webp";
import assiettePoulet from "@/assets/images/assiette-poulet.webp";
import assiettePouletCarre from "@/assets/images/assiette-poulet-carre.webp";
import berlinerKebab from "@/assets/images/berliner-kebab.webp";
import berlinerKebabCarre from "@/assets/images/berliner-kebab-carre.webp";
import comptoirCommandes from "@/assets/images/comptoir-commandes.webp";
import facade from "@/assets/images/facade.webp";
import facade4x5 from "@/assets/images/facade-4x5.webp";
import heroFondFlou from "@/assets/images/hero-fond-flou.webp";
import heroMobileAssietteMixte from "@/assets/images/hero-mobile-assiette-mixte.webp";
import lahmacun from "@/assets/images/lahmacun.webp";
import salle from "@/assets/images/salle.webp";
import salleLarge from "@/assets/images/salle-large.webp";
import vitrineBroche from "@/assets/images/hero-desktop-vitrine-broche.webp";
import vitrineCuisine from "@/assets/images/vitrine-cuisine.webp";
import { productPhotos } from "./product-photos";

/**
 * Registre des photos. Les fichiers reçus ont transité par une retouche IA
 * (nommés « Image ChatGPT ») : à remplacer par les originaux HD du restaurateur
 * en gardant les mêmes clés, sans toucher aux composants.
 */
export interface SiteImage {
  src: StaticImageData;
  alt: string;
}

export const images = {
  "assiette-mixte": { src: assietteMixte, alt: "Assiette de grillades : kebab, poulet, kefta, oignon grillé, crudités et frites" },
  "assiette-mixte-carre": { src: assietteMixteCarre, alt: "Assiette de grillades garnie de kebab, poulet et kefta" },
  "assiette-poulet": { src: assiettePoulet, alt: "Assiette poulet : morceaux de poulet grillé, boulgour, frites et crudités" },
  "assiette-poulet-carre": { src: assiettePouletCarre, alt: "Poulet grillé, boulgour, frites et crudités vus de dessus" },
  "assiette-entrecote": { src: assietteEntrecote, alt: "Assiette entrecôte grillée avec boulgour, frites et crudités" },
  "assiette-entrecote-carre": { src: assietteEntrecoteCarre, alt: "Entrecôte grillée et frites vues de dessus" },
  "berliner-kebab": { src: berlinerKebab, alt: "Berliner kebab : pain garni de viande, chou rouge, carotte, feta et sauce, avec frites" },
  "berliner-kebab-carre": { src: berlinerKebabCarre, alt: "Berliner kebab garni et barquette de frites" },
  "lahmacun": { src: lahmacun, alt: "Lahmacun, fine galette garnie de viande hachée épicée" },
  "salle": { src: salle, alt: "Salle de La Perle Bleue : banquettes bleues, tables en bois et comptoir en pierre" },
  "salle-large": { src: salleLarge, alt: "Salle du restaurant La Perle Bleue" },
  "comptoir-commandes": { src: comptoirCommandes, alt: "Commandes à emporter prêtes sur le comptoir, sous le logo La Perle Bleue" },
  "vitrine-cuisine": { src: vitrineCuisine, alt: "Vitrine de crudités et de viandes, broche de kebab et cuisine ouverte" },
  "vitrine-broche": { src: vitrineBroche, alt: "Vitrine de crudités, viandes marinées et broche de kebab derrière le comptoir" },
  "facade": { src: facade, alt: "Façade de La Perle Bleue, restaurant grillade, avec son enseigne bleue" },
  "facade-4x5": { src: facade4x5, alt: "Façade et vitrines de La Perle Bleue" },
  "hero-assiettes": { src: heroMobileAssietteMixte, alt: "Assiettes de grillades alignées sur le comptoir" },
  "hero-fond": { src: heroFondFlou, alt: "" },
  // Plats sans vraie photo : illustrations générées (voir product-photos.ts).
  ...productPhotos,
} satisfies Record<string, SiteImage>;

export type ImageKey = keyof typeof images;

/** Aperçu de l'accueil : grille asymétrique de 5 photos (la première est la plus grande). */
export const galleryPreviewKeys: ImageKey[] = [
  "salle",
  "assiette-entrecote",
  "lahmacun",
  "assiette-poulet",
  "comptoir-commandes",
];

/** Ordre de la galerie. */
export const galleryKeys: ImageKey[] = [
  "vitrine-cuisine",
  "assiette-mixte",
  "salle",
  "berliner-kebab",
  "assiette-entrecote",
  "facade",
  "assiette-poulet",
  "comptoir-commandes",
  "lahmacun",
];
