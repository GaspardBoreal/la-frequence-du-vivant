# Configurateur Jardin nourricier — VDTP

Objectif : une page web que vous ouvrez pendant la réunion, où les équipes VDTP cochent oui/non les briques de La Fréquence du Vivant qu'elles veulent dans Jardin nourricier, et voient le prix se recalculer en direct. Tout est cochable = 50 k€, rien = 0 €, une seule brique ≈ 15 k€.

## Lecture de la négociation (ce que le configurateur doit servir)

Le document pose le scénario 3 comme recommandation : VDTP propriétaire, reprise du socle existant, avec deux dimensions — 36 k€ de prestation et 50 k€ de valorisation du socle (2/3 à la commande, 1/3 conditionné à la réussite). Aujourd'hui les 50 k€ sont un bloc à prendre ou à laisser : c'est le point de friction. Le configurateur transforme ce bloc en un catalogue de briques, chacune valorisée. Vous ne défendez plus un prix, vous défendez une liste. Et si VDTP retire des briques, ce n'est plus une remise : c'est un périmètre plus petit, avec la licence B2B correspondante qui vous reste.

Votre objectif de 25 k€ est atteint autour de 29 % de la valeur du catalogue — soit environ un tiers des briques, cœur jardin. Le configurateur affiche trois paniers préparés d'avance : **Socle minimum ≈ 15 k€**, **Recommandé ≈ 25 k€** (celui que vous proposez), **Intégral 50 k€**.

## Les trois grilles

Le même patrimoine, lu de trois façons. Chaque grille couvre l'intégralité du projet : basculer de grille ne change pas le prix, seulement le point de vue. C'est décisif en réunion : si VDTP n'adhère pas à une lecture, vous en proposez une autre sans rien renégocier.

**Grille 1 — Par brique technique (« l'Usine Tech »).** Le regard du développeur et du DSI. Socle applicatif et hébergement, base de données et modèle de propriété, Assistant du Jardin et bases de connaissances, back-office interne, CRM, marketing automation, moteur de recherche, exports et impression, console de suivi des API, application mobile.

**Grille 2 — Par valeur d'usage jardinier (« le parcours »).** Le regard du responsable produit et du marketing. Inscription et portrait du jardin, étude de sol, palette végétale, atelier du jardin, tour de jardin, clinique du jardin, capteurs et sondes, carnet de terrain et partage, Académie Jardin, communauté et parrainage.

**Grille 3 — Par actif de données et de connaissance (« le patrimoine »).** Le regard du dirigeant et du juriste — celui qui dit ce que VDTP achète vraiment. Référentiel d'espèces et noms français, base d'observations et biodiversité, corpus sol et plantes indicatrices, connaissance de jardin validée par entretien, mesures capteurs, bibliothèque de contenus pédagogiques, briques d'analyse et de scoring, catalogue des pages publiques et actifs SEO/GEO.

Chaque option porte : intitulé, ce que c'est en une phrase, ce que VDTP obtient concrètement, preuve (écran ou page déjà en production), poids en valeur, et statut « déjà en production / à adapter ». Deux ou trois options sont marquées **socle indispensable** : les décocher désactive les briques qui en dépendent, avec un message clair.

## Le calcul du prix

Chaque option porte un poids. Le prix affiché suit :

```text
sélection vide          →  0 €
sélection non vide      →  15 000 € + 35 000 € × (somme des poids cochés / somme de tous les poids)
```

Toutes les options cochées donnent exactement 50 000 €. Une seule option cochée donne un peu plus de 15 000 € — le seuil plancher que vous avez fixé. Le prix est arrondi à la centaine d'euros. La règle est affichée à l'écran, en clair : c'est un argument, pas une boîte noire.

À côté du prix, trois lectures permanentes : **part payée à la commande (2/3)**, **part conditionnée à la réussite (1/3)**, et **prestation de développement 36 j / 36 k€** rappelée séparément — pour que personne ne confonde valorisation du socle et jours de développement.

## Ce que voit l'écran

- En-tête : le prix en grand, animé quand il change, avec la barre de couverture du catalogue.
- Trois onglets de grille, et un compteur d'options retenues par grille.
- Les cartes d'options : titre, phrase, preuve, poids, bascule oui/non. Mobile first, une carte par ligne sur téléphone.
- Les trois paniers préparés (Socle / Recommandé 25 k€ / Intégral), applicables en un geste.
- Un bandeau bas collant sur mobile : prix, nombre d'options, bouton « Récapitulatif ».
- Un récapitulatif imprimable A4 : liste des options retenues, prix, échéancier, périmètre de licence B2B restant à bziiit.
- Un bouton « Copier le lien » : la sélection est encodée dans l'URL, VDTP peut la renvoyer par email et vous la rouvrez à l'identique.

## Détails techniques

- `src/content/vdtp/configurateur.ts` : catalogue unique — `ConfigOption` (`id`, `label`, `pitch`, `gain`, `proof`, `weight`, `state`, `requires?`) et trois index de grilles renvoyant vers les mêmes ids. Constantes `PRICE_FLOOR = 15000`, `PRICE_MAX = 50000`, et les trois paniers (`socle`, `recommande`, `integral`).
- `src/lib/vdtp/pricing.ts` : `computePrice(selectedIds)` selon la formule ci-dessus, `encodeSelection` / `decodeSelection` (base64url des ids) pour l'URL et l'impression. Fonction pure, testable.
- `src/pages/VdtpConfigurateur.tsx` : page publique, route `/partenaires/vdtp/configurateur` dans `src/App.tsx` (lazy), protégée par le même mot de passe que la feuille de route VDTP, `noindex`.
- Composants dans `src/components/partners/vdtp/` : `PriceHeader`, `GrilleTabs`, `OptionCard`, `PresetBar`, `RecapSheet`, `ConfigPrintLayout` (réutilise le moteur d'impression des feuilles de route).
- État en mémoire + synchronisation `searchParams` ; aucune migration Supabase (la sélection vit dans l'URL). Un enregistrement en base pourra être ajouté ensuite si vous voulez historiser les sélections VDTP.
- Palette crème/forêt du site, tokens sémantiques uniquement, vocabulaire « Assistant » jamais « IA », `Footer variant="marches"`.
