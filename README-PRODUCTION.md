# La Perle Bleue — mise en production de la commande en ligne

Ce guide s'adresse à la personne qui installe le site (développeur). Le mode d'emploi du restaurant est dans [GUIDE-RESTAURANT.md](GUIDE-RESTAURANT.md).

**Principe :** Commander → Payer (carte **autorisée**) → la cuisine **accepte** (débit réel) → préparation → prête → récupérée.

Services utilisés, tous au nom du restaurant :

| Service | Rôle | Variables |
|---|---|---|
| Vercel | hébergement du site et des API | — |
| Neon | base PostgreSQL (commandes, réglages, ruptures) | `DATABASE_URL` |
| Mollie | paiement par carte (autorisation puis capture) | `MOLLIE_API_KEY` |
| Resend | e-mails aux clients | `RESEND_API_KEY`, `RESEND_FROM` |

Aucun autre service : pas de Redis, pas de WebSocket, pas d'application native. L'écran cuisine interroge le serveur toutes les 3 secondes.

---

## 1. Créer la base Neon

1. Créer un compte sur [neon.tech](https://neon.tech) avec l'adresse du restaurant, puis un projet `la-perle-bleue`, région **Europe (Francfort)**.
2. Garder la branche `main` pour la **production** et créer une branche `preview` pour les tests.
3. Pour chaque branche, copier la chaîne de connexion **« Pooled connection »** (hôte contenant `-pooler`) : c'est `DATABASE_URL`.

## 2. Créer les tables (migration)

Les tables sont décrites dans `src/server/db/schema.ts` ; le SQL généré est dans `drizzle/0000_init.sql`.

```bash
# depuis le projet, une fois par branche Neon (preview puis production)
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require" npm run db:migrate
```

Solution de secours : coller le contenu de `drizzle/0000_init.sql` dans l'éditeur SQL de Neon. Dans ce cas, les migrations suivantes devront aussi être appliquées à la main.

Le restaurant et ses réglages (horaires, délai de préparation) sont créés automatiquement au premier appel : rien d'autre à insérer.

Tables : `restaurants`, `restaurant_settings`, `product_availability`, `customers`, `orders`, `order_items`, `order_item_options`, `payments`, `order_status_history`, `email_log`, `event_logs`, `rate_limits`.

Après une modification du schéma : `npm run db:generate` (nouveau fichier SQL dans `drizzle/`), commit, puis `npm run db:migrate` sur chaque branche.

> Coût : l'écran cuisine interroge la base toutes les 3 s tant qu'il est ouvert. La base reste donc active pendant le service. Vérifier que le quota d'heures de calcul de l'offre Neon choisie couvre les horaires d'ouverture ; sinon, passer à l'offre payante d'entrée de gamme.

## 3. Créer le compte Mollie (au nom du restaurant)

1. Le restaurateur crée son compte sur [mollie.com](https://www.mollie.com) et termine la vérification : Kbis / SIRET, pièce d'identité du gérant, IBAN, URL du site.
2. Dans **Paiements → Méthodes**, activer **Cartes**.
3. Dans **Développeurs → Clés API**, récupérer la clé `test_…` (preview) puis, une fois le compte validé, la clé `live_…` (production).
4. **Webhook :** rien à configurer dans Mollie. Le site envoie l'adresse `https://<domaine>/api/webhooks/mollie` avec chaque paiement ; le domaine doit simplement être public.

Fonctionnement : le paiement est créé avec `captureMode: "manual"`. Après la saisie de la carte, il passe à **autorisé** et la commande apparaît en cuisine. **ACCEPTER** déclenche la capture (débit réel) ; **REFUSER** annule l'autorisation (aucun débit). Une autorisation non capturée finit par expirer d'elle-même (date `captureBefore` visible dans Mollie).

Seules les méthodes compatibles avec la capture manuelle doivent être proposées : `MOLLIE_METHODS=creditcard` (valeur par défaut). Avant d'en ajouter une autre (Apple Pay…), vérifier dans la documentation Mollie qu'elle accepte la capture manuelle.

Garde-fous intégrés :
- une clé `live_` est refusée hors production (aucun vrai débit depuis une preview) ;
- une clé `test_` est refusée en production, sauf répétition générale avec `ALLOW_TEST_PAYMENTS_IN_PRODUCTION=true` (à retirer avant l'ouverture).

## 4. Créer le compte Resend (e-mails)

1. Compte sur [resend.com](https://resend.com) au nom du restaurant.
2. **Domains → Add domain** : `laperlebleue.fr` (ou le domaine final). Ajouter chez le registraire du domaine les enregistrements DNS indiqués (SPF, DKIM) et attendre le statut « Verified ».
3. **API Keys** : créer une clé avec le droit « Sending access ».
4. `RESEND_FROM` doit utiliser le domaine vérifié, par exemple `La Perle Bleue <commandes@laperlebleue.fr>`.

E-mails envoyés : commande reçue, acceptée, prête, annulée. Chacun part au plus une fois par commande (table `email_log`). Si Resend est absent ou en panne, la commande continue normalement et l'incident est journalisé.

## 5. Variables d'environnement Vercel

Dans **Vercel → Project → Settings → Environment Variables** (jamais dans GitHub) :

| Variable | Production | Preview | Remarque |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://laperlebleue.fr` | — | domaine final, sans slash |
| `DATABASE_URL` | branche `main` | branche `preview` | chaîne « pooled » |
| `MOLLIE_API_KEY` | `live_…` | `test_…` | |
| `RESEND_API_KEY` | ✔ | ✔ (facultatif) | |
| `RESEND_FROM` | ✔ | ✔ (facultatif) | domaine vérifié |
| `ADMIN_PASSWORD` | ✔ | ✔ | 12 caractères minimum, différent par environnement |
| `ADMIN_SESSION_SECRET` | ✔ | ✔ | `openssl rand -base64 48` |
| `MOLLIE_METHODS` | facultatif | facultatif | défaut `creditcard` |
| `RESEND_REPLY_TO` | facultatif | facultatif | adresse de réponse |

**Important :** `NEXT_PUBLIC_SITE_URL` est intégrée au moment du build. Après l'avoir modifiée, il faut **redéployer**.

**Previews protégées :** si la protection Vercel est active sur les déploiements de preview, Mollie ne peut pas joindre le webhook. Activer **Settings → Deployment Protection → Protection Bypass for Automation** : le site ajoute automatiquement le jeton (`VERCEL_AUTOMATION_BYPASS_SECRET`) à l'URL du webhook.

Tant que `DATABASE_URL` ou la clé Mollie manquent, le site reste consultable et les boutons affichent « Commande en ligne bientôt disponible ». C'est l'état actuel du site en ligne.

## 6. Domaine

1. Acheter ou rattacher `laperlebleue.fr`, puis **Vercel → Domains → Add**, et suivre les instructions DNS.
2. Renseigner `NEXT_PUBLIC_SITE_URL=https://laperlebleue.fr` et redéployer.
3. Les e-mails, le retour de paiement et le webhook utilisent ce domaine. Aucune adresse `*.vercel.app` n'est écrite en dur.

## 7. Installer la tablette cuisine (PWA)

1. Tablette Android avec Chrome (ou iPad avec Safari), branchée sur secteur, Wi-Fi du restaurant.
2. Ouvrir `https://laperlebleue.fr/admin/cuisine` et se connecter avec le mot de passe du restaurant.
3. Installer l'application :
   - Android / Chrome : menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil ») ;
   - iPad / Safari : bouton Partager → **Sur l'écran d'accueil**.
4. Ouvrir « Cuisine » depuis l'écran d'accueil : l'application s'ouvre sans barre d'adresse.
5. Toucher **Démarrer le service** : cela active la sonnerie et garde l'écran allumé.
6. Réglages de la tablette : volume au maximum, mode silencieux désactivé, mise en veille automatique désactivée ou longue (sécurité en plus du maintien d'écran), mises à jour automatiques hors service.

La session dure 30 jours. Changer `ADMIN_SESSION_SECRET` déconnecte toutes les tablettes.

## 8. Passer de Mollie test à Mollie live

1. Compte Mollie validé (statut « actif ») et méthode Cartes activée.
2. Faire la répétition générale (section 9) sur la preview, puis éventuellement en production avec la clé test et `ALLOW_TEST_PAYMENTS_IN_PRODUCTION=true`.
3. En production : remplacer `MOLLIE_API_KEY` par la clé `live_…`, **supprimer** `ALLOW_TEST_PAYMENTS_IN_PRODUCTION`, puis redéployer.
4. Passer une vraie commande de faible montant (un thé), l'accepter en cuisine et vérifier le débit dans Mollie. Passer-en une seconde, la refuser et vérifier qu'aucun débit n'a eu lieu.

## 9. Procédure de test

Automatique :

```bash
npm run test:logic
```

Manuel, sur la preview avec la clé Mollie `test_` (la page de test Mollie permet de choisir le résultat) :

| Domaine | Scénarios |
|---|---|
| Configurateur | kebab seul ; menu (boisson obligatoire) ; sans oignons ; supplément ; burger menu ; assiette ; tacos 2 viandes ; deux produits identiques avec options différentes = deux lignes ; bouton MODIFIER |
| Mollie | paiement autorisé ; carte refusée ; paiement abandonné ; acceptation = capture ; refus = annulation ; webhook reçu deux fois (aucun doublon) ; rafraîchir la page pendant le paiement |
| Cuisine | nouvelle commande + sonnerie ; Mute ; accepter ; refuser (motif) ; préparation ; prête ; terminée ; couper le Wi-Fi puis le rétablir ; recharger ; fermer et rouvrir l'application |
| Réglages | pause des commandes (le site affiche « Commandes temporairement suspendues ») ; délai de préparation ; rupture d'un produit et d'une option ; créneau complet |
| Client | e-mails reçus ; page de suivi qui avance seule ; mobile 375 / 390 / 430 px |

Test local complet sans compte : voir la section « Tests » du [README](README.md) (base embarquée + paiement fictif).

## 10. Dépannage

| Symptôme | Vérifier |
|---|---|
| « Commande en ligne bientôt disponible » partout | `DATABASE_URL` et `MOLLIE_API_KEY` présents dans le bon environnement ; clé `test_` en production refusée ; redéployer |
| Commande payée absente en cuisine | Logs Vercel (`webhook.error`) et table `event_logs`. L'écran cuisine relit aussi les paiements en attente chaque minute, et la page de suivi du client relit Mollie |
| « Le paiement n'a pas pu être encaissé » à l'acceptation | Autorisation expirée ou refusée par la banque : voir le paiement dans Mollie, puis refuser la commande |
| E-mails non reçus | Domaine vérifié dans Resend, `RESEND_FROM` sur ce domaine, dossier spam ; logs `email.failed` |
| Pas de sonnerie | Toucher « Démarrer le service », volume, mode silencieux de la tablette |
| « Connexion perdue » | Wi-Fi de la tablette ; l'écran se reconnecte seul, et les commandes ne sont jamais perdues (elles sont en base) |
| Impossible de se connecter à l'admin | `ADMIN_PASSWORD` (10 caractères minimum) et `ADMIN_SESSION_SECRET` (32 minimum) ; 5 essais par quart d'heure |

Journal : la table `event_logs` (et les logs Vercel) trace les autorisations, captures, échecs, refus, annulations, e-mails et erreurs de webhook.

---

## Informations à demander au restaurateur

- [ ] Adresse complète, téléphone, e-mail, lien Google Maps (`src/data/restaurant.ts`)
- [ ] Horaires exacts, dimanche compris
- [ ] Liste des sauces proposées et nombre de sauces incluses ; prix d'une sauce en plus
- [ ] Choix pain / galette : pour quels sandwichs ?
- [ ] Crudités proposées (salade, tomates, oignons…) par produit
- [ ] Boissons des menus : parfums réels des canettes
- [ ] Prix des formules menu (sandwich + boisson, burger + frites + boisson, Berliner)
- [ ] Prix des suppléments (cheddar, viande supplémentaire, œuf…)
- [ ] Tacos : peut-on prendre deux fois la même viande ?
- [ ] Points `toConfirm` et `MENU_TODO` de `src/data/menu.ts` (prix du Cheese Burger, nom exact du Berliner…)
- [ ] **Allergènes** de chaque plat, sauce et boisson (`src/data/allergens.ts`)
- [ ] Accord sur les photos générées par IA, ou vraies photos
- [ ] Mentions légales et CGV : forme juridique, SIRET, directeur de publication, médiateur de la consommation, délai de conservation d'une commande non retirée
- [ ] Durées de conservation des données (politique de confidentialité)
- [ ] Compte Mollie validé, compte Resend, domaine, tablette

## Checklist de mise en production

- [ ] Menu validé
- [ ] Prix validés
- [ ] Sauces, boissons, crudités et suppléments validés
- [ ] Formules menu validées
- [ ] Allergènes validés et saisis
- [ ] Mentions légales, CGV et confidentialité complétées
- [ ] Neon production créé, migration appliquée
- [ ] Neon preview créé, migration appliquée
- [ ] Compte Mollie validé, méthode Cartes active
- [ ] Clés Mollie : `test_` en preview, `live_` en production
- [ ] Webhook joignable (domaine public ; bypass Vercel si previews protégées)
- [ ] Domaine final branché, `NEXT_PUBLIC_SITE_URL` renseignée, redéploiement fait
- [ ] Domaine vérifié dans Resend, e-mails reçus (4 types)
- [ ] `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` forts, différents par environnement
- [ ] Tablette installée (PWA), branchée, volume réglé
- [ ] Sonnerie testée
- [ ] 20 commandes de test passées
- [ ] Paiement test autorisé, capture test, refus test, carte refusée test
- [ ] Pause des commandes et rupture testées
- [ ] `ALLOW_TEST_PAYMENTS_IN_PRODUCTION` supprimée
- [ ] Première vraie commande acceptée et vérifiée dans Mollie
