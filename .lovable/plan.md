# Recherche « contient » dans l'Herbier du moment

## Objectif
Dans le tiroir « L'herbier du moment » de l'Atelier, ajouter un champ de recherche qui filtre les espèces affichées : une espèce reste visible si son nom français **ou** son nom scientifique **contient** le texte saisi.

## Comportement
- Champ de recherche placé entre l'en-tête (chips de filtres) et les onglets Flore / Faune / Autres.
- Recherche insensible à la casse **et aux accents** (ex. « aubepine » trouve « Aubépine »), sur les deux noms (français et scientifique).
- Le filtre s'applique dans l'onglet actif : les compteurs des onglets montrent les effectifs filtrés, comme la liste et la ligne de synthèse « X observations · Y espèces ».
- Croix d'effacement dans le champ ; recherche conservée tant que le tiroir reste ouvert, réinitialisée à la fermeture.
- Liste vide après recherche : message dédié (« Aucune espèce ne contient "…" ») sans proposer la réinitialisation des filtres carte (qui ne sont pas en cause).
- Exports (Copier, CSV, préremplissage IA) suivent la liste affichée : seules les espèces visibles après recherche sont exportées.

## Fichier modifié
- `src/components/propriete/palette/studio/HerbierDuMomentDrawer.tsx`
  - État local `query`, normalisation NFD (même fonction `norm` que `useVivantSpeciesRoster`, à dupliquer localement ou exporter depuis le hook).
  - Filtrage des `entries` par `label` (nom français via `frenchName`) et `scientificName`.
  - Petit champ de saisie stylé comme le reste du tiroir (bordures `--ds-line`, fond crème).
  - Aucun changement sur `useVivantSpeciesRoster`, la carte, ni les filtres existants.
