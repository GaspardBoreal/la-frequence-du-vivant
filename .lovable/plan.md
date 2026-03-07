

# Légende interactive multi-sélection pour la carte

## Problème

La légende de la carte affiche les 5 niveaux (Silence, Murmure, Souffle, Chœur, Symphonie) mais ils ne sont pas cliquables. De plus, le filtre actuel (`filterLevel: number | null`) ne permet de sélectionner qu'un seul niveau à la fois — impossible de combiner Silence + Souffle par exemple.

## Solution

1. **Remplacer `filterLevel: number | null` par `activeFilters: Set<number>`** — vide = tout afficher, sinon affiche uniquement les niveaux sélectionnés. Gère toutes les combinaisons possibles.

2. **Transformer la légende de la carte en chips cliquables** — chaque niveau est un bouton pill avec un état actif/inactif. Design : fond coloré quand actif, fond grisé transparent quand inactif, transition smooth. Un bouton "Tous" pour réinitialiser.

3. **Adapter le SpectreSynthese** au même système multi-sélection (clic = toggle dans le Set).

4. **Appliquer le filtre partout** : liste paginée ET carte (opacité réduite pour les marqueurs filtrés, comme déjà fait mais avec le Set).

## Changements dans `DetecteurZonesBlanches.tsx`

- State : `filterLevel: number | null` → `activeFilters: Set<number>`
- `handleFilterLevel` → `toggleFilter(level)` : toggle un niveau dans le Set
- `filteredZones` : si Set vide → tout, sinon filtre par Set
- `SpectreSynthese` : accepte `activeFilters: Set<number>` au lieu de `activeFilter: number | null`, multi-clic
- Légende carte (lignes 398-409) : remplacée par des **chips interactives** avec :
  - Fond rempli de la couleur du niveau quand actif, bordure + texte coloré quand inactif
  - Compteur de zones entre parenthèses
  - Bouton "Tous" avec style distinct
  - Coins arrondis pill, micro-shadow au hover, transition 200ms
- Carte : `isFiltered` vérifie `activeFilters.size > 0 && !activeFilters.has(level)`

Un seul fichier modifié.

