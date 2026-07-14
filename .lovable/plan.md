## Objectif

Sur les fiches jardin publiques (`/jardin/:slug`), le compteur du carrousel saisonnier doit exposer les **deux nombres** :

- **N vues cette saison** — comptage saisonnier actuel (déjà calculé côté carrousel).
- **T au total** — total unique d'espèces de l'exploration, **strictement identique** à celui affiché dans l'app Marcheurs (Carnet, Carte, Synthèse).

Le total doit venir de la **même source de vérité** que l'app Marcheurs : le hook `useExplorationSpeciesCount` (RPC `get_exploration_species_count`, fusion `biodiversity_snapshots ∪ marcheur_observations` avec dédup NFD).

## Diagnostic

- Aujourd'hui, `SeasonSpeciesCarousel` calcule `eligible.length` à partir de `get_exploration_species_pool` filtré sur les mois de la saison. C'est pour ça que DEVIAT affiche 108 (été) au lieu de 215 (total marcheur), et que les écarts varient selon la répartition temporelle des observations.
- `useExplorationSpeciesCount` est déjà le canal unifié utilisé partout côté marcheur — on le branche tel quel, aucune duplication de logique.

## Changements

### 1. `src/components/immersive-garden/SeasonSpeciesCarousel.tsx`

- Importer `useExplorationSpeciesCount` depuis `@/hooks/useExplorationSpeciesCount`.
- Appeler `useExplorationSpeciesCount(explorationId)` en tête du composant.
- Remplacer le bloc compteur actuel :

```text
{currentPage + 1} / {totalPages}  ·  {eligible.length} espèces
```

par :

```text
{currentPage + 1} / {totalPages}
·  {eligible.length} vues en {SEASON_LABEL[season]}
·  {totalExploration} au total
```

  - `totalExploration = speciesCountQ.data?.total ?? eligible.length` (fallback prudent tant que la RPC charge).
  - Garder la typographie/hiérarchie existante (`text-[#f4ecd4]/60`, séparateurs `·`).
- Afficher le total même quand `totalPages === 1` (petit bandeau compact sous la grille) pour que le nombre canonique soit toujours visible, y compris sur les petites explorations où la pagination est masquée.

### 2. Aucune autre modification

- Pas de changement de RPC, pas de migration.
- Pas de touche au filtre saisonnier (le carrousel continue de ne montrer que les espèces observées dans la saison courante — c'est intentionnel côté design).
- Aucune modification des pages/hooks de l'app Marcheurs.

## Vérification

- Playwright sur `/jardin/<slug-DEVIAT>` : screenshot du compteur, confirmer format `X vues en <saison> · 215 au total`.
- Comparer visuellement avec la valeur du Carnet marcheur pour la même exploration (déjà 215).
- Vérifier aussi sur Patio ISEG (attendu 22) et Fleurs de Bobo (attendu 25).
- Confirmer qu'aucune régression de mise en page n'apparaît sur mobile (le compteur reste sur une ligne ou wrap proprement).

## Détails techniques

- `useExplorationSpeciesCount` respecte déjà `staleTime: 30s` + invalidation react-query ; pas besoin d'activer `realtime` sur cette vue publique.
- Le hook renvoie `{ total, by_kingdom, by_source, species[] }` — on n'utilise ici que `total`.
- Fallback UI : si `speciesCountQ.isLoading`, on affiche `eligible.length` seul pour éviter un "0 au total" temporaire.
