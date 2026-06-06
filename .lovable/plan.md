# Recherche — inclure les pratiques emblématiques

## Diagnostic

Le RPC `search_global` contient la branche « practice » mais avec un filtre erroné :

```sql
WHERE c.source = 'main'        -- ❌ 'main' n'est pas une source
```

Les sources réelles dans `exploration_curations` sont `manual` et `ai` (260 + 11 lignes). Le mot-clé `main` désigne en réalité le **sens** (`sense = 'main'`, "La main" — les pratiques), pas la provenance. Résultat : **zéro pratique** ne remonte jamais dans la recherche, alors que la branche, le focus URL (`focus=practice:<id>`), la téléportation vers l'onglet *Apprendre* et la carte de résultat sont déjà en place.

Vérifié sur la pratique "Datation de l'âge des grands arbres (dendrochronologie)" :
- `id = 64d88f2c-…`, `exploration_id = 20dd3be8-…`, `source = manual`, `sense = main` (implicite), titre contient « dendro ».
- Recherche `dendro` ne la remonte pas → confirmé par la copie d'écran.

## Correctif

### 1. Migration : RPC `search_global`

Une seule modification fonctionnelle dans la CTE/UNION ALL "practice" :

- Remplacer `WHERE c.source = 'main'` par `WHERE c.sense = 'main'::curation_sense` afin de cibler les **pratiques** (sens « La main »).
- Élargir le matching : ajouter `category` aux champs ILIKE/similarity (déjà scoré, pas encore filtré) pour que des recherches sur la catégorie remontent aussi.
- Ajouter `sense`, `marcheur` (prénom + nom du créateur si dispo via `created_by → community_profiles`) et `thumb` (1er media) au `meta` pour enrichir la carte de résultat.
- Garder le scope événement existant (`v_exploration_id`).

La route reste : `/marches-du-vivant/mon-espace/exploration/<exploration_id>?focus=practice:<id>&tab=apprendre` — déjà gérée par `useFocusFromUrl` + `MainCuration` (qui pose `data-focus-id="practice:<id>"`).

### 2. Front — `SearchResultCard` (kind=practice)

Aujourd'hui la carte n'affiche que `title` + `subtitle` (description tronquée) + `context` (nom exploration). Améliorations légères pour aligner sur l'esprit des pratiques emblématiques :

- Icône ambrée déjà OK (`Sparkles`).
- Si `meta.thumb_url` présent → afficher vignette carrée 56×56 à gauche (cohérent avec carte espèce).
- Sous-titre : préfixer par un chip « Pratique » + catégorie si présente.
- Conserver le clic existant qui déclenche la navigation `route`.

### 3. Hors-scope (non touché)

- Pas de changement aux autres branches (species, text, testimony, marcheur, event).
- Pas de changement au composant `HeaderSearchTrigger` ni à `GlobalSearchOverlay` (l'ordre `species → practice → text …` est déjà bon).
- Pas de modif des permissions : `exploration_curations` est déjà lisible par les rôles concernés via les RLS existantes.

## Fichiers impactés

1. `supabase/migrations/<timestamp>_search_global_fix_practices.sql` — `CREATE OR REPLACE FUNCTION search_global(…)` avec le filtre `c.sense = 'main'` + enrichissement meta + matching `category`.
2. `src/components/search/SearchResultCard.tsx` — affichage vignette + chip catégorie pour `kind='practice'`.

## Test après livraison

- Ouvrir l'événement DEVIAT, lancer la recherche `dendro` → la pratique « Datation de l'âge des grands arbres (dendrochronologie) » apparaît dans la section ✨ Pratiques.
- Clic → ouvre l'onglet *Apprendre*, *La main*, scroll/halo sur la carte de la pratique.
- Recherches `pic épeiche`, `Robert`, etc. continuent de fonctionner inchangées.
