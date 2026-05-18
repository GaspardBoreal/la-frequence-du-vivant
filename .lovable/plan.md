# Unification du compteur d'espèces

## Problème constaté

Sur la même exploration, 4 valeurs différentes s'affichent :

| Écran | Valeur | Pourquoi |
|---|---|---|
| Carte (bandeau bas) | **81** | Union snapshots iNat + `marcheur_observations`, dédup par `scientificName` |
| Synthèse (cards) | **73** | Snapshots iNat **uniquement** — ignore les observations marcheurs |
| Pouls du vivant (header courbe) | **73** | Snapshots iNat **uniquement** |
| Pouls du vivant (filtre "Toutes") | **81** | Union snapshots + marcheurs (cohérent avec Carte) |
| Indicateurs → Richesse spécifique | **56** | Sous-ensemble : uniquement les taxons au rang `species` strict |
| Indicateurs → individus | **80** | Compte d'**individus** fusionnés GPS ≤8m, pas d'espèces |

**Référence à conserver = 81** (union complète, dédup stricte par nom scientifique normalisé). C'est la seule valeur qui reflète la réalité de l'exploration (iNat + contributions marcheurs).

## Plan

### 1. Créer un hook unique `useUnifiedExplorationSpeciesPool`

Source de vérité unique réutilisant la logique de fusion existante de `EventBiodiversityTab.allSpeciesAsBiodiversity` (snapshots ∪ marcheur_observations, dédup NFD+lowercase sur `scientificName`).

Retourne :
- `totalSpecies` (= 81)
- `byKingdom` : `{ fauna, flora, fungi, other }`
- `speciesLevelOnly` (= 56, pour indices écologiques)
- `totalIndividuals` (= 80, pour fusion GPS)

### 2. Remplacer les sources divergentes

- **`EventBiodiversityTab.tsx`** (cards Synthèse, L211-233) → utiliser `pool.totalSpecies` + `pool.byKingdom` au lieu de calculer depuis snapshots seuls.
- **`BiodiversityEvolutionChart.tsx`** (header "73 espèces découvertes") → afficher `pool.totalSpecies`. Le graphe d'évolution garde sa courbe basée sur snapshots datés, mais le **total final affiché** sera aligné à 81.
- **Carte** + **filtre Pouls** : déjà à 81, aucun changement.

### 3. Clarifier l'onglet Indicateurs (RichnessTab)

Pour lever la confusion 56 vs 81 :
- Titre : "**56 espèces** identifiées au rang d'espèce (sur 81 taxons observés)"
- Sous-texte individus : "**80 individus** géolocalisés distincts (fusion GPS ≤8m)"

Aucun changement de calcul — uniquement la présentation pour montrer que 56 et 80 sont des **sous-mesures** de 81, jamais en compétition avec.

## Détails techniques

- Pas de migration SQL, pas de changement RLS.
- Pas de modification de `useExplorationBiodiversitySummary` (Carte) ni du calcul des indices.
- Logique de dédup réutilisée telle quelle (NFD + lowercase + trim).
- Hook placé dans `src/hooks/community/exploration/`.

## Résultat attendu

Carte = Synthèse = Pouls header = Pouls filtre = **81 espèces**.
Indicateurs explique clairement que 56 et 80 sont des lectures écologiques restreintes.
