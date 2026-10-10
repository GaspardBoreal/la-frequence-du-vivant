# Atelier : emplacements visibles et période « Tout » par défaut

## 1. Les emplacements n'apparaissent pas
Cause constatée sur la capture : la vue de fond « Emplacements » est éteinte (œil barré, suite à « Tout masquer »), alors que les yeux des deux emplacements sont allumés. Le plan exige les deux, d'où rien à l'écran.

Correctif :
- Allumer un œil d'emplacement (ou cliquer sur son nom) rallume automatiquement la vue « Emplacements ».
- Cliquer sur le nom d'un emplacement recentre la carte sur son contour (la capture montre une zone de route, hors des massifs).
- Si la vue « Emplacements » est éteinte, les yeux individuels apparaissent grisés avec la mention « vue masquée », pour que l'état soit lisible.

## 2. Période des observations bloquée sur « Aujourd'hui »
Cause constatée : la période choisie est mémorisée dans le navigateur, par jardin, sans limite. Un ancien choix « Aujourd'hui » revient donc à chaque ouverture (0 observation).

Correctif :
- À chaque ouverture de l'Atelier, la période repart sur « Tout ».
- Le choix fait pendant la séance reste actif tant que l'Atelier est ouvert.

## Détails techniques
- `LayersPanel.tsx` : `onPatchZone(z,{visible:true})` et sélection d'un emplacement déclenchent aussi `onSystemChange({...system, zones:true})` ; style atténué des lignes quand `!system.zones`.
- `PaletteStudio.tsx` : à la sélection, `map.fitBounds` sur `geometryPolygonRings(z.geometry)`.
- `ProprieteVivantScopeContext.tsx` : la période n'est plus relue depuis localStorage au chargement (état de séance, défaut `all`) ; portée cadastre/tous inchangée.
