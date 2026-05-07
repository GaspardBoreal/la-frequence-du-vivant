## Diagnostic

L'écart vient du fait que la couche carte n'utilise PAS LEXICON.

- `WeatherStationsLayer.tsx` appelle `findNearestWeatherStation()` qui scanne **uniquement la base locale `weatherStationDatabase.ts`** — ~13 stations codées en dur (BLAYE, ST EMILION, BORDEAUX-MÉRIGNAC, BERGERAC…).
- PASSIRAC (`16256001`) et BARBEZIEUX (`16028001`) **ne sont pas dans cette base locale** → l'algo retombe sur la station la plus proche *de la base locale*, soit BLAYE / ST EMILION.
- À l'inverse, la fiche bioacoustique (`/bioacoustique/...`) appelle LEXICON via `fetchLexiconParcelData(lat, lng)`. LEXICON renvoie pour chaque parcelle le champ `last-year-weather-reports.station` (ex. `"BARBEZIEUX 16028001"` ou `"PASSIRAC 16256001"`) — c'est la station Météo-France réellement la plus proche.

Conclusion : la carte doit interroger LEXICON pour chaque point de marche, exactement comme la fiche bioacoustique, au lieu de s'appuyer sur la mini-base locale.

## Stratégie retenue

1. **Source de vérité = LEXICON** (par point de marche).
2. **Coordonnées de la station** : LEXICON ne les fournit pas. On utilise un résolveur en cascade :
   - a. Lookup dans `WEATHER_STATIONS` local (rapide, exact) ;
   - b. Sinon, géocodage du nom de la station via Nominatim (déjà utilisé dans `src/utils/geocoding.ts`) — résultat persisté en `localStorage` (clé `weatherStationCoords:<code>`) pour ne géocoder qu'une fois ;
   - c. Sinon, fallback : on positionne la station au centroïde de la commune renvoyée par LEXICON (`information.city` → géocodage commune+code postal).
3. **Cache** : React Query par point (`['lexicon-station', lat, lng]`, `staleTime: 30 min`) + résolveur de coords mémoïsé.
4. **Dédup** par `station code` ; un même marker regroupe tous les points qu'il sert.
5. **Robustesse** : si LEXICON répond sans station (mer, étranger, panne), on tombe en dernier recours sur l'ancienne logique locale, mais on tag la station `source: 'fallback-local'` (badge discret dans le popup).

## Implémentation

### 1. Nouveau hook `useNearestLexiconStations`
`src/hooks/useNearestLexiconStations.ts`

- Entrée : `points: { id, lat, lng }[]`
- Pour chaque point : `useQueries` React Query → `fetchLexiconParcelData(lat, lng)`.
- Parse `data?._raw?.['last-year-weather-reports']?.station?.value` (regex `/^(.+?)\s+(\d{8})$/`) → `{ name, code }`.
- Renvoie `{ pointId, station: { code, name, city, postalCode }, raw }[]`.

### 2. Résolveur de coordonnées `resolveStationCoordinates`
`src/utils/weatherStationResolver.ts` (nouveau)

```ts
async function resolveStationCoordinates(
  station: { code: string; name: string; city?: string; postalCode?: string }
): Promise<{ lat: number; lng: number; source: 'local' | 'geocoded' | 'commune' }>
```

- `getStationByCode(code)` → si trouvé, retourne `coordinates`.
- Sinon `localStorage.getItem('weatherStationCoords:'+code)`.
- Sinon `geocodeAddress(name + ' France')` puis `geocodeAddress(city + ' ' + postalCode)`.
- Persiste en `localStorage`.

### 3. Refacto `WeatherStationsLayer.tsx`

- Remplacer `findNearestWeatherStation` par `useNearestLexiconStations(marches)`.
- Pour chaque résultat, appel `resolveStationCoordinates` (via un petit hook `useResolvedStations`).
- Regroupement par `station.code`, calcul des distances `marche → station` avec `calculateDistance`.
- Conserver l'icône, les polylines pointillées, le popup actuel.
- Ajouter dans le popup : badge `source` (Local · Géocodé · Commune) en `text-[9px]` discret.
- Ajouter une légende (1 état) : si une station est résolue par géocodage approximatif, indiquer `~` devant la distance.

### 4. Pas de changement
- `useMapLayers` (3 modes), `MapOptionsMenu`, `ExplorationCarteTab` restent identiques.
- L'ancien `findNearestWeatherStation` est conservé pour `WeatherVisualization` (fiche bioacoustique).

## Fichiers

Créés :
- `src/hooks/useNearestLexiconStations.ts`
- `src/utils/weatherStationResolver.ts`

Modifiés :
- `src/components/community/exploration/WeatherStationsLayer.tsx`

## Garanties

- DEVIAT Point 00 → LEXICON renvoie PASSIRAC (16256001) → résolu par géocodage Nominatim "PASSIRAC France" → marker affiché à ~60 km, pointillé jusqu'au point.
- Aucune régression pour les points dont la station est dans la base locale (lookup direct, instantané).
- Cache React Query + localStorage : 1 appel LEXICON par point unique sur la durée de la session.
