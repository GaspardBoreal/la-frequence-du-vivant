# Synchroniser le chatbot avec la Synthèse

## Diagnostic

Les deux composants ne calculent pas de la même façon :

- **Synthèse (UI)** dans `EventBiodiversityTab.tsx` : parcourt `species_data` de chaque snapshot et **déduplique par `scientificName`** dans une `Map` → **38 espèces uniques**.
- **Chatbot** : reçoit son contexte via la RPC `get_admin_entity_context`, qui fait `SUM(bs.total_species)` sur les snapshots → **77 (somme brute, double-comptage)**. Une espèce vue sur 3 étapes est comptée 3 fois.

Même problème pour `birds`, `plants`, `fungi`, `others` (qui sont aussi des `SUM` non dédupliqués).

## Solution

Corriger la RPC `get_admin_entity_context` pour qu'elle déduplique les espèces par `scientificName` à partir du JSONB `species_data`, exactement comme la Synthèse.

### Migration SQL

Remplacer le bloc `'biodiversity'` (event) par un calcul basé sur l'agrégation déduppliquée :

```sql
'biodiversity', (
  WITH all_species AS (
    SELECT DISTINCT ON (lower(coalesce(sp->>'scientificName', sp->>'commonName')))
      coalesce(sp->>'scientificName', sp->>'commonName') AS sci,
      sp->>'kingdom' AS kingdom
    FROM biodiversity_snapshots bs
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(bs.species_data, '[]'::jsonb)) sp
    WHERE bs.marche_id IN (
      SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id
    )
    AND coalesce(sp->>'scientificName', sp->>'commonName') IS NOT NULL
  )
  SELECT jsonb_build_object(
    'total_species',  count(*),
    'birds',          count(*) FILTER (WHERE kingdom = 'Animalia'),
    'plants',         count(*) FILTER (WHERE kingdom = 'Plantae'),
    'fungi',          count(*) FILTER (WHERE kingdom = 'Fungi'),
    'others',         count(*) FILTER (WHERE kingdom NOT IN ('Animalia','Plantae','Fungi') OR kingdom IS NULL),
    'snapshots_count',(SELECT count(*) FROM biodiversity_snapshots bs2
                       WHERE bs2.marche_id IN (SELECT marche_id FROM exploration_marches WHERE exploration_id = me.exploration_id))
  )
  FROM all_species
)
```

Appliquer la même correction au branche `_type = 'exploration'` si elle expose aussi un bloc biodiversity (à vérifier dans la suite de la fonction).

## Fichiers modifiés

- **migration SQL** : redéfinir `public.get_admin_entity_context(_type text, _id text)` (CREATE OR REPLACE FUNCTION) avec le bloc biodiversity dédupliqué.

## Validation

1. Recharger la page Synthèse de l'exploration DEVIAT (Charente).
2. Re-poser la question au chatbot : il doit annoncer **38 espèces totales** (et non 77), avec faune/flore/champignons cohérents.
3. Vérifier sur 1-2 autres explorations que les totaux RPC ≈ totaux affichés dans la Synthèse.

## Pourquoi pas (seulement) un snapshot d'écran ?

Publier `visibleData` via `useChatTabSnapshot` depuis la Synthèse fonctionnerait *quand l'onglet est ouvert*, mais la Synthèse n'est pas toujours active quand on parle au chatbot. Corriger la RPC garantit la cohérence **en toutes circonstances** (onglet Carte, Apprendre, etc.) et reste la source de vérité partagée.
