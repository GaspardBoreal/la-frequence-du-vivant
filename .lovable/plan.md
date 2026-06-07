
## Diagnostic

La recherche globale "Buddleja de David" remonte une fiche espèce mais ne révèle que les marches issues de `marcheur_observations` (contributions manuelles).

Vérifié en base :

| Source | Marches distinctes où Buddleja davidii apparaît |
|---|---|
| `marcheur_observations` (utilisée par la recherche) | **3** — ROQUE GAGEAC + 2 points DEVIAT |
| `biodiversity_snapshots` (iNaturalist, ignorée) | **11** — 7 points DEVIAT, ROQUE GAGEAC, Paris Saint-Lazare, Poitiers, Ajaccio |

La RPC `public.search_global` (dernière version `20260606194825…`) construit la CTE `species_matches` **exclusivement** sur `marcheur_observations`. Les snapshots iNaturalist — qui constituent l'essentiel du fonds taxonomique de chaque marche — sont totalement invisibles pour la recherche.

Deux conséquences :

1. **Sous-représentation massive** : `marches_count` et `occurrences` n'agrègent que les contributions marcheurs validées. Pour Buddleja davidii : 3 au lieu de 11. La chip « Vue 3× · 3 marches » sous-estime gravement la présence réelle.
2. **`recent_contexts` tronqué à 3 et basé sur la même source** : la fiche déroulée n'affiche que ROQUE GAGEAC (latest 2026-05-30) + 2 DEVIAT. Toutes les marches où l'espèce n'a été détectée que par iNaturalist (Paris, Poitiers, Ajaccio…) disparaissent — ce qui correspond exactement au ressenti utilisateur « il y en a à DEVIAT et au moins sur une autre marche ».

## Solution proposée

Aligner la recherche sur la même source unifiée que le reste de l'app (cf. mémoire `unified-species-count-rpc`) : **snapshots ∪ marcheur_observations** avec dédup stricte par `scientific_name × marche_id`.

### 1. Refonte de la CTE `species_matches` dans `search_global`

Construire un pool unifié des observations espèce ↔ marche :

```text
unified_obs (scientific_name, common_name_fr, kingdom, iconic_taxon, thumb_url,
             marche_id, observation_date, marcheur_id, source)
  ⟵ marcheur_observations  (source = 'marcheur')
  ⟵ jsonb_array_elements(biodiversity_snapshots.species_data)  (source = 'citizen')
       avec attributions[] expandées pour récupérer date + observerName
```

Puis `species_matches` agrège ce pool :
- `occurrences` = COUNT total dédupliqué (clé : inat_observation_id si présent, sinon `source|marche_id|date|observer`)
- `marches_count` = COUNT DISTINCT marche_id
- `marcheurs_count` = COUNT DISTINCT marcheur_id (uniquement source 'marcheur')
- `citizen_count` = COUNT source 'citizen' (nouveau, pour la chip)
- `last_observation_date` = MAX(date) toutes sources confondues

Le WHERE conserve les 4 voies de match actuelles (sciName, taxon_common_name_fr, species_translations.common_name_fr, alternative_names_fr) + trigram.

### 2. `recent_contexts` enrichi

- Source = unified_obs (donc inclut snapshots iNat)
- Limite passée de **3 → 8** marches
- Chaque contexte conserve son `source` (`marcheur` | `citizen`) pour permettre à l'UI d'afficher un badge discret
- Tri : MAX(observation_date) DESC, puis nombre d'occurrences DESC

### 3. UI `SearchResultCard.tsx` (changements minimes)

- La chip principale affiche `Vue N× · M marches` avec les compteurs unifiés (déjà câblée sur `meta.marches_count` / `meta.occurrences`).
- Dans le panneau déroulé, ajouter un petit badge cyan « iNat » à côté des contextes dont `source === 'citizen'` (cohérent avec la convention déjà en place dans `SpeciesThumb`, `SpeciesCardWithPhoto`).
- Aucun changement de route — les liens existants vers `/exploration/.../tab=biodiversite&sub=taxons&marcheId=` fonctionnent quelle que soit la source.

### 4. Périmètre

- Migration SQL : remplacement de `public.search_global` (CREATE OR REPLACE). Aucune autre RPC, aucune table modifiée.
- Pas de backfill, pas de changement d'ingestion (respecte la contrainte « ne pas polluer les marches avec des images non validées par la communauté iNat » — on lit simplement les snapshots déjà collectés).
- Pas de changement de l'API `useGlobalSearch` côté front.

## Détails techniques

**Performance** : `jsonb_array_elements(species_data)` sur l'ensemble de `biodiversity_snapshots` pourrait être coûteux. Atténuations :
- Pré-filtrer les snapshots via un `WHERE species_data::text ILIKE '%'||q||'%'` (filtre grossier mais ultra-rapide grâce au cast text) avant `jsonb_array_elements` ;
- Garder la limite `p_limit` (défaut 8) en sortie de `species_matches` ;
- Conserver `STABLE SECURITY DEFINER` et `search_path = public, extensions`.

**Dédup snapshots × marcheur_observations** : si une obs marcheur a un `inaturalist_observation_id` égal à l'attribution citizen, on garde la ligne marcheur (priorité éditoriale), cohérent avec la stratégie `useSpeciesMarches` (« upgrade en source marcheur »).

**Validation** : après migration, requête de contrôle attendue pour `Buddleja davidii` → `marches_count = 11`, `recent_contexts` listant DEVIAT (plusieurs points), ROQUE GAGEAC, Paris Saint-Lazare, Poitiers, Ajaccio.

## Hors périmètre (à proposer dans un second temps si besoin)

- Recherche full-text sur les attributions iNat (nom d'observateur citoyen).
- Lien « Voir les N marches » qui ouvrirait directement la fiche espèce inter-explorations (nécessite une page dédiée — n'existe pas encore).
