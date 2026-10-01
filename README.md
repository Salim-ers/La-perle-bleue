# La Perle Bleue — site et commande à emporter

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide, Zustand (panier).
Les pages vitrines sont générées en statique ; seules `/api/*` et `/commande/succes` sont dynamiques.

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
- [ ] Validation des points `toConfirm` et `MENU_TODO` dans `src/data/menu.ts`
- [ ] Validation des options de commande marquées `toConfirm` dans `src/data/options.ts` : liste des sauces et nombre offert, pain / galette, prix des suppléments (viande supplémentaire : 2€00 proposé), prix des formules menu
- [ ] Conditions générales de vente (obligatoires avant d'ouvrir le paiement en ligne)
- [ ] Mentions légales : forme juridique, SIRET, directeur de publication
- [ ] Réseaux sociaux (Instagram, Facebook, TikTok) s'ils existent
- [ ] Vrais avis Google et note globale, si le restaurateur le souhaite

## Commande en ligne (V1 : Commander → Payer → Emporter)

Parcours : bouton « + » / « Ajouter » → configurateur → panier → `/commande` → paiement (préparé).
Retrait sur place uniquement ; la livraison est prévue dans les types (`DELIVERY`) mais refusée par l'API.

| Rôle | Fichier |
|---|---|
| Types (Product, OptionGroup, Order, OrderItem, Customer, OrderStatus…) | `src/features/order/types.ts` |
| Catalogue commandable, construit depuis la carte + les options | `src/features/order/catalog.ts` |
| **Seule** fonction de prix : `calculateItemPrice()` | `src/features/order/pricing.ts` |
| Validation partagée navigateur / serveur | `src/features/order/validation.ts` |
| Créneaux de retrait (heure de Paris) | `src/features/order/pickup.ts` |
| Recalcul serveur d'une commande | `src/features/order/checkout.ts` |
| Panier Zustand persistant (`addItem`, `removeItem`, `updateQuantity`, `clearCart`, `cartCount`, `subtotal`) | `src/features/cart/store.ts` |
| Configurateur, tiroir panier, notification | `src/features/cart/ui.ts`, `src/components/order`, `src/components/cart` |
| API de paiement | `src/app/api/checkout/route.ts` |
| Webhook Stripe (à implémenter) | `src/app/api/webhooks/stripe/route.ts` |
| Schéma base de données (brouillon) | `supabase/schema.sql` |

Règles de sécurité :
- le panier ne stocke que des identifiants et des quantités ; les prix sont toujours recalculés ;
- `/api/checkout` n'accepte que des identifiants, relit le catalogue, vérifie disponibilités, options et créneau, puis recalcule le total : le navigateur ne décide jamais du montant ;
- seule la confirmation du webhook Stripe pourra passer une commande en `PAID` ; la page `/commande/succes` relit le statut côté serveur et n'affiche jamais une commande payée sans cette preuve.

Tant que `STRIPE_SECRET_KEY` n'est pas définie, le bouton « Payer » valide tout le parcours puis affiche « paiement en ligne bientôt disponible » : rien n'est enregistré ni débité.

### Phase 2

1. `npm install stripe @supabase/supabase-js`, créer les tables (`supabase/schema.sql`) et y importer la carte.
2. Remplacer la construction du catalogue par une lecture Supabase (garder `getProduct()`).
3. Implémenter les TODO de `/api/checkout` (commande `PENDING_PAYMENT` + Checkout Session) et du webhook (`PAID`).
4. `/admin` : commandes en temps réel, ruptures (`available`), horaires, temps de préparation (`settings`).
5. `/suivi/[orderId]` : suivi de commande.

## Qualité mesurée (Lighthouse mobile, serveur local)

- Accessibilité 100, bonnes pratiques 100, SEO 100 : mesures fiables.
- Performance : 46 à 56 sur l'accueil et 80 sur une page de texte, mesurés en local. Ces chiffres ne sont pas représentatifs : dans cet environnement, les images étaient encodées à la volée pendant l'audit et le CPU était bridé. Refaire la mesure sur l'URL Vercel avec PageSpeed Insights (pagespeed.web.dev).
- Leviers si le score reste sous 90 en production :
  1. Remplacer `BigVisual` (parallaxe) par une image fixe.
  2. Retirer l'animation d'entrée de la section signature.
  3. Réduire le nombre de photos de l'aperçu galerie.
