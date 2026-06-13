## Problème

`CrmCompaniesMap` (l.46-50) fige `center = points[0]` et `zoom = 6` au montage. Pas de `fitBounds` → quel que soit le nombre de points, on reste sur la France/Bordeaux sans s'adapter.

## Correctif (1 fichier — `src/components/crm/CrmCompaniesMap.tsx`)

1. Ajout d'un composant interne `FitBounds` utilisant `useMap()` de `react-leaflet` :
   - `useEffect` déclenché à chaque changement de `points` (clé = liste des `lat,lng`).
   - Si **0 point** : `setView([46.6, 2.5], 5)` (France).
   - Si **1 point** : `setView([lat, lng], 13)` (zoom commune).
   - Si **N ≥ 2** : `map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 })`.
2. Suppression du `center`/`zoom` figé du `<MapContainer>` (on garde un fallback initial neutre, le `FitBounds` recadrera dès le 1er render).
3. Aucun changement d'API du composant : `CrmAnnuaire.tsx` reste inchangé.

## Hors scope
- Pas de cluster, pas de dé-collision (déjà discuté).
- Pas de mémorisation du zoom utilisateur entre filtres.
