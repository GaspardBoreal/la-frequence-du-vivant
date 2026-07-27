## Problème

À l'ouverture de « Carte des révélations », le cadrage automatique zoome trop : on ne voit qu'une poignée de points au lieu de l'ensemble des observations.

Cause technique confirmée : `RichMap` transmet les positions à `FitBounds` sans plafond de zoom. `FitBounds` calcule alors un `maxZoom` automatique en fonction de la diagonale (jusqu'à zoom 20 quand la diagonale fait moins de 150 m), et un point unique passe même en zoom 17-22. Comme le bloc empile aussi le centre de la propriété dans les bounds, le résultat colle au plus près du cluster central.

## Correction proposée

1. **Plafonner le zoom du cadrage** dans `RichMap` : nouvelle prop optionnelle `fitMaxZoom` (et `fitPadding`) passée directement à `FitBounds`. Aucun changement pour les autres consommateurs (comportement actuel conservé par défaut).

2. **Dans `RevealMapBlock`** : appeler `RichMap` avec `fitMaxZoom={16}` et un padding plus généreux (`[60, 60]`), pour toujours laisser de l'air autour du nuage de points.

3. **Cadrage robuste aux points isolés** : construire les bounds à partir du cœur du nuage plutôt que de tous les points — écarter les positions au-delà du 95ᵉ percentile de distance au centroïde (quelques obs. iNaturalist éloignées peuvent aujourd'hui étirer ou déséquilibrer le cadre). Les points écartés restent affichés, ils ne pilotent simplement pas le cadrage initial.

4. **Bouton « Recadrer »** discret en superposition (icône maximize/crosshair, même style que le bouton plein écran) pour revenir au cadrage global à tout moment, notamment après un changement de filtre règne/source.

5. **Recadrage sur changement de filtre** : les bounds se recalculent déjà quand `filtered` change ; on garde ce comportement, désormais avec le zoom plafonné.

### Fichiers touchés
- `src/components/maps/RichMap.tsx` — props `fitMaxZoom` / `fitPadding` transmises à `FitBounds`
- `src/components/propriete/identify/blocks/RevealMapBlock.tsx` — bounds filtrées des outliers, plafond de zoom, bouton Recadrer

Aucun changement de données ni de logique de comptage d'espèces.
