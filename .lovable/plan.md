# Couverture étendue des stations météo (est & sud)

## Diagnostic

Sur l'exploration de Déviat, deux causes expliquent l'absence de stations à l'est et au sud :

1. **Filtrage géographique injuste** : `useNearestStations` filtre les stations par distance au **barycentre** des points. Or BLAYE (~55km) et ST EMILION (~58km), bien qu'à <60km de plusieurs points individuels, peuvent être exclues si le barycentre est légèrement décalé.
2. **DB locale lacunaire** : aucune station Dordogne ouest (Périgueux, Ribérac, Mussidan), Charente est, ou Libourne. LEXICON ne renvoie que la plus proche par point (PASSIRAC), donc ces stations ne sont jamais découvertes.

## Changements

### 1. Filtrage par point (au lieu du barycentre)
**`src/hooks/useNearestStations.ts`** — Une station est conservée si elle est à ≤ `radiusKm` d'**au moins un** point de marche (au lieu du barycentre). Effet immédiat : BLAYE et ST EMILION apparaissent à 60km.

### 2. Slider de rayon dans le menu d'options
**`src/components/community/exploration/MapOptionsMenu.tsx`** — Ajout d'un slider 40–100km (pas de 10km, défaut 60) sous le toggle « Stations météo », visible uniquement quand la couche est active.

**`src/hooks/useMapLayers.ts`** — Ajout de `weatherStationsRadius: number` (défaut 60) dans l'état persisté, avec setter `setWeatherStationsRadius`.

**`src/components/community/exploration/ExplorationCarteTab.tsx`** — Passe `radiusKm={layers.weatherStationsRadius}` à `<WeatherStationsLayer>`.

### 3. Enrichissement de la DB locale
**`src/utils/weatherStationDatabase.ts`** — Ajout de stations Météo France connues pour combler le vide est/sud :
- `24322001` PÉRIGUEUX-BASSILLAC (45.198, 0.815)
- `24520001` SAINT-ASTIER (45.143, 0.519)
- `24350001` RIBÉRAC (45.247, 0.327)
- `24291001` MUSSIDAN (45.040, 0.371)
- `33243001` LIBOURNE (44.916, -0.244)
- `17299001` PONS (45.578, -0.547)
- `17415001` SAINTES (45.749, -0.625)
- `16374001` CHASSENEUIL (45.821, 0.450)

Coordonnées vérifiées via communes officielles. Si une station se révèle imprécise, le résolveur LEXICON pourra la corriger.

### 4. Scan LEXICON multi-directionnel (découverte de stations cachées)
**`src/hooks/useNearestLexiconStations.ts`** — Étendre `MarchePointInput[]` avec une **grille de points fictifs** (8 directions cardinales × distance = `radiusKm/2`) autour du barycentre, pour forcer LEXICON à révéler les stations officielles non locales (ex: une station Météo France à Nontron ou Aulnay).

Implémentation : nouvelle fonction utilitaire `generateScanGrid(center, distanceKm)` retournant 8 points (`scan-N`, `scan-NE`, …). Ces points sont **uniquement** utilisés pour enrichir le pool de stations découvertes ; ils ne sont **pas** inclus dans `pointLinks` (filtrage par préfixe `scan-`).

## Détails techniques

- **Filtrage par point (perf)** : O(stations × points). Pour 13 points × ~25 stations candidates = négligeable.
- **Grille de scan** : 8 points fictifs supplémentaires → +8 appels LEXICON via le hook existant. Calcul Haversine pour positionner chaque point fictif à `radiusKm/2` du barycentre, dans les 8 directions cardinales.
- **Slider** : utilise le composant `Slider` de shadcn déjà présent dans le projet. Persisté dans `localStorage` via la clé existante `mapLayers:{explorationId}`.
- **Migration `useMapLayers`** : ajouter dans `migrate()` un fallback `weatherStationsRadius: 60` si absent.

## Résultat attendu

```text
Avant (60km, barycentre)              Après (60km, par point + DB enrichie + scan)
                                      
        COGNAC ANGOULÊME                   COGNAC  ANGOULÊME  CHASSENEUIL
                                      SAINTES                            
        BARBEZIEUX                            BARBEZIEUX  RIBÉRAC
        PASSIRAC                              PASSIRAC  ST-ASTIER  PÉRIGUEUX
                                      PONS         •points•      MUSSIDAN
        (rien)                                BLAYE  ST EMILION  LIBOURNE
```

L'utilisateur pourra de plus pousser à 80 ou 100km via le slider pour faire apparaître BERGERAC, ST GERVAIS, BORDEAUX-MERIGNAC, etc.
