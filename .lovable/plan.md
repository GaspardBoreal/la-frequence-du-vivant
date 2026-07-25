## Diagnostic (confirmé par lecture code)

Deux sources de stations coexistent :

1. **Carte cadastre** (`WeatherStationsLayer` → `useNearestStations`) : fusionne la DB locale + les stations **LEXICON géocodées** via `useNearestLexiconStations`. C'est ainsi que **POITIERS-BIARD (86027001)** apparaît à ~2.5 km — elle n'est pas dans la DB locale, mais résolue depuis LEXICON.
2. **Pavé actuel** (`NearestWeatherStationCard`) : lit uniquement `getAllStationsSortedByDistance()` → base hardcodée `weatherStationDatabase.ts`. POITIERS-BIARD absente ⇒ retombe sur **Chasseneuil (~84 km)**, la station "connue" la plus proche.

Résultat : incohérence carte / pavé.

## Correctif

Aligner le pavé sur exactement la même source que la carte, en réutilisant `useNearestStations` avec le `center` de la propriété comme unique point.

### Modification `src/components/propriete/portrait/NearestWeatherStationCard.tsx`
- Supprimer l'appel direct à `getAllStationsSortedByDistance`.
- Appeler `useNearestStations([{ id: 'property-center', latitude, longitude }], radiusKm)` avec `radiusKm = 60` (défaut carte).
- Récupérer la station via `pointLinks[0]` → `stations.find(s => s.code === link.stationCode)` → distance déjà calculée dans `pointLinks[0].distance`.
- Enrichir avec les métadonnées locales si dispo : `getStationByCode(code)` pour récupérer `department`, `region`, `elevation` (LEXICON n'a que name/lat/lng/source). Sinon fallback : afficher uniquement le nom + code + badge source (`Géocodé`/`Précis`/`Commune`) + distance + GPS.
- Ajouter un mini badge de qualité de source (`Précis` / `Géocodé` / `Commune`) cohérent avec le popup carte.
- Si `stations` vide (aucune station à ≤ 60 km) : ne rien afficher (comportement identique à la carte).
- État loading (`isLoading` du hook) : skeleton discret pendant la résolution LEXICON.

### Aucun changement ailleurs
- `PortraitCadastre.tsx` : signature du composant inchangée (toujours `center`).
- Aucune modification DB ou base stations.

## Résultat attendu
Sur `Maison sous Blossac` : le pavé affiche **POITIERS-BIARD** à ~2.5 km avec le badge `Géocodé`, exactement comme le popup de la carte.
