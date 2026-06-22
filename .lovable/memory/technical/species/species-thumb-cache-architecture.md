---
name: Species thumbnail cache
description: Cache serveur species_thumb_cache + edge resolve-species-thumb fiabilise les vignettes SpeciesThumb (iNat → GBIF → picto iconic_taxon fin)
type: feature
---

# Vignettes espèces fiabilisées

## Problème historique
`useSpeciesPhoto` interrogeait `api.inaturalist.org/v1/taxa` live depuis le navigateur. Rate-limit / CORS / match fuzzy → vignettes manquantes aléatoires. Fallback kingdom `Animalia` → icône `Bird` même pour insectes/reptiles.

## Architecture
- **Table `public.species_thumb_cache`** (PK `scientific_name` lower) : `photo_url`, `photo_attribution`, `iconic_taxon`, `kingdom`, `common_name_fr/en`, `source` (`inaturalist|gbif|manual|none`), `miss_count`, `resolved_at`. RLS lecture publique, écritures via service_role ou RPC `upsert_species_thumb_manual` (curateurs ambassadeur/sentinelle/admin).
- **RPC `get_species_thumbs(_names text[])`** : lecture batch utilisée par `useSpeciesThumbs`.
- **Edge `resolve-species-thumb`** : input `{ scientific_names: string[] }` (max 50). Cascade iNat exact → iNat fuzzy avec photo → GBIF. Upsert + `miss_count++` si échec. Skip si row `photo_url` OK ou `miss_count>=5` ou `resolved_at < 7j`.
- **Edge `backfill-species-thumb-cache`** : parcourt `biodiversity_snapshots ∪ marcheur_observations`, appelle resolve par lots de 25.

## Front
- **`useSpeciesThumbs(names[])`** : 1 RPC batch + déclenche en arrière-plan (debounce 350 ms, pool global) `resolve-species-thumb` pour les manquantes, puis invalide `['species-thumb-batch']`.
- **`useSpeciesThumb(name)`** : wrapper single.
- **`useSpeciesPhoto`** : conservé en thin-wrapper sur `useSpeciesThumb` pour rétro-compat (forme `{photos, kingdom, commonName}`).
- **`<SpeciesThumb />`** : cascade `localPhoto → cache.photo_url → picto iconic_taxon fin`. Mapping : Aves=Bird, Mammalia=Rabbit, Insecta=Bug, Arachnida=Bug, Reptilia=Squirrel, Amphibia=PawPrint, Actinopterygii/Chondrichthyes=Fish, Mollusca=Shell, Plantae=TreePine, Fungi=Sprout. Pastille `iNat|GBIF|Manuel` avec tooltip attribution.

## Curation
RPC `upsert_species_thumb_manual(_scientific_name, _photo_url, _photo_attribution?, _common_name_fr?, _iconic_taxon?, _kingdom?)` → source='manual'. Permet à un curateur de patcher une vignette en 10 sec sans toucher au code.

## Important
- Ne jamais appeler iNat depuis le client : passer par `useSpeciesThumb` / `useSpeciesThumbs`.
- Le hook batch déduplique et débounce globalement (pool `pendingResolve`), donc plusieurs composants montés simultanément n'envoient qu'un seul appel edge.
