## Diagnostic

Deux fonctions calculent le nombre d'espèces d'une même marche mais avec des règles différentes :

- **Vue exploration (Synthèse) → 38 espèces**  
  Utilise la RPC canonique `get_exploration_species_count(exploration_id)` :
  - respecte le rayon per-marche (override marche > défaut exploration > 500 m),
  - filtre les attributions par Haversine,
  - déduplique par nom scientifique normalisé (NFD/unaccent/lower),
  - fusionne `biodiversity_snapshots` ∪ `marcheur_observations`.

- **Carte des Marches du Vivant → 184 espèces**  
  Utilise `get_marches_map_events()` qui fait :
  ```sql
  MAX(bs.total_species) FROM biodiversity_snapshots
  ```
  Aucun filtre rayon, aucune dedup alias, aucune fusion marcheur. Résultat gonflé (184 = total brut d'un snapshot iNat).

Bref : la carte lit le compteur brut du snapshot, l'exploration lit le compteur canonique dédupliqué. **La valeur juste est 38.**

Deux mémoires du projet imposent d'ailleurs cette RPC comme source unique :
- `mem://technical/biodiversity/unified-species-count-rpc` — "RPC `get_exploration_species_count` : source unique Carnet/Carte/Synthèse"
- `mem://technical/biodiversity/global-count-consistency-logic` — dedup stricte pour les stats

## Correction proposée

Factoriser sur la RPC canonique déjà existante (`get_exploration_species_count`) — pas de nouvelle fonction, pas de code frontend touché.

### Migration unique

Réécrire `public.get_marches_map_events()` pour que `species_count` provienne de la RPC canonique au niveau de chaque event :

```sql
COALESCE((
  (public.get_exploration_species_count(me.exploration_id) ->> 'total')::int
), 0) AS species_count
```

- Événements sans `exploration_id` → 0 (comme aujourd'hui).
- Le comptage reste per-exploration (cohérent avec le fait qu'un event affiche la biodiv de son exploration parente, comme dans la Synthèse). C'est exactement le nombre que voit l'utilisateur en ouvrant l'event.
- `get_carte_mdv_hero_stats()` continue de sommer `species_count` de cette RPC → devient automatiquement cohérent (plus de double compte artificiel).

### Impact

- Popup carte, `EventCard`, `ConstellationView`, filtre `minSpecies`, tailles de marqueurs → toutes ces surfaces consomment `species_count` du même champ, donc alignées d'un coup.
- Hero stats de la carte MdV : baisseront mécaniquement pour refléter la réalité dédupliquée. C'est le comportement souhaité par la mémoire "source unique".
- Zéro changement TSX.

### Perf

`get_exploration_species_count` est déjà `STABLE`. Appelé une fois par event dans le `SELECT`. Si les explorations sont peu nombreuses (cas actuel), OK. Sinon on peut envelopper dans un CTE `LATERAL` par exploration distincte pour ne l'exécuter qu'une fois par exploration :

```sql
WITH expl AS (
  SELECT DISTINCT exploration_id FROM public.marche_events WHERE exploration_id IS NOT NULL
),
expl_counts AS (
  SELECT exploration_id,
         (public.get_exploration_species_count(exploration_id) ->> 'total')::int AS species_count
  FROM expl
)
SELECT ..., COALESCE(ec.species_count, 0), ...
FROM public.marche_events me
LEFT JOIN public.explorations e ON e.id = me.exploration_id
LEFT JOIN expl_counts ec ON ec.exploration_id = me.exploration_id;
```

Je pars sur cette forme (une seule évaluation par exploration).

## Résumé

1. Migration : réécrit `get_marches_map_events()` pour utiliser `get_exploration_species_count` (CTE par exploration).
2. Aucune modification frontend.
3. Résultat : carte MdV et vue exploration afficheront **strictement le même nombre** (38 pour Château Boutinet).