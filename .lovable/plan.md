# Fiabilisation définitive des vignettes espèces

## Constat sur la capture

Drawer "Lundi 22 Juin" (DEVIAT) : 5 espèces, **3 sans photo** (Painted Lady, Argus bleu, Mélanargie galathée) → fallback pictogramme **oiseau** alors que ce sont des **papillons**. Deux problèmes distincts :

1. **Photo manquante** → l'appel iNaturalist live depuis le navigateur a échoué/timeout/rate-limit, ou la recherche n'a pas trouvé le taxon. Aucune persistance : chaque client retente, le même utilisateur peut voir une photo aujourd'hui et pas demain.
2. **Picto incohérent** : `SpeciesThumb` mappe `kingdom = 'Animalia'` → `Bird`. Tout insecte/reptile/mollusque hérite donc d'un pictogramme oiseau.

## Cause racine

`src/hooks/useSpeciesPhoto.ts` interroge `api.inaturalist.org/v1/taxa` **à la volée, côté client, sans cache serveur**. Conséquences :
- Rate-limit iNat (60 req/min anonyme) → réponses vides en cas de drawer chargé.
- CORS / timeout réseau → silencieux (`return null`).
- Match fuzzy sur `q=` peut rendre une mauvaise espèce sans photo.
- Aucun fallback secondaire (GBIF, photo terrain manuelle).
- Aucun moyen pour un curateur de patcher une vignette manquante.

## Architecture cible — cache serveur durable

### 1. Table `public.species_thumb_cache` (nouvelle migration)

```text
scientific_name text PRIMARY KEY      -- normalisé NFD lower
photo_url        text
photo_attribution text                 -- "© Auteur / iNat CC-BY"
iconic_taxon     text                  -- Aves|Insecta|Plantae|Mammalia|Fungi|Reptilia|Amphibia|Mollusca|Arachnida|Actinopterygii|Other
kingdom          text
common_name_fr   text
common_name_en   text
source           text                  -- 'inaturalist' | 'gbif' | 'manual' | 'none'
miss_count       int DEFAULT 0         -- nb de tentatives infructueuses
resolved_at      timestamptz
created_at       timestamptz
```

- RLS : lecture publique (`anon`, `authenticated`), écriture uniquement via RPC SECURITY DEFINER (curateurs/admin) ou service_role (edge function).
- Index sur `(source, miss_count, resolved_at)` pour la re-résolution périodique.
- GRANTs : `SELECT` à anon/authenticated, `ALL` à service_role.

### 2. Edge function `resolve-species-thumb`

- Entrée : `{ scientific_names: string[] }` (batch jusqu'à 50).
- Pour chaque nom non présent en cache (ou en `source='none'` + résolu il y a >7j) :
  1. **iNat exact** : `/v1/taxa?q=...&rank=species,subspecies,genus` puis filtrage strict `name === scientificName`.
  2. **iNat fuzzy** : 1er résultat si aucun exact, **et seulement si `default_photo` non vide**.
  3. **GBIF** en fallback : `/v1/species/match` + `/v1/species/{key}/media` (vmcache pour Plantae/Fungi notamment).
  4. Sinon `source='none'`, `miss_count++`.
- Upsert atomique. Retourne les rows résolues + restantes.
- Limitée à 5 req/sec vers iNat (politesse + évite ban).

### 3. Edge function `backfill-species-thumb-cache` (one-shot)

- Walks `DISTINCT lower(unaccent(scientific_name))` depuis `biodiversity_snapshots ∪ marcheur_observations`.
- Appelle `resolve-species-thumb` par lots de 25.
- Logue progression. Idempotent.

### 4. Re-résolution périodique

- `pg_cron` hebdo : pour chaque ligne `source='none' AND miss_count < 5 AND resolved_at < now() - interval '7 days'`, ré-appelle `resolve-species-thumb`. Récupère les espèces récemment indexées par iNat.

### 5. Frontend — refonte `useSpeciesPhoto` → `useSpeciesThumb`

- Nouveau hook `useSpeciesThumbs(names: string[])` : 1 requête Supabase (`select * from species_thumb_cache where scientific_name = ANY($1)`).
- Pour les noms manquants : invoque `resolve-species-thumb` en arrière-plan (debounce 300 ms, batch) puis invalide la query.
- `SpeciesThumb` :
  - Lit `localPhoto` (photo terrain) → cache (`photo_url`) → pictogramme `iconic_taxon`.
  - Mapping iconique fin : `Insecta`/`Arachnida` → `Bug` 🪲, `Aves` → `Bird` 🐦, `Mammalia` → `Rabbit`, `Reptilia`/`Amphibia` → `Squirrel`/`Frog` Lucide, `Actinopterygii`/`Mollusca` → `Fish`, `Plantae` → `Sprout`/`TreePine`, `Fungi` → `Mushroom` (via `@lucide/lab` si manquant côté core), défaut → `Leaf`.
  - Pastille « iNat » conservée + tooltip avec `photo_attribution`.
  - État `isLoading` ⇒ skeleton shimmer (jamais d'icône oiseau pendant le fetch).

### 6. Onglet admin « Vignettes espèces » (léger)

- Liste des `source IN ('none','manual') OR miss_count > 0`.
- Bouton « Re-résoudre maintenant » (appelle l'edge function).
- Champ « URL photo manuelle » + attribution → RPC `upsert_species_thumb_manual` (curateurs uniquement, `source='manual'`).
- Compteur global « X espèces sans vignette » sur la dashboard admin Communauté.

## Effet pour l'utilisateur

- Les vignettes deviennent **stables** (servies depuis Supabase, pas iNat live).
- Aucune espèce ne montre plus de pictogramme erroné : un papillon est un 🪲, un poisson est un 🐟, etc.
- Une espèce nouvellement rencontrée déclenche **une seule** résolution serveur ; tous les marcheurs suivants la voient instantanément.
- Un curateur peut patcher une vignette manquante en 10 sec sans toucher au code.

## Hors scope

- Pas de modification du pipeline de classification éco-tags / FR names existants (réutilise les mêmes patterns : KB partagée + RPC + edge function).
- Pas de re-photos manuelles obligatoires : 100 % auto par défaut.
- Pas de changement aux RPC `get_exploration_species_count`, snapshots, etc.

## Fichiers concernés

- `supabase/migrations/<new>.sql` — table + RPC `upsert_species_thumb_manual` + grants + pg_cron.
- `supabase/functions/resolve-species-thumb/index.ts` — nouvelle edge function.
- `supabase/functions/backfill-species-thumb-cache/index.ts` — backfill one-shot.
- `src/hooks/useSpeciesThumb.ts` — nouveau (remplace `useSpeciesPhoto` côté cache).
- `src/hooks/useSpeciesPhoto.ts` — conservé en *thin wrapper* pour rétro-compat (lit la cache, déclenche resolve).
- `src/components/species/SpeciesThumb.tsx` — mapping iconique fin + skeleton.
- `src/pages/MarchesDuVivantAdmin*` — onglet « Vignettes espèces » (1 tab, ~150 lignes).

## Étapes d'exécution (ordre d'implémentation)

1. Migration table + RPC + grants.
2. Edge function `resolve-species-thumb`.
3. Refactor `SpeciesThumb` + nouveau hook `useSpeciesThumb` (mapping iconique inclus → la régression « papillon avec icône oiseau » disparaît immédiatement).
4. Backfill function + run sur production.
5. Onglet admin curation vignettes.
6. Cron pg_cron hebdo de re-résolution.
