## Objectif

Mutualiser la carte du menu **Carte** (`ExplorationCarteTab`) et celle du **drawer Espèce** (`SpeciesGpsDrawer`) dans un composant partagé `<RichMap>`. Toute amélioration future (nouveau style, nouvelle couche, nouveau contrôle) profite automatiquement aux deux écrans.

## Diagnostic

`ExplorationCarteTab.tsx` (1519 lignes) mélange aujourd'hui :
- la **carte générique** (tile layer, zoom, fit bounds, géoloc, style toggle, cadastre, météo) → réutilisable
- la **logique métier marche** (steps numérotés, polyline, waypoints, create-marche, proximité, panel distances) → spécifique

Le drawer Espèce a réimplémenté un mini `MapContainer` from scratch → duplication, divergence garantie à terme.

## Architecture cible

```text
src/components/maps/
├── RichMap.tsx              ← NOUVEAU shell réutilisable
├── DynamicTileLayer.tsx     (existe)
├── MapStyleToggle.tsx       (existe)
├── controls/
│   ├── ZoomControls.tsx     ← extrait
│   ├── GeolocateControl.tsx ← extrait (bouton + UserLocationMarker + tracking)
│   └── FitBounds.tsx        ← extrait
└── layers/
    ├── CadastreLayer.tsx    (déjà autonome, on le réexpose)
    ├── WeatherStationsLayer.tsx ← déplacé depuis exploration/
    └── MarcheRouteLayer.tsx ← NOUVEAU : polyline + steps numérotés (extrait d'ExplorationCarteTab)
```

### API du composant `<RichMap>`

```tsx
<RichMap
  center={[lat, lng]}
  bounds={positions}                  // déclenche fitBounds
  initialStyle="osm"                  // 'osm' | 'satellite' | 'cadastre'
  controls={{
    zoom: true,
    style: true,
    geolocate: true,
    cadastre: true,
    weather: false,                   // togglé par menu
  }}
  marcheRoute={{ steps, color }}      // optionnel — affiche tracé en fond
  height="60vh"
  className="rounded-2xl"
>
  {/* slot enfants : markers métier (espèce, photo, observation…) */}
  {attributions.map(a => <SpeciesMarker key={a.id} {...a} />)}
</RichMap>
```

Slots/props clés :
- `children` = markers/popups métier (le drawer y met ses pulsing markers d'observations iNat)
- `marcheRoute` = propriété optionnelle pour afficher le tracé d'une marche en arrière-plan (utilisé par le drawer pour situer les obs sur le parcours)
- `controls` = drapeaux d'activation des contrôles (zoom, géoloc, style, cadastre, météo)
- `onMapReady?(map)` = échappatoire pour cas exotiques

### Ce qui RESTE dans `ExplorationCarteTab`

Tout ce qui est spécifique marche : waypoints, create-marche, proximité, panel distances, photo-GPS-drop. `ExplorationCarteTab` devient un consommateur de `<RichMap>` avec ses propres enfants/overlays métier. Pas de régression fonctionnelle.

## Étapes

1. **Extraire les briques** depuis `ExplorationCarteTab.tsx` vers `src/components/maps/` :
   - `FitBounds`, `ZoomControls`, `UserLocationMarker` + bouton `GeolocateControl` (regroupés)
   - Déplacer `WeatherStationsLayer` (actuellement dans `exploration/`) vers `maps/layers/`
   - Créer `MarcheRouteLayer` à partir de la polyline + `createNumberedIcon` + `ArrowDecorators`

2. **Créer `RichMap.tsx`** : MapContainer + DynamicTileLayer + branchement conditionnel des contrôles selon props, gestion de l'état `mapStyle` interne, slot `children`.

3. **Migrer `SpeciesGpsDrawer`** pour consommer `<RichMap>` :
   - supprimer son `MapContainer` local
   - garder uniquement les markers pulsants émeraude + popups (passés en `children`)
   - activer `controls.style/geolocate/cadastre/weather`
   - passer `marcheRoute={{ steps: marcheSteps }}` (récupérés via le prop existant `marches` ou un nouveau prop, à brancher depuis `BiodiversitySimulator`/`TaxonsIndicesPanel`)

4. **Migrer `ExplorationCarteTab`** pour consommer `<RichMap>` :
   - remplacer son `MapContainer` par `<RichMap>` configuré avec tous les contrôles
   - garder ses overlays spécifiques (waypoints, create-marche, panel distances) en `children` ou en wrapper
   - vérifier que le tracé marche s'affiche bien via `marcheRoute` plutôt qu'en JSX inline (ou garder en JSX si trop intriqué — décision au moment du refactor)

5. **QA visuelle** :
   - onglet Carte : zoom, géoloc, toggle style, cadastre, météo, waypoints, create-marche → tout fonctionne comme avant
   - drawer Espèce (Orchidée pyramidale) : 2 markers émeraude visibles, tracé marche en fond, toggle style fonctionne, géoloc OK, popups iNat OK

## Détails techniques

- **Pas de changement de schéma DB.** Pur refactor frontend.
- **Pas de changement de logique métier** (countIndividuals, getLatLng, fusion iNat/marcheur restent identiques).
- **Compatibilité** : `MapStyleToggle` et `DynamicTileLayer` déjà autonomes — on s'appuie dessus.
- **Risque principal** : régression sur `ExplorationCarteTab` (gros fichier intriqué). Mitigation : refactor incrémental, on garde le fichier qui orchestre, on extrait juste les briques génériques et on injecte via `<RichMap>` ; les overlays spécifiques restent en place.
- **Mémoire projet** : à l'issue, créer une mémoire `mem://technical/maps/rich-map-shared-component` pour documenter la convention "toute nouvelle fonctionnalité carte va dans `<RichMap>`, pas dans un consommateur".

## Hors-scope

- Pas de redesign visuel. La parité visuelle est l'objectif.
- Pas de migration des autres mini-cartes du projet (`InteractiveStationMap`, `GpsMapView`, `PhotoLocationDialog`…) dans cette PR. Elles pourront migrer dans un second temps une fois `<RichMap>` éprouvé.
