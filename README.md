# La Perle Bleue — site et commande à emporter

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide, Zustand (panier),
Neon PostgreSQL + Drizzle ORM, Mollie (paiement), Resend (e-mails). Hébergement Vercel.
Les pages vitrines sont générées en statique ; la commande, le suivi, l'admin et les API sont dynamiques.

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
| Options de commande (sauces, crudités, pain, suppléments, formules, tacos) | `src/data/options.ts` |
| Temps de préparation, créneaux, durée de vie du panier | `src/data/ordering.ts` |
| Produits mis en avant (« Les favoris ») et leurs badges | `src/lib/data.ts` (`featured`) |
| Photos et textes alternatifs | `src/data/images.ts` et `src/assets/images/` |
| Photos des plats générées par IA (en attendant de vraies photos) | `src/data/product-photos.ts`, `src/assets/images/produits/`, scripts dans `scripts/photos/` |
| Avis Google (uniquement de vrais avis) | `src/data/reviews.ts` |
| Logo | `src/assets/brand/logo-blanc.png`, `logo-bleu.png` |
| Favicon, image de partage | `src/app/icon.png`, `apple-icon.png`, `opengraph-image.jpg` |

Toute valeur `TODO_CONTENT` est détectée : l'information (ligne, bouton, carte) est masquée, jamais affichée comme « à compléter ». Dès qu'elle est renseignée, tout se met à jour sans toucher au code :
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
- [ ] Vraies photos des plats : 29 plats sont illustrés par des images générées par IA (`src/assets/images/produits/`), à remplacer en gardant le même nom de fichier. La carte affiche « Photos non contractuelles ».
- [ ] Validation des points `toConfirm` et `MENU_TODO` dans `src/data/menu.ts`
- [ ] Validation des options de commande marquées `toConfirm` dans `src/data/options.ts` : liste des sauces et nombre offert, pain / galette, prix des suppléments (viande supplémentaire : 2€00 proposé), prix des formules menu
- [ ] Conditions générales de vente : compléter les « à compléter » de `/cgv` (SIRET, médiateur…)
- [ ] Allergènes de chaque plat (`src/data/allergens.ts`)
- [ ] Mentions légales : forme juridique, SIRET, directeur de publication
- [ ] Réseaux sociaux (Instagram, Facebook, TikTok) s'ils existent
- [ ] Vrais avis Google et note globale, si le restaurateur le souhaite

## Commande en ligne : Commander → Payer → Faire préparer → Récupérer

Mise en production pas à pas : **[README-PRODUCTION.md](README-PRODUCTION.md)**. Mode d'emploi du restaurant : **[GUIDE-RESTAURANT.md](GUIDE-RESTAURANT.md)**.

Parcours : configurateur → panier → `/commande` → page de paiement Mollie (carte **autorisée**) → commande en cuisine (`/admin/cuisine`) → **ACCEPTER** déclenche le débit réel → préparation → prête → récupérée. Le client suit sa commande sur `/suivi/[id]` et reçoit 4 e-mails (reçue, acceptée, prête, annulée).

| Rôle | Fichier |
|---|---|
| Types (Product, OptionGroup, ProductConfiguration, statuts…) | `src/features/order/types.ts` |
| Options configurables (sauces, crudités, pain, frites, formules, boissons, suppléments) | `src/data/options.ts` |
| Allergènes par produit (jamais inventés) | `src/data/allergens.ts` |
| **Seule** fonction de prix : `calculateConfiguredProductPrice()` | `src/features/order/pricing.ts` |
| Validation partagée / schémas Zod des API | `src/features/order/validation.ts`, `schemas.ts` |
| Panier persistant (Zustand) | `src/features/cart/store.ts` |
| Schéma de base (Drizzle) et migrations SQL | `src/server/db/schema.ts`, `drizzle/` |
| Création de commande + paiement | `src/server/checkout.ts`, `src/app/api/checkout/route.ts` |
| Cycle de vie, capture, refus, webhook | `src/server/orders.ts`, `src/app/api/webhooks/mollie/route.ts` |
| Mollie (autorisation + capture manuelle) | `src/server/payments/mollie.ts` |
| E-mails (Resend) | `src/server/email.ts` |
| Écran cuisine (PWA) et réglages | `src/app/admin/`, `src/components/admin/`, `public/admin/` |

Règles de sécurité : le navigateur n'envoie que des identifiants (jamais de prix) ; le serveur relit le catalogue, les ruptures et les créneaux puis recalcule le total ; seul le statut relu chez Mollie fait avancer une commande ; chaque transition est une mise à jour conditionnelle (webhook rejoué, double clic : aucun effet en double).

### Tests

```bash
npm run test:logic          # prix, menus, boissons, sauces, ruptures, créneaux (sans base)
```

Tester tout le parcours en local, sans compte Neon ni Mollie (base Postgres embarquée + paiement fictif) : dans `.env.local`

```bash
DATABASE_URL=pglite:./.data/pglite
PAYMENT_PROVIDER=mock
ADMIN_PASSWORD=un-mot-de-passe-local
ADMIN_SESSION_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum
```

puis `npm run build && npm start` : la page de paiement est remplacée par `/paiement-test/…` (autoriser / refuser / abandonner). Ces deux réglages sont refusés en production.

## Qualité mesurée (Lighthouse mobile, serveur local)

- Accessibilité 100, bonnes pratiques 100, SEO 100 : mesures fiables.
- Performance : 46 à 56 sur l'accueil et 80 sur une page de texte, mesurés en local. Ces chiffres ne sont pas représentatifs : dans cet environnement, les images étaient encodées à la volée pendant l'audit et le CPU était bridé. Refaire la mesure sur l'URL Vercel avec PageSpeed Insights (pagespeed.web.dev).
- Leviers si le score reste sous 90 en production :
  1. Remplacer `BigVisual` (parallaxe) par une image fixe.
  2. Retirer l'animation d'entrée de la section signature.
  3. Réduire le nombre de photos de l'aperçu galerie.

## Photos des plats générées (IA)

Les plats sans vraie photo sont illustrés par des images générées avec l'API OpenAI (`gpt-image-2`), en donnant les vraies photos du restaurant comme référence de style.

1. Mettre la clé dans `.env.local` : `OPENAI_API_KEY=...` (fichier ignoré par git).
2. Décrire le plat dans `scripts/photos/plats.json` (identifiant = id du produit dans `src/data/menu.ts`).
3. `node scripts/photos/generer.mjs scripts/photos/plats.json <id>` : image dans `photos-generees/` (à vérifier à l'œil : composition fidèle à la carte).
4. `node scripts/photos/integrer.mjs` : recadrage 4:5 et 1:1, WebP, registre `src/data/product-photos.ts`.
5. Ajouter `imageKey: "<id>-carre"` au produit dans `src/data/menu.ts`.

Coût indicatif : environ 0,20 $ par photo.

