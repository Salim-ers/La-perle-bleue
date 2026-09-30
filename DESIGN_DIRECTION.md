# La Perle Bleue — Direction artistique

## Ce que dit l'identité existante

- **Logo** : écriture script « la Perle bleue », encadrée de deux perles nazar (l'œil bleu turc) suspendues à une chaînette.
- **Enseigne** : bandeau bleu roi, lettrage blanc, mention « Restaurant Grillade ».
- **Façade** : beige sable, store rayé bleu et crème.
- **Salle** : murs blancs, logo bleu au mur, banquettes en velours bleu, comptoir en pierre sable.
- **Carte** : fond bleu nuit, titres condensés très gras, prix inscrits dans des pastilles rondes cerclées de bleu, prix écrits « 8€50 ».

Conclusion : une marque bleue, ronde (la perle, l'œil, les assiettes) et chaleureuse (sable, grill).
Le site prolonge ces trois éléments et n'ajoute aucune couleur étrangère.

## Palette

| Token | Hex | Rôle | Origine |
|---|---|---|---|
| `--brand-primary` | #0140B8 | bleu roi : liens, anneaux, focus | enseigne |
| `--brand-secondary` | #053B8C | bleu profond : titres sur fond clair | lettrage du logo |
| `--brand-accent` | #DFC7A5 | sable : bouton principal, prix, détails | façade, comptoir |
| `--nazar` | #8CC8F2 | bleu clair : anneau de la perle, statut ouvert | iris du nazar |
| `--background` | #06132E | bleu nuit : fond principal | fond de la carte |
| `--surface` | #0B1F45 | nuit claire : blocs sur fond sombre | dérivé |
| `--paper` / `--mist` | #FFFFFF / #EEF3FA | sections claires | murs blancs de la salle |
| `--text-primary` | #F4F7FC (sombre) · #06132E (clair) | texte | — |
| `--text-secondary` | #A9B8D3 (sombre) · #4A5B7A (clair) | texte secondaire | — |
| `--border` | rgba(140,200,242,.16) · #D6E0EE | séparateurs | — |

Pas de noir neutre : le fond sombre est le bleu nuit de la carte. Pas de dégradé décoratif.
Les seuls voiles dégradés servent à la lisibilité du texte posé sur les photos.

## Typographies (2 familles, auto-hébergées)

- **Big Shoulders Display** (700–900) pour les titres. Elle est condensée et très grasse, dans l'esprit des titres de la carte. Les titres sont en casse normale, jamais en capitales espacées.
- **Figtree** (400–700) pour le texte courant, les boutons et les prix de liste.
- **Échelle** : 14 / 16 / 18 / 22 / 30 / 44 / 64 / 96 px (pour la variante clamp). Interlignage de 1,6 pour le corps et de 0,92 pour les titres display.

## Motif signature : la perle

Un seul élément fort : **la perle nazar**, faite d'anneaux concentriques sable, bleu clair et blanc autour d'une photo ronde de plat vue de dessus.
- **Hero** : grande perle avec une assiette vue de dessus, qui se dévoile en cercle au chargement. C'est l'unique animation orchestrée du site.
- **Prix** : pastille ronde blanche cerclée de bleu, écrite « 8€50 », comme sur la carte du restaurant.
- **Menu** : miniatures rondes pour les produits qui ont une photo.
- **CTA final, OG image, favicon** : même motif.

Le reste du site reste sobre, pour que la perle et les photos portent la marque.

## Mise en page

```
HERO (nuit)             SIGNATURE (blanc)        INCONTOURNABLES (nuit)
┌──────────┬─────────┐  ┌─────────────┬──────┐  ┌────┬────┬────┬────┐
│ statut   │  ◎ ◎ ◎  │  │   PHOTO     │ titre│  │ 4:5│    │ 4:5│    │
│ Titre XXL│ ◎ plat ◎│  │   salle 55% │ texte│  │    │ 4:5│    │ 4:5│  (décalage vertical)
│ CTA  CTA │  ◎ ◎ ◎  │  │      [mini] │      │  └────┴────┴────┴────┘
└──────────┴─────────┘  └─────────────┴──────┘
Mobile : perle en haut, texte dessous ; photo puis texte ; carrousel horizontal.
```
Alignement à gauche partout. Seuls le CTA final et la perle sont centrés.
Largeur max 1240 px, gouttières de 20 px sur mobile et 40 px sur desktop. Sections de 96 à 144 px en vertical sur desktop, 72 px sur mobile.

## Rayons et reliefs

- **Photos** : 4 px, presque droites, pour un rendu éditorial.
- **Boutons** : pilule, en écho à la perle.
- **Perle et miniatures** : 50 %.

Aucune ombre grise générique. Les ombres sont teintées nuit, et seulement sous les éléments flottants (barre mobile, modale).

## Animation

- **Hero** : dévoilement circulaire de la photo, anneaux qui se posent, texte en fondu. Durée 0,9 s.
- **Grand visuel** : parallaxe de ±6 %.
- **Signature** : dévoilement de la photo à l'entrée dans l'écran.
- **Interactions** : zoom photo de 1,04 maximum, léger déplacement des boutons, soulignement animé des liens.
- **Modales et lightbox** : fondu et glissement, balayage sur mobile.
- `prefers-reduced-motion` est respecté partout (MotionConfig `reducedMotion="user"`).

## Style photographique

- Plats vus de dessus sur ardoise pour les ronds (perle, miniatures).
- Vues de comptoir en perspective pour le plein écran.
- Recadrages 4:5 pour les cartes produits, 16:9 pour les grands visuels.
- Jamais de photo étirée : tout est en `object-fit: cover` via next/image, et les sources basse résolution restent contenues.

## Données

- Contenu dans `src/data` : restaurant, menu, images, avis.
- Accès via `src/lib/data.ts`, en fonctions asynchrones, pour pouvoir remplacer par une base de données.
- Les valeurs `TODO_CONTENT` sont détectées : l'interface masque ou signale l'information au lieu d'en inventer une.
