# La Perle Bleue — site vitrine

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide.
Toutes les pages sont générées en statique.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

## Déployer sur Vercel

1. Pousser le dossier sur GitHub, puis « Import Project » sur vercel.com (aucune configuration requise).
2. Optionnel : définir `NEXT_PUBLIC_SITE_URL` avec le nom de domaine final (voir `.env.example`). Sans cette variable, l'URL de production Vercel est utilisée pour le SEO.

## Où modifier le contenu

| Quoi | Fichier |
|---|---|
| Adresse, téléphone, horaires, réseaux, liens Google | `src/data/restaurant.ts` |
| Carte, prix, catégories | `src/data/menu.ts` |
| Photos et textes alternatifs | `src/data/images.ts` et `src/assets/images/` |
| Avis Google (uniquement de vrais avis) | `src/data/reviews.ts` |
| Logo | `src/assets/brand/logo-blanc.png`, `logo-bleu.png` |
| Favicon, image de partage | `src/app/icon.png`, `apple-icon.png`, `opengraph-image.jpg` |

Toute valeur `TODO_CONTENT` est détectée : l'information est masquée ou affichée comme « à compléter ». Dès qu'elle est renseignée, tout se met à jour sans toucher au code :
- les boutons Appeler et Itinéraire ;
- la barre mobile ;
- la carte Google ;
- le JSON-LD ;
- le titre SEO avec la ville ;
- la section Avis.

## Reste à fournir (restaurateur)

- [ ] Adresse complète, téléphone, e-mail, lien de la fiche Google Maps et des avis
- [ ] Horaires du dimanche (actuellement : fermé, déduit de la carte)
- [ ] Logo vectoriel (l'actuel est détouré depuis une photo du mur)
- [ ] Photos originales haute définition (≥ 2400 px)
- [ ] Validation des points `toConfirm` et `MENU_TODO` dans `src/data/menu.ts`
- [ ] Mentions légales : forme juridique, SIRET, directeur de publication
- [ ] Réseaux sociaux (Instagram, Facebook, TikTok) s'ils existent
- [ ] Vrais avis Google et note globale, si le restaurateur le souhaite

## Architecture prête pour la commande en ligne

- Prix stockés en centimes.
- Identifiants produits stables et champ `available` pour les ruptures.
- Accès aux données centralisé dans `src/lib/data.ts` (fonctions asynchrones), pour brancher une base de données ou un back-office sans modifier les pages.
- Pour la phase 2, ajouter des dossiers dédiés sans toucher à l'existant : `src/features/cart`, `src/app/commande`, `src/app/api`.

## Qualité mesurée (Lighthouse mobile, serveur local)

- Accessibilité 100, bonnes pratiques 100, SEO 100 : mesures fiables.
- Performance : 46 à 56 sur l'accueil et 80 sur une page de texte, mesurés en local. Ces chiffres ne sont pas représentatifs : dans cet environnement, les images étaient encodées à la volée pendant l'audit et le CPU était bridé. Refaire la mesure sur l'URL Vercel avec PageSpeed Insights (pagespeed.web.dev).
- Leviers si le score reste sous 90 en production :
  1. Remplacer `BigVisual` (parallaxe) par une image fixe.
  2. Retirer l'animation d'entrée de la section signature.
  3. Réduire le nombre de photos de l'aperçu galerie.
