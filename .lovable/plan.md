## Diagnostic

Les 2 vignobles existent bien en base avec coordonnées valides :
- SCEA Les Joualles de Cormeil-Figeac (44.906, −0.190) — Saint-Émilion
- La terre de Pauline (43.585, 6.097) — Var

Ils sont rendus par Leaflet mais invisibles à l'œil pour 3 raisons cumulées :

### 1. Ordre d'empilage : Sol Vivant *sous* les marches
Dans `MapView.tsx`, le bloc `solVivantPoints.map(...)` est déclaré **avant** `geoEvents.map(...)`. Leaflet empile dans l'ordre d'ajout (dernier au-dessus), donc le CircleMarker de 5 px de SCEA Les Joualles est **totalement recouvert** par le gros marker orange "Éco tourisme" (~32 px) sur Bordeaux.

### 2. Trop petits et peu contrastés
`radius={5}` sans halo blanc, lime clair (#84cc16) sur fond OSM → le point Provence est quasi invisible.

### 3. FitBounds ignore les Sol Vivant
`FitBounds` cadre uniquement sur `geoEvents`. Quand peu d'événements et éloignés, la carte peut cadrer une zone sans aucun partenaire visible.

## Correction (frontend only)

Dans `src/components/carte-mdv/views/MapView.tsx` :

### 1. Inverser l'ordre de rendu
Placer `solVivantPoints.map(...)` **après** `geoEvents.map(...)`. L'utilisateur vient d'activer explicitement le toggle Sol Vivant → il attend de les voir prioritairement quand il y a chevauchement.

### 2. Rendre les points visibles
```tsx
<CircleMarker
  radius={7}
  pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#84cc16', fillOpacity: 0.95 }}
/>
```
Halo blanc + fill quasi opaque = visibilité claire même à proximité d'un marker événement.

### 3. FitBounds intelligent
Inclure les Sol Vivant dans les `positions` passées à `FitBounds` **quand** `showSolVivant` est actif ET `geoEvents.length <= 3`. Ainsi "Vignoble + Sol Vivant" cadre auto sur Bordeaux + Provence.
Sinon (beaucoup d'événements), garder le cadrage événements pour ne pas dézoomer.

## Fichier touché

- `src/components/carte-mdv/views/MapView.tsx` — 3 modifications ciblées

Aucune migration, aucun autre fichier.
