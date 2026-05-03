# Correctif badge "Lire" dans la vue Marches (page Exploration)

## Diagnostic

La capture d'écran provient de `src/components/community/ExplorationMarcheurPage.tsx` (route `/marches-du-vivant/mon-espace/exploration/...`), pas du composant modal `MarcheDetailModal.tsx` qui a déjà été corrigé précédemment.

Dans `ExplorationMarcheurPage.tsx`, ligne 197, `tabCounts.lire` est codé en dur à `0`, donc aucun badge ne s'affiche sur l'onglet "Lire" même quand des descriptions existent.

## Correctif

Dans `src/components/community/ExplorationMarcheurPage.tsx`, après le hook `useMarcheurStats` (ligne 192) :

1. Ajouter une `useQuery` qui lit `descriptif_court` et `descriptif_long` de la table `marches` pour `activeMarcheId`, et compte combien sont non vides (0, 1 ou 2).
2. Utiliser ce résultat (`lireCount`) à la place du `0` codé en dur dans `tabCounts.lire`.

Logique identique à celle déjà déployée dans `MarcheDetailModal.tsx` — même `queryKey` (`['marche-descriptions-count', activeMarcheId]`) pour mutualiser le cache React Query entre la page et la modale.

## Fichier modifié

- `src/components/community/ExplorationMarcheurPage.tsx` (ajout d'environ 20 lignes autour de la ligne 192).

Aucune migration DB, aucun nouveau composant.