

## Filtrer les observations aberrantes sur la carte de biodiversité

### Problème

Dans `BiodiversityMap.tsx`, le clustering (lignes 170-213) place un marqueur pour **chaque** attribution ayant des coordonnées exactes, sans vérifier si ces coordonnées sont cohérentes avec le rayon de recherche. Résultat : un "Devil's Coach Horse Beetle" observé près de Lyon apparaît sur la carte d'un point situé à DEVIAT (Charente), à ~400 km de distance.

### Cause racine

L'edge function `biodiversity-data` retourne des espèces dont certaines attributions ont des coordonnées GPS éloignées du centre de recherche (données GBIF/iNaturalist). La carte les affiche aveuglément.

### Correction

Dans le `useMemo` de `observationClusters` (ligne 171), ajouter un filtre de distance : ne garder que les attributions dont les coordonnées sont à moins de `data.location.radius * 2` km du centre (ou un maximum raisonnable de 10 km). Utiliser une formule haversine simplifiée ou un bounding box.

```text
Pour chaque attribution :
  - calculer la distance au centre (centerLat, centerLon)
  - si distance > max(radius * 2, 10) km → ignorer
```

### Fichier impacté

| Action | Fichier | Détail |
|--------|---------|--------|
| Modifier | `src/components/biodiversity/BiodiversityMap.tsx` | Ajouter filtre de distance dans `observationClusters` useMemo (ligne ~186) |

### Détail technique

1. Ajouter une fonction `haversineKm(lat1, lon1, lat2, lon2)` en haut du fichier (ou importer si déjà existante)
2. Dans la boucle `species.attributions?.forEach`, avant de créer/ajouter au cluster, vérifier : `haversineKm(attribution.exactLatitude, attribution.exactLongitude, centerLat, centerLon) <= maxRadius`
3. `maxRadius` = `Math.max((data?.location?.radius || 5) * 2, 10)` km — suffisamment large pour ne pas couper les observations légitimes en bordure, mais élimine les aberrations à 400 km

