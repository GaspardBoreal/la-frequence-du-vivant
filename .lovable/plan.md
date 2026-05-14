# Fix : champs GPS iNaturalist non reconnus

## Cause racine

Dans `biodiversity_snapshots.species_data[].attributions[]`, les coordonnées sont stockées sous **`exactLatitude` / `exactLongitude`** (cf. `BiodiversityObservation` dans `src/types/biodiversity.ts`).

Or :
- `src/utils/speciesIndividualCount.ts` lit `a.latitude` / `a.longitude`
- `SpeciesGpsDrawer.tsx` filtre sur `a.latitude` / `a.longitude`
- `BiodiversitySimulator.tsx` (état `hasGps`) idem

Conséquence :
- Drawer "Orchidée pyramidale" : 0 cluster GPS, message "Aucune coordonnée GPS" alors que les 2 attributions ont bien des coords.
- Onglet **Richesse → Individus GPS** : tous les attributs tombent dans le `noGps` fallback → l'indice "individus" finit à `attributions.length` (= comptage observations brutes), donc le mode "Individus GPS" produit la même valeur que "Observations brutes" sans qu'on s'en rende compte.

## Fix

### 1. Normaliser au niveau du helper (source unique de vérité)

`src/utils/speciesIndividualCount.ts` :
- Étendre `AttributionLike` avec `exactLatitude?` / `exactLongitude?`
- Ajouter une petite fonction `getLatLng(a)` qui renvoie `{lat, lng} | null` en testant d'abord `latitude/longitude`, puis `exactLatitude/exactLongitude`
- Utiliser `getLatLng` dans le filtre, le tri et la boucle de clustering
- Exporter `getLatLng` pour réutilisation

### 2. Réutiliser le helper dans le drawer et le simulateur

`src/components/community/synthese/indices/SpeciesGpsDrawer.tsx` :
- Importer `getLatLng`
- Remplacer le filtre `gpsAttrs` par `getLatLng(a) !== null`
- Construire les marqueurs depuis `getLatLng` (les `clusters` retournés par `countIndividuals` sont déjà bons grâce au fix #1)

`src/components/community/synthese/indices/BiodiversitySimulator.tsx` :
- `hasGps` utilise `getLatLng`

## Vérification

Après fix, sur l'orchidée pyramidale :
- Carte : 2 marqueurs émeraude (45.4138, 0.0094) et (45.4140, 0.0089) → distance ≈ 40 m → 2 clusters distincts
- KPI "Individus GPS" : 2
- Richesse "Individus GPS" : valeur < observations brutes pour les espèces réellement re-photographiées au même endroit

## Hors périmètre

- Pas de migration DB (les données sont correctes, c'est le code qui lit le mauvais champ)
- Pas de modif des autres onglets (Simpson/Shannon/Piélou consomment les abondances déjà calculées via le helper)