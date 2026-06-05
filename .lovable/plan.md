# Analyse — pourquoi 4 chiffres différents sur la même marche

## 1. Vérité terrain (audit BDD, marche `01e41155…`, rayon=50 m)

| Source | Volume | Détail |
|---|---|---|
| `biodiversity_snapshots` | 1 snapshot du 30/05/2026, **71 espèces, rayon de collecte 500 m** | 6 espèces seulement ont une attribution iNat à GPS exact ≤ 50 m du centre marche |
| `marcheur_observations` | 8 lignes | 7 obs Victor Boixeda le **29/05/2026** dans le rayon (6 espèces distinctes) + 1 obs 22/05 hors rayon |
| Espèces uniques fusion ∪ rayon 50 m | **6** (Bambusoideae, Fatsia japonica, Geranium sanguineum, Magnoliopsida, Aucuba japonica, Parthenocissus tricuspidata) | identique côté snapshot ET côté Victor → c'est exactement le pool « vrai » |

## 2. Pourquoi 4 chiffres différents

| Écran | Chiffre | Pipeline | Comportement |
|---|---|---|---|
| Carte | **6 espèces** | RPC `get_exploration_species_count` (rayon strict 50 m) | ✅ correct |
| Synthèse → Espèces totales | **6** | même RPC | ✅ correct |
| Apprendre → Pool observé | **6** | `useExplorationSpeciesPool` (mêmes règles) | ✅ correct |
| Marches → liste | **10** | `EventBiodiversityTab` : fusion snapshots ∪ marcheur_observations **+ une source iNat additionnelle** non passée par le même filtre (cartes datées 04/06/2026 : Fourmis, Cloporte, Houx, Lierre — absentes de la BDD au moment de l'audit) | ❌ divergent |
| Pouls du vivant (Taxons observés) | 6 espèces **uniquement sur 29/05** | bucketing par `marcheur_observations.observation_date` seulement | ❌ ignore `attributions[].date` du snapshot |

### Cause racine #1 — incohérence de filtre radius

La RPC `get_exploration_species_count` est **stricte** : pour qu'une espèce du snapshot compte, il faut soit une attribution iNat GPS-exacte ≤ 50 m, soit (fallback legacy) un snapshot collecté à un rayon ≤ rayon marche. Or ici snapshot_radius=500 m > marche.radius=50 m → fallback désactivé. C'est ce qu'on veut.

Mais le composant `Marches`/`EventBiodiversityTab` agrège côté client une **3e source** (un hook live iNat ou un cache stale) qui n'applique pas ce même filtre. D'où +4 espèces fantômes.

### Cause racine #2 — courbe Pouls du vivant aveugle aux attributions

Le graphique « 6 espèces découvertes depuis le 29 mai 2026 » bucketise uniquement sur `marcheur_observations.observation_date`. Les attributions iNat à l'intérieur du snapshot (avec `attributions[i].date`) ne sont pas projetées sur l'axe temporel → toute observation iNat antérieure est invisible et toute la masse s'écrase sur 29/05. C'est **grave** parce que ça cache l'historicité réelle et fait croire que Victor est le seul observateur d'une date unique.

### Cause racine #3 — sémantique « 04/06/2026 »

Les cartes datées 04/06 dans l'onglet Marches ne sont **traçables dans aucune ligne BDD actuelle** (snapshot unique au 30/05, marcheur_observations max au 29/05). Trois hypothèses, à confirmer :
- (a) cache React Query stale d'un fetch live iNat antérieur,
- (b) trigger d'attribution iNat qui aurait inséré des lignes puis été rollback,
- (c) hook tiers (probablement `useMarcheurInatProfile` / live API iNat).

## 3. Correctif robuste proposé

### A. Source unique de vérité — verrouiller toutes les vues sur la RPC

1. **`EventBiodiversityTab`** : supprimer la fusion client snapshots+marcheur_obs+source tierce. Remplacer par un nouvel RPC `get_exploration_species_pool(p_exploration_id)` qui retourne, pour CHAQUE espèce unique passée par le même filtre que `get_exploration_species_count` :
   ```
   { sci, common, kingdom, family, source[], observations,
     attributions[], last_seen, photos[] }
   ```
   La RPC fusionne snapshots ∪ marcheur_observations avec exactement la même règle radius/GPS, et déduplique par `lower(unaccent(sci))`.
2. `useExplorationSpeciesPool` (Apprendre) consomme la même RPC → garantie d'égalité stricte.
3. Si Marches doit afficher la liste iNat **élargie** (rayon snapshot, pas rayon marche), le rendre **explicite** : 2e onglet « Voisinage iNat 500 m » avec un compteur séparé et un disclaimer, jamais mélangé au compteur officiel.

### B. Refonte du « Pouls du vivant »

Nouvelle RPC `get_exploration_species_timeline(p_exploration_id)` qui :
- déplie `attributions[].date` du snapshot (filtrées radius) + `observation_date` de marcheur_observations,
- bucketise par jour,
- retourne `{ date, new_species, cumulative_species }`.

Effet : la courbe montrera les vraies dates iNat (ex. 22/05, 29/05, 04/06…) au lieu d'un pic unique trompeur.

### C. Garde-fou « cohérence »

1. Hook diagnostique `useExplorationCountCoherence(explorationId)` qui appelle RPC + recomptes locaux et logge en console + Sentry si écart > 0. Activé en dev et en admin.
2. Test SQL d'invariance dans `supabase/tests/` : pour 5 marches échantillon, RPC = recompte naïf SQL.
3. Banner admin si écart détecté.

### D. Purge des fantômes 04/06

- Identifier la source réelle des 4 cartes via console réseau (à faire après passage en build mode : ouvrir l'onglet Marches en preview, filtrer les requêtes, comparer aux RPC autorisées).
- Si cache stale → invalidate clé `event-biodiversity-*` au mount du tab.
- Si hook tiers live iNat → soit supprimer, soit déplacer derrière le 2e onglet « Voisinage iNat ».

### E. Documentation & UX

- Sous chaque compteur, micro-tooltip : « 6 espèces — fusion observations marcheurs ∪ iNat dans le rayon **50 m** ».
- Sous le pool « Voisinage iNat » : « 71 espèces signalées par iNaturalist dans un rayon de 500 m, sans filtrage strict ».

## 4. Détails techniques

```text
public.get_exploration_species_pool(p_exploration_id uuid)
  RETURNS TABLE(
    key text, scientific_name text, common_name text,
    kingdom text, family text,
    in_snapshot bool, in_marcheur bool,
    observations int,
    first_seen date, last_seen date,
    photos jsonb,        -- top 3 URLs ordonnées par priorité marcheur>iNat
    attributions jsonb   -- déjà dédupliquées par originalUrl
  )

public.get_exploration_species_timeline(p_exploration_id uuid)
  RETURNS TABLE(
    bucket_date date,
    new_species int,
    cumulative_species int,
    source_breakdown jsonb  -- { marcheur: n, inat: n }
  )
```

Les deux RPC partagent la même CTE `marche_ctx` + `filtered_attributions` que la RPC compteur actuelle, garantissant l'égalité par construction.

Migrations + refactor frontend : ~6 fichiers (`EventBiodiversityTab.tsx`, `useExplorationSpeciesPool.ts`, hook timeline du Pouls, nouvelles RPC, diagnostique).

## 5. Hors scope

- Pas de modification de la collecte (Edge Functions iNat) — uniquement lecture/restitution.
- Pas de changement de l'algorithme biogéographie POWO/GBIF (audit séparé déjà livré).
