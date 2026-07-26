## Objectif

Passer le Widget 6 « Étape 2 · Vie du sol » du même niveau de finition que les Widgets 3 (Structure), 4 (Texture) et 5 (Acidité) : pleine largeur, consigne pédagogique, tests nommés/schématisés/expliqués avec étagère vidéo, relevé par prélèvement, synthèse.

## Ce que verra l'utilisateur

```text
┌──────────────────────────────────────────────────────────────┐
│ 6 · ÉTAPE 2 · VIE DU SOL — « Ce que la terre laisse voir »    │
│ HERO : coupe de sol vivante (vers, galeries, radicelles,      │
│        micro-faune) — densité et couleur pilotées par le      │
│        score de vie moyen des prélèvements                    │
├──────────────────────────────────────────────────────────────┤
│ ① Consigne « Ce que vous devez faire » + fil 1→4              │
│   Observer → Compter → Cocher → Noter                        │
│ ① bis  Pourquoi c'est décisif  |  Nota bene                   │
├──────────────────────────────────────────────────────────────┤
│ ② Les protocoles (cartes côte à côte, schémas animés)         │
│   • Test bêche vivante (bloc 20×20×20, tri 5 min)            │
│   • Test du vinaigre / CO₂ (effervescence = calcaire)        │
│   • Test du slip / sachet de thé (dégradation) [optionnel]   │
│   ↳ Étagère « Ciné-terrain » (1 à 3 vidéos, prête à recevoir │
│     les liens que vous fournirez)                            │
├──────────────────────────────────────────────────────────────┤
│ ③ Relevé par prélèvement  (A → E, 3/5 renseignés)            │
│   [A] emplacement · test utilisé · indices cochés · nb vers  │
│       → pastille de vitalité (Faible/Moyenne/Forte)          │
├──────────────────────────────────────────────────────────────┤
│ ④ Synthèse : barres de distribution des indices, vitalité    │
│   dominante, indice de vie moyen, alerte « sol contrasté »   │
└──────────────────────────────────────────────────────────────┘
```

## Indices de vie retenus (cochables par prélèvement)

Vers de terre (avec comptage), galeries / taupinières, racines actives et radicelles fines, micro-faune visible (cloportes, collemboles, mille-pattes), mycélium / filaments blancs, matière organique en décomposition, odeur d'humus, effervescence au vinaigre (CO₂ / calcaire). Chaque indice a une infobulle riche (description sensorielle + lecture agronomique), au format des tooltips des blocs 3/4/5.

## Lecture de vitalité

Score par prélèvement dérivé du nombre d'indices cochés + comptage de vers (barème : < 5 vers faible, 5–15 moyenne, > 15 forte pour une bêchée 20×20×20). Trois classes : Vie discrète · Vie installée · Vie foisonnante, chacune avec verbe clé, couleur et conduite conseillée.

## Détails techniques

Nouveaux fichiers dans `src/components/propriete/analyze/` :
- `lifeTests.ts` — modèle : `LIFE_SIGNS` (id, label, icône, description sensorielle, lecture agronomique), `LIFE_TESTS` (protocoles + étapes + emplacements vidéos), `LIFE_CLASSES`, `scoreLife()`, `aggregateLife()`.
- `LifePictos.tsx` — pictos SVG dédiés par indice + schémas animés des protocoles (bêchée triée, bocal vinaigre effervescent, sachet enterré).
- `LifeCrossSection.tsx` — hero SVG morphant selon la vitalité dominante.
- `LifeProtocolCard.tsx` — protocole détaillé, réutilise `TestVideoShelf` / `VideoLightbox` existants.
- `LifeChoiceTooltip.tsx` — infobulle riche, avec prop `align` pour éviter tout débordement.
- `LifeSampleRow.tsx` — ligne A→E : test utilisé, chips d'indices cochables, champ nb de vers, pastille de vitalité.
- `LifeResultsSummary.tsx` — distribution des indices, vitalité dominante, indice moyen, amplitude.

Fichiers modifiés :
- `blocks/LifeSignsBlock.tsx` — réécrit sur le modèle de `PhBlock` (consigne, protocoles, relevé par prélèvement, synthèse). Reçoit `samples` + `onUpdateSample`, conserve `values`/`onToggle` pour la liste globale du site, désormais dérivée de l'union des indices des prélèvements.
- `hooks/propriete/usePropertySoil.ts` — ajout sur `SoilSample` de `life_test`, `life_signs: string[]`, `worm_count?: number | null` (persistés dans le JSONB `samples`, aucune migration SQL nécessaire).
- `tabs/TabAnalyze.tsx` — sortir le bloc 6 de la grille `md:grid-cols-2` pour le passer en pleine largeur ; passage de `samples`/`updateSample` ; ajustement du compteur de progression (bloc 6 validé dès qu'un prélèvement porte au moins un indice).

Aucun changement des blocs 1, 2, 5 hors passage de props, et aucun changement de logique métier hors Widget 6.

## Vidéos

L'étagère « Ciné-terrain » est câblée avec trois emplacements vides (titre + angle) prêts à recevoir vos URLs YouTube ; il suffira de les coller dans `lifeTests.ts`.
