# Faire respecter le rayon par-marche partout (Carte, L'Œil, Synthèse)

## Diagnostic confirmé en base

Pour la marche `Patio végétalisé ISEG` (exploration `75e1bb5f…`) :

- `marches.radius_m = 50` ✅ (override bien enregistré)
- Snapshot iNat actif : `radius_meters = 500`, `total_species = 71` (généré avant le changement de rayon)
- L'onglet **Marches > Vivant** lit `marcheur_observations` (6 obs photos) → cohérent avec le patio.
- Les onglets **Carte / Apprendre > L'Œil / Synthèse** comptent **tout le snapshot brut** sans tenir compte du rayon → 72 espèces.

Bonne nouvelle : chaque espèce du `species_data` contient `attributions[].exactLatitude` / `exactLongitude`. On peut donc **filtrer les espèces par distance Haversine** sans rappeler iNat.

## Stratégie

Filtrer côté lecture (pas re-générer le snapshot) : une espèce ne « compte » pour une marche que si **au moins une de ses attributions iNat tombe dans `marche.radius_m`** autour du point GPS de la marche. Le snapshot reste source unique, le changement de rayon est instantané, pas d'appel API.

## Changements

### 1. RPC `get_exploration_species_count` (source canonique)

Nouvelle migration. Réécriture :

```text
WITH marche_ctx AS (
  SELECT em.marche_id, m.latitude, m.longitude,
         COALESCE(m.radius_m, e.default_radius_m, 500) AS radius_m
  FROM exploration_marches em
  JOIN marches m   ON m.id = em.marche_id
  JOIN explorations e ON e.id = em.exploration_id
  WHERE em.exploration_id = p_exploration_id
),
snap_species AS (
  SELECT DISTINCT lower(sp->>'scientificName') AS sci
  FROM biodiversity_snapshots bs
  JOIN marche_ctx mc USING (marche_id)
  CROSS JOIN LATERAL jsonb_array_elements(bs.species_data) AS sp
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(sp->'attributions','[]'::jsonb)) AS att
    WHERE haversine_m(
            mc.latitude, mc.longitude,
            (att->>'exactLatitude')::numeric,
            (att->>'exactLongitude')::numeric
          ) <= mc.radius_m
  )
)
…
```

Ajout d'une fonction SQL `haversine_m(lat1, lon1, lat2, lon2)` si elle n'existe pas (sinon réutiliser). Fallback : si une espèce n'a aucune attribution avec GPS, on la garde uniquement quand `radius_m >= radius_meters` du snapshot (compat ancien).

### 2. `src/hooks/useExplorationSpeciesPool.ts` (alimente L'Œil)

- Charger en plus `marches.latitude/longitude/radius_m` + `explorations.default_radius_m` (déjà dispo via `useExplorationMarchesRadius`).
- Après le fetch des snapshots et des `marcheur_observations`, filtrer chaque espèce : conserver uniquement celles dont au moins une attribution est à ≤ rayon résolu de la marche d'origine.
- Utilitaire commun : `src/utils/speciesRadiusFilter.ts` (nouveau) exposant `isSpeciesWithinRadius(species, marcheCoords, radiusM)` et `filterSpeciesPoolByRadius(pool, marchesById)`.

### 3. `src/components/community/EventBiodiversityTab.tsx` (Synthèse)

Même filtrage que ci-dessus, avec la même util partagée, sur les deux queries lignes 162–197.

### 4. `src/components/community/exploration/ExplorationCarteTab.tsx` (compteur bas + markers carte)

Le compteur `unifiedTotalSpecies` viendra automatiquement de la RPC corrigée. En complément : filtrer les markers d'espèces affichés sur la carte avec la même util, pour éviter d'afficher des points iNat hors du cercle visible.

## Détails techniques

- **Util JS** (Haversine en mètres) :
  ```ts
  // src/utils/geoDistance.ts
  export const haversineM = (lat1,lon1,lat2,lon2) => { … }
  ```
- **Source d'attributions** : `species.attributions[]` (iNat) + tolérance : si pas d'attribution GPS, on regarde `species.exactLatitude/Longitude` si présents, sinon on rejette dès que `radius_m < 500` (snapshot 500 m hérité).
- **Invalidations React Query** : `useUpdateMarcheRadius` invalide déjà `marche-radius` / `exploration-marches-radius`. Ajouter l'invalidation de `['exploration-species-count', explorationId]`, `['exploration-species-pool', explorationId]` et de la query Synthèse pour rafraîchir les compteurs immédiatement après changement de rayon.
- **Pas de regénération de snapshot** : décision explicite — on garde le snapshot à 500 m (pool de référence) et on rétrécit côté lecture. Avantage : changer de rayon est instantané et n'appelle pas iNat.

## Fichiers touchés

- `supabase/migrations/<new>.sql` — RPC `get_exploration_species_count` + éventuel `haversine_m`.
- `src/utils/geoDistance.ts` *(nouveau)*
- `src/utils/speciesRadiusFilter.ts` *(nouveau)*
- `src/hooks/useExplorationSpeciesPool.ts`
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/community/exploration/ExplorationCarteTab.tsx` (filtrage markers)
- `src/hooks/useUpdateRadius.ts` (invalidations supplémentaires)

## Hors scope

- Régénération automatique du snapshot iNat au changement de rayon (pas nécessaire avec ce filtrage côté lecture).
- Changement du sous-onglet Marches > Vivant (déjà correct).
