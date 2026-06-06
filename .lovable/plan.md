## Objectif
Rétablir les résultats de recherche (Clématite & co.) et diviser le temps de réponse perçu par ~5.

## 1. Fix bloquant : ambiguïté `id` dans `search_global`

La colonne `OUT id text` de `RETURNS TABLE` masque `marche_events.id`. Renommer toutes les colonnes OUT pour éviter toute collision future avec les tables scannées :

```
RETURNS TABLE (
  r_kind text, r_id text, r_title text, r_subtitle text,
  r_context text, r_score real, r_route text, r_meta jsonb
)
```

Le hook front (`useGlobalSearch.ts`) mappe déjà sur `kind/id/title/...` → on renomme les sorties via alias dans le `SELECT` final (`SELECT r_kind AS kind, r_id AS id, …`) **ou** plus simple : on garde les noms publics mais on **qualifie systématiquement** `marche_events.id = p_event_id`, idem partout où une table scannée a une colonne `id`, `title`, `kind`, etc. Option retenue : qualifier (moins invasif côté client).

## 2. Performance : pré-filtre + LIMIT par branche

Refonte de la RPC en gardant la même signature :

- **Pré-filtre rapide** : chaque branche fait d'abord un `WHERE col ILIKE '%q%' OR col % q` (utilise les index trigram), **avec un `LIMIT 50` interne**, puis seulement ensuite calcule le `similarity()` pour le ranking. Ça évite de scorer toute la table.
- **LIMIT par branche avant UNION** : `LIMIT p_limit * 2` sur chaque CTE → l'UNION final trie 12×6 = 72 lignes max au lieu de potentiellement des milliers.
- **`STABLE PARALLEL SAFE`** sur la fonction pour autoriser le parallélisme Postgres.
- **Index trigram garantis** (création si manquants, `IF NOT EXISTS`) :
  - `marcheur_observations` : `f_unaccent(lower(species_scientific_name))`, `f_unaccent(lower(taxon_common_name_fr))`
  - `marche_textes` : `f_unaccent(lower(titre))`
  - `event_testimonies` : `f_unaccent(lower(quote))`
  - `community_profiles` : `f_unaccent(lower(display_name))`
  - `marche_events` : `f_unaccent(lower(nom_marche))`
  - `exploration_curations` : `f_unaccent(lower(title))`

## 3. UX : feedback "recherche en cours" + distinction vide vs erreur

Côté front (`GlobalSearchOverlay.tsx`) :
- État `isFetching` → skeleton 3 cartes (au lieu du carré vide actuel pendant 800ms).
- État `error` (la RPC plante actuellement mais le hook avale l'erreur silencieusement) → bandeau "Une erreur est survenue, réessayez" au lieu de "Aucun résultat".
- Vérifier dans `useGlobalSearch.ts` que `throw error` remonte bien dans React Query (déjà OK), et brancher `error` dans l'overlay.

## 4. Validation

Test SQL direct :
```sql
SELECT kind, title, score FROM search_global('clématite', NULL, 8);
SELECT kind, title, score FROM search_global('clem', NULL, 8);
```
Doit retourner ≥ 1 espèce, et s'exécuter en < 300 ms (EXPLAIN ANALYZE pour confirmer usage des index trigram).

## Détails techniques

- **Migration unique** : `CREATE OR REPLACE FUNCTION public.search_global(...)` + `CREATE INDEX IF NOT EXISTS ... USING gin (... extensions.gin_trgm_ops)`.
- **Pas de breaking change** côté hook/composants : signature et colonnes de retour identiques.
- **Aucun changement** sur `FocusHalo`, `useFocusFromUrl`, `focusBus`, ni les composants déjà focusables.

## Fichiers touchés

1. `supabase/migrations/<new>.sql` — nouvelle version de `search_global` + index trigram manquants.
2. `src/components/search/GlobalSearchOverlay.tsx` — skeleton de chargement + affichage erreur.
3. (optionnel) `src/hooks/useGlobalSearch.ts` — exposer `error` si pas déjà fait.
