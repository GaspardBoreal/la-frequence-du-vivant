## Objectif

La mini-carte du lightbox `/marches-du-vivant/mon-espace/exploration/.../` n'affiche aujourd'hui que le point principal (gros cercle pulsant + tooltip permanent). Les **12 autres étapes de l'exploration** sont pourtant déjà chargées par le hook `useExplorationAllMedia` (vérifié en BDD : 13 étapes avec GPS pour DEVIAT) — elles sont rendues comme petits cercles `radius:4 opacity:0.3` qui se perdent visuellement.

On va reprendre **le langage visuel exact de l'onglet Carte** (`ExplorationCarteTab`) afin d'avoir une expérience cohérente et beaucoup plus inspirante.

## Ce qui change

### 1. Mini-carte du lightbox — refonte visuelle

Fichier : `src/components/community/insights/curation/MediaLightbox.tsx`

- **Tuiles dark géopoétiques** (OSM-FR + classe CSS `carte-tiles-dark` comme l'onglet Carte) au lieu de l'OSM standard clair actuel.
- **Marqueurs numérotés émeraude** pour TOUTES les étapes (réutilisation du langage de `createNumberedIcon`) :
  - Étapes voisines : taille 22px, dégradé émeraude, opacité 0.6, bordure blanche fine, **numéro d'ordre visible**.
  - Étape origine (celle de la photo) : taille 38px, dégradé émeraude saturé, bordure ambre + halo pulsant, numéro en gras.
- **Polyline émeraude** reliant les étapes dans l'ordre (avec petites flèches directionnelles) — comme l'onglet Carte. Permet de voir le parcours dans lequel s'inscrit la photo.
- **Point EXIF "Ici"** (si métadonnée GPS de la photo) : conservé en marqueur primaire pulsant, dissocié des étapes.
- **Tooltip permanent compact** sur l'étape origine : juste le nom court (ex. `Point 10 HAIES`) avec fond sombre semi-transparent et texte petit, pour ne plus écraser la carte.
- **FitBounds** ajusté avec `padding [32, 32]` et `maxZoom: 14` pour garantir qu'on voie l'ensemble du parcours autour du point principal.
- **Légende** sous la carte simplifiée : `● ici (étape 10) · ● autres étapes du parcours`.

### 2. Tri des étapes par ordre

Le hook retourne aujourd'hui les steps sans ordre garanti. On va :
- Ajouter `ordre` au select dans `useExplorationAllMedia.ts` (table `marches.ordre` ou via `exploration_marches.ordre` selon ce qui existe — à vérifier au moment de l'implé) et trier les steps.
- Cela permet (a) d'afficher le bon numéro sur chaque marqueur et (b) de tracer la polyline dans le bon sens.

### 3. Calcul de l'index "courant"

Pour afficher le bon numéro sur le marqueur origine, on utilise l'index dans le tableau trié `eventSteps`. Le n° devient une donnée du `MarcheStep` (champ `order`).

## Hors scope

- Aucun changement de schéma BDD.
- Aucun changement sur le layout général du lightbox (média | meta), juste sur le bloc carte.
- Pas de touche aux flèches de navigation, à l'audio, aux titres, etc.

## Détails techniques

```text
MediaLightbox map block
├── MapContainer (dark tiles "carte-tiles-dark")
│   ├── Polyline emerald (positions = eventSteps triées)
│   ├── ArrowDecorators (mêmes que l'onglet Carte)
│   ├── Marker × N (numbered, taille selon isOrigin)
│   │     └── Tooltip permanent compact si isOrigin
│   └── CircleMarker EXIF (si exifPoint)
└── Légende compacte
```

Réutilisation : on importe les helpers `createNumberedIcon` + `ArrowDecorators` depuis un nouveau petit fichier partagé `src/components/community/exploration/mapMarkers.ts` (extrait minimal de `ExplorationCarteTab`) pour ne pas dupliquer la logique. Si ça crée trop de mouvement, on fait simplement un copier-paste local des deux helpers dans `MediaLightbox.tsx` (≈40 lignes).

## Fichiers touchés

- `src/components/community/insights/curation/MediaLightbox.tsx` — refonte du bloc carte.
- `src/hooks/useExplorationAllMedia.ts` — ajouter `order` aux steps, tri par ordre.
- (optionnel) `src/components/community/exploration/mapMarkers.ts` — extraction helpers.
