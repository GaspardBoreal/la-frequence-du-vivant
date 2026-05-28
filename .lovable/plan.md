# Apprendre → La main · Correction affichage Pratique

## Constat (capture)

1. **Picto de la pratique (48×48 en tête de carte) reste gris/vide** alors que la pratique « Haies pour corridor écologique » a bien 3 médias.
2. **Les 3 photos s'ouvrent extrêmement zoomées** : le scarabée et les feuilles débordent / sont rognés au centre. Le paysage perd ciel + sol.

## Cause

Régression introduite par le refactor en accordéon (commit `54336b7c`) :

- Le **picto** utilise `renderThumb(heroItem, 'w-full h-full', { width: 120 })`, qui passe par `optimizeStorageUrl()` → bascule l'URL sur l'endpoint `/render/image/public/?width=120&resize=cover`. Cet endpoint Supabase exige l'activation des **Image Transformations** sur le bucket ; pour certains buckets (mur Convivialité, médias historiques) il renvoie un 400 silencieux. Le `onError` retombe bien sur l'URL d'origine, **mais** uniquement si l'`<img>` reçoit un event d'erreur — or quand le render renvoie un placeholder gris ou un 200 vide, aucun onError n'est tiré → vignette reste grise.
- Les **photos dépliées** sont rendues en `aspect-square` + `object-cover`. Sur une grille `grid-cols-3` à ~900px de large, chaque cellule fait ~300×300 ; un cliché portrait (scarabée) ou cadré large (paysage) est fortement cropé au centre.

## Correction (frontend uniquement, fichier unique)

Fichier : `src/components/community/insights/curation/MainCuration.tsx`

### 1. Picto en tête de carte (toujours visible, fiable)

- Pour le picto **uniquement** (48×48), ne pas passer par `optimizeStorageUrl`. Appeler `renderThumb` avec une nouvelle option `{ raw: true }` qui shortcut l'optimisation et utilise directement `item.url`. Coût : un thumbnail 48px chargé en taille native — négligeable, une seule image par carte.
- Conserver le fallback `Hand` quand `heroItem` est absent.

### 2. Photos dépliées (3 vignettes) — fin du zoom excessif

- Remplacer `aspect-square` par `aspect-[4/3]` (paysage doux) pour les cellules en `grid-cols-3`. Cadrage plus généreux : on garde du contexte sans déformer.
- Garder `object-cover` (l'esthétique mosaïque reste propre, alignement parfait), mais l'aspect 4/3 réduit le crop vertical sur les portraits et le crop horizontal sur les paysages.
- Cas 1 média seul : conserver `aspect-[16/9]` (inchangé).

### 3. Aucune autre modification

- Pas de changement sur l'éditeur, le lightbox, le picker, ou la BDD.
- Le `optimizeStorageUrl` reste utilisé pour les vignettes dépliées (largeur 600 reste un usage légitime du render endpoint, déjà éprouvé ailleurs et avec fallback opérationnel sur ces tailles).

## Détail technique : extension de `renderThumb`

Signature actuelle :
```ts
renderThumb(item, sizeClass, opts: { eager?, width? } = {})
```
Nouvelle :
```ts
renderThumb(item, sizeClass, opts: { eager?, width?, raw? } = {})
```
Si `raw === true`, l'`<img>` reçoit `item.url` directement (pas d'`optimizeStorageUrl`).

## QA

- Ouvrir une pratique avec 3 photos mixtes (paysage + macro + portrait) → picto visible, 3 cellules `aspect-[4/3]` lisibles sans crop excessif.
- Ouvrir une pratique avec 1 seul média → `aspect-[16/9]` conservé.
- Ouvrir une pratique sans média → fallback `Hand` visible dans le picto.
- Vérifier mode dark + light.
- Vérifier qu'aucun autre composant n'importe `renderThumb` (c'est une fonction interne à `MainCuration`).
