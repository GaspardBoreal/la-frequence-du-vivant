## Objectif
Permettre de zoomer beaucoup plus près sur la carte de curation taxonomique afin d'inspecter précisément chaque observation d'un cluster (ex. « weigela · 3 obs » sur DEVIAT).

## Diagnostic
- Le `MapContainer` (Leaflet) plafonne au `maxZoom` de la tuile active : **19** pour le satellite et **20** pour le cadastre. Impossible d'aller plus près.
- `FitBounds` limite en plus le zoom initial à **18** quand le diamètre du cluster est petit (< 150 m), ce qui donne l'impression d'être « bloqué ».

## Correctifs (frontend uniquement)

### 1. `src/components/maps/RichMap.tsx`
Ajouter une prop optionnelle `maxZoom?: number` (défaut 19) transmise à `SafeMapContainer`.

### 2. `src/components/maps/DynamicTileLayer.tsx`
Pour chaque tuile, activer l'upscaling au-delà du natif :
- satellite / géo / relief : `maxNativeZoom = config.maxZoom ?? 19`, `maxZoom = 22`.
- overlay cadastre : `maxNativeZoom = 20`, `maxZoom = 22`.
Les tuiles restent nettes jusqu'au niveau natif, puis sont agrandies au-delà.

### 3. `src/components/maps/controls/FitBounds.tsx`
Relever le plafond auto pour les très petits diamètres :
- `diag < 150 m` → `computedMax = 20` (au lieu de 18).
- `diag < 500 m` → `computedMax = 19` (au lieu de 17).
Le zoom manuel via la molette / boutons + reste libre jusqu'au `maxZoom` de la carte.

### 4. `src/components/admin/taxonomy/DuplicatesMapView.tsx`
Passer `maxZoom={22}` à `<RichMap>` pour débloquer le zoom précis sur les constellations.

## Résultat attendu
- Zoom bouton **+** / molette utilisable jusqu'au niveau 22 sur satellite et cadastre (tuiles upscalées, contours cadastraux nets).
- L'auto-fit sur un cluster ≤ 150 m arrive directement à un niveau exploitable pour distinguer chaque point d'observation.
- Aucun impact sur les autres écrans (défaut inchangé à 19).
