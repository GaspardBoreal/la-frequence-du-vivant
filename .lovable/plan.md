
# Unification du comptage d'espèces par exploration

## Problème

Trois vues d'une même exploration affichent trois sources de vérité différentes :

- **Carnet** (104) : dédup `scientificName` lowercase, snapshots ∪ marcheur_observations
- **Carte / Synthèse** (101) : dédup hybride `commonName || scientificName` (provoque collisions)
- **Chatbot / Top species** : encore une autre RPC

Aucune mise à jour automatique fiable lorsqu'un marcheur ajoute une observation ou qu'un snapshot iNat est resynchronisé.

## Solution

Une **source de vérité unique côté DB** (RPC) + un **hook React wrapper** réutilisé partout, avec invalidation react-query ciblée + abonnement Realtime en filet de sécurité.

### 1. RPC SQL `get_exploration_species_count(exploration_id uuid)`

`SECURITY DEFINER`, `STABLE`, retourne :

```text
{
  total: int,
  by_kingdom: { animalia, plantae, fungi, others },
  by_source: { snapshots_only, marcheur_only, both },
  species: jsonb  -- liste compacte [{ sci, kingdom, count, sources[] }]
}
```

Logique :

- Lit `exploration_marches` → `marche_ids`
- Snapshots : ne garde que le plus récent par `marche_id` (latéral `DISTINCT ON`), aplatit `species_data` via `jsonb_array_elements`
- Marcheur : `marcheur_observations` filtrés sur les mêmes `marche_ids`
- Clé canonique : `lower(unaccent(trim(scientific_name)))` (NFD côté SQL via extension `unaccent` déjà installée)
- Union via `GROUP BY` sur la clé canonique
- Royaume : prend la valeur non-`Unknown` rencontrée la première (snapshot prioritaire)

### 2. Hook wrapper `useExplorationSpeciesCount(explorationId)`

- `queryKey: ['exploration-species-count', explorationId]`
- `staleTime: 30s`, `gcTime: 5min`
- Appelle `supabase.rpc('get_exploration_species_count', { p_exploration_id })`
- Expose `{ total, byKingdom, bySource, species, isLoading }`

### 3. Fraîcheur automatique (les deux mécanismes)

**Invalidation react-query ciblée** dans toutes les mutations existantes :
- `useReorderMarcheurObservations`, ajout/suppression d'observation marcheur, edge functions de resync iNat (via canal Realtime)
- Helper `invalidateExplorationSpecies(qc, explorationId)`

**Abonnement Realtime** (montage du hook si activé via prop `realtime: true`) :
- `channel('exploration-species-' + id)`
- `.on('postgres_changes', { table: 'marcheur_observations', filter: 'marche_id=in.(...)' }, …)`
- `.on('postgres_changes', { table: 'biodiversity_snapshots', filter: 'marche_id=in.(...)' }, …)`
- Sur event → `queryClient.invalidateQueries(['exploration-species-count', id])`
- Activé uniquement sur Carnet/Carte/Synthèse de la même exploration (pas sur listes)

### 4. Câblage des 3 vues

| Vue | Fichier | Remplacement |
|---|---|---|
| Carnet | `useMarcheCollectedData` | Supprimer le calcul species_count interne, lire depuis le nouveau hook (clé par exploration_id) |
| Carte | `ExplorationCarteTab.tsx` | `bioSummary.totalSpecies` → `speciesCount.total` |
| Synthèse | même | idem |
| Chatbot | RPC `get_admin_entity_context` | À l'occasion : faire pointer le slice species vers la même RPC pour aligner |

`useExplorationBiodiversitySummary` continue d'exister pour `topSpecies`, `gradientData`, `allSpecies` (gallerie), mais **lit `total` depuis la nouvelle RPC** pour garantir cohérence avec les autres vues.

### 5. Garde-fous

- Test SQL : `SELECT (get_exploration_species_count('20dd3be8-…')).total;` doit valoir 104
- Logging console côté hook : `[species-count] exploration=X total=Y source=rpc`
- Memory update : nouvelle entrée `mem://technical/biodiversity/unified-species-count-rpc` documentant la RPC comme source unique

## Détails techniques

- **Migration** : 1 RPC `get_exploration_species_count` + GRANT EXECUTE TO authenticated, anon
- **Pas de schema change** sur les tables existantes
- **Realtime** : tables `marcheur_observations` et `biodiversity_snapshots` doivent être dans `supabase_realtime` publication (à vérifier, ajouter si absent)
- **Coût** : 1 RPC remplace 3 requêtes parallèles côté Carte/Synthèse → gain perf
- **Fichiers touchés** : ~6 (migration, nouveau hook, 3 vues, 1 memory)
