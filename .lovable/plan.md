## Diagnostic

Aujourd'hui `WeatherStationsLayer` interroge LEXICON pour chaque point de marche. LEXICON renvoyant **une seule** station (la plus proche), tous les points de Déviat retombent sur **PASSIRAC** → BARBEZIEUX, BLAYE, ST EMILION ne sont jamais cités, donc jamais affichés. C'est une régression par rapport au scan local précédent.

## Objectif

Afficher **toutes les stations météo connues** situées dans un rayon paramétrable autour de l'exploration, et relier visuellement chaque point de marche à **sa station la plus proche** (1 polyline par point).

## Stratégie

Source de vérité = base locale `WEATHER_STATIONS` enrichie progressivement par LEXICON (qui sert désormais de **découverte de nouvelles stations** plutôt que de filtre).

### Pipeline

```text
1. Collecte des candidats stations
   ├─ a) Toutes les stations locales (WEATHER_STATIONS)
   ├─ b) Stations LEXICON découvertes pour chaque point (résolues via resolver)
   └─ c) Cache localStorage des stations déjà géocodées (sessions précédentes)

2. Filtrage par rayon
   └─ Calcul du barycentre des points de marche
   └─ On garde toute station à ≤ radiusKm du barycentre (défaut 60 km, configurable)

3. Rattachement 1 point → 1 station
   └─ Pour chaque point, on cherche la station la plus proche parmi les candidates filtrées
   └─ 1 polyline pointillée bleue par point vers SA station

4. Rendu
   └─ 1 marker par station unique (déduplication par code)
   └─ Popup listant les points rattachés + distance individuelle
```

## Changements de code

### `src/utils/weatherStationDatabase.ts`
- Ajouter **PASSIRAC** (`16256001`) et **BARBEZIEUX** (`16028001`, à confirmer) avec coordonnées précises pour éviter de dépendre du géocodage Nominatim.
- Exposer un helper `getAllStations(): WeatherStation[]`.

### `src/hooks/useNearestStations.ts` (nouveau, remplace `useNearestLexiconStations`)
- Inputs : `points[]`, `radiusKm` (default 60).
- Étape 1 : appelle `useNearestLexiconStations` (existant) pour **enrichir** la liste des stations connues — on garde le côté "vérité officielle" pour découvrir des stations absentes du local.
- Étape 2 : fusionne `WEATHER_STATIONS` + stations LEXICON résolues + cache localStorage.
- Étape 3 : calcule le barycentre des points, filtre les stations à ≤ `radiusKm`.
- Étape 4 : pour chaque point, calcule `nearestStationCode` (Haversine).
- Returns : `{ stations: ResolvedWithMeta[], pointLinks: { pointId, stationCode, distance }[] }`.

### `src/components/community/exploration/WeatherStationsLayer.tsx`
- Remplace `useNearestLexiconStations` par `useNearestStations`.
- Rendu :
  - 1 `Marker` par station retournée (toutes celles dans le rayon).
  - 1 `Polyline` par `pointLinks` (chaque point relié à sa station la plus proche).
  - Popup station inchangée (liste les points rattachés avec leur distance).
- Nouvelle prop `radiusKm` (default 60) pour exposer le réglage au menu d'options plus tard.

### `src/components/community/exploration/MapOptionsMenu.tsx` (optionnel, phase 2)
- Sous l'option "Focus météo", ajouter un slider compact 20–100 km pour ajuster le rayon. (À confirmer si on l'implémente maintenant ou plus tard.)

## Détails techniques

- **Barycentre** : moyenne arithmétique simple lat/lng des points valides — suffisant pour des explorations ≤ 50 km de diamètre.
- **Déduplication marker** : par `station.code`.
- **Performance** : aucun appel réseau supplémentaire — LEXICON déjà appelé, géocodage déjà caché. Le filtrage est O(stations × points), négligeable.
- **Cohérence visuelle** : la polyline relie toujours UN point à UNE station (pas de croisements multiples), et un point est relié à la **vraie** plus proche géographiquement (pas forcément celle annoncée par LEXICON, qui peut être périmée ou administrative).
- **Indicateur popup** : ajouter un petit badge "LEXICON" si la station est aussi celle pointée par LEXICON pour au moins un des points (transparence sur la source officielle).

## Résultat attendu

Sur Déviat, dans un rayon de 60 km, on verra simultanément :
PASSIRAC, BARBEZIEUX, BLAYE, ST EMILION, BORDEAUX-MERIGNAC, BERGERAC, ST GERVAIS, ST EMILION… chacune en marker, avec les 13 points reliés à leur station la plus proche respective.
