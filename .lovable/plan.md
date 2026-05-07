## Objectif

Ajouter dans le menu **Options carte** (FAB existant) une option **Station météo** à 3 états, et afficher sur la carte la station Lexicon la plus proche de chaque point de marche, avec une couche dédiée mobile-first.

## États du contrôle

Remplacer le `Switch` simple actuel `weatherStations` par un sélecteur **3 états** (segmented control vertical de 3 lignes) :

1. **OFF** — Aucune station affichée (défaut)
2. **ON · avec points de marche** — Stations + tous les marqueurs de marche restent visibles
3. **ON · sans points de marche** — Stations seules + lignes de tracé conservées, mais marqueurs de marche masqués (focus météo)

Stocké dans `useMapLayers` sous `weatherStations: 'off' | 'on_with_marches' | 'on_only'`.

## UX du contrôle (mobile-first)

Dans `MapOptionsMenu`, la ligne « Stations météo » devient une carte dépliable :

```text
┌────────────────────────────────────────────┐
│ ☁  Stations météo            [ON · focus]▾│
│    Plus proches des points de marche       │
└────────────────────────────────────────────┘
   ▼ déplié (radio group, large tap targets)
   ○ Désactivé
   ● Avec points de marche
   ○ Focus météo (masquer les points)
```

- Tap targets ≥ 44px, `RadioGroup` shadcn
- Badge d'état coloré (ardoise / émeraude / sky)
- Haptique léger à chaque changement
- Le badge global du FAB compte « météo activée » si ≠ off

## Couche carte (`WeatherStationsLayer`)

Nouveau composant `src/components/community/exploration/WeatherStationsLayer.tsx` :

- Reçoit la liste des points de marche (`marches` déjà disponible dans `ExplorationCarteTab`)
- Pour chaque point, appelle `fetchLexiconParcelData(lat, lng)` via un hook batch `useNearestWeatherStations(points)` qui :
  - Déduplique les coords arrondies à 3 décimales (~110 m)
  - Utilise `useQueries` (React Query) avec `staleTime: 30 min`
  - Extrait la station la plus proche depuis la réponse Lexicon (mêmes parsers que `WeatherStationModal` / `weatherStationDatabase`)
- Rend un `Marker` Leaflet par station unique avec icône SVG dédiée (nuage + thermomètre, couleur sky)
- Polyline pointillée fine reliant chaque point de marche à sa station (≤ 1px, sky/40%) pour visualiser l'appariement
- Popup : nom station, code, distance, altitude, bouton « Voir détails » qui ouvre `WeatherStationModal` existant

## Refacto minimal

1. `**useMapLayers.ts**` : changer `weatherStations: boolean` → union string ; helper `setWeatherStationsMode(mode)` ; `activeCount` compte si `!== 'off'`
2. `**MapOptionsMenu.tsx**` : remplacer la `LayerRow` météo par un nouveau composant `WeatherStationsRow` (collapse + RadioGroup) ; retirer le toast « bientôt disponible »
3. `**ExplorationCarteTab.tsx**` :
  - Monter `<WeatherStationsLayer>` à l'intérieur du `<MapContainer>` quand mode ≠ off
  - Quand mode = `'on_only'`, masquer les marqueurs de marche existants (props `hideMarcheMarkers` ou simple condition de rendu sur `marches.map(...)`) — les tracés (polylines) restent
4. **Hook `useNearestWeatherStations.ts**` (nouveau) : encapsule le batch React Query + extraction station

## Hors scope

- Cadastre détaillé / espèces récentes (restent « bientôt disponible »)
- Affichage des N stations alternatives sur la carte (reste dans la modal existante)
- Cache serveur (on reste sur le proxy Lexicon actuel + cache React Query)

## Fichiers touchés

- `src/hooks/useMapLayers.ts` (modif type)
- `src/hooks/useNearestWeatherStations.ts` (nouveau)
- `src/components/community/exploration/MapOptionsMenu.tsx` (collapse + RadioGroup)
- `src/components/community/exploration/WeatherStationsLayer.tsx` (nouveau)
- `src/components/community/exploration/ExplorationCarteTab.tsx` (montage couche + masquage conditionnel des marqueurs)

## Questions ouvertes (réponds si tu veux ajuster, sinon on part sur les défauts)

1. **Distance max** d'une station pertinente — défaut **65 km**, au-delà on n'affiche pas le marqueur.
2. **Déduplication** — si deux points de marche partagent la même station, on n'affiche **qu'un marqueur** avec liste des points reliés. OK
3. **Polylines de rattachement** point→station — défaut **activées en pointillés discrets**.