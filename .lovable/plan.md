## Problème

Dans **Apprendre → L'œil**, les chips de filtre par catégorie ("Parapluie (7)", "EEE (2)", etc.) affichent un compteur **global** calculé sur toutes les curations de la base, alors que la grille affichée est restreinte au périmètre de l'**onglet actif** (Sélection finale, Suggestions IA, Pool observé).

Exemple observé :
- Onglet "Sélection finale" (13 espèces épinglées)
- Filtre "Parapluie" affiche `(7)` → en réalité 3 cartes visibles
- Les 4 manquantes sont des suggestions IA Parapluie **non épinglées** : elles vivent dans l'onglet "Suggestions IA", pas dans "Sélection finale"

→ Décompte trompeur, l'utilisateur pense qu'il manque des données.

## Principe du correctif

**Règle métier :** un compteur de filtre doit toujours refléter le **résultat réel** qu'obtiendra l'utilisateur s'il clique dessus, dans le **contexte de l'onglet courant**.

Le compteur devient donc **contextuel à la vue active** :

| Onglet actif        | Pool de comptage                             |
|---------------------|----------------------------------------------|
| Sélection finale    | espèces épinglées (`pinnedSpecies`)          |
| Suggestions IA      | suggestions IA (`aiSuggestions`)             |
| Pool observé        | pool filtré par recherche (`filteredPool`)   |

Bonus : les chips à `0` deviennent visuellement « inactifs » (déjà géré par le style existant), donc l'utilisateur voit immédiatement quelles catégories sont pertinentes dans l'onglet courant.

## Implémentation

**Fichier unique :** `src/components/community/insights/curation/OeilCuration.tsx`

1. Remplacer le `useMemo` `categoryCounts` (l. 63-69) par un calcul dérivé de la **liste actuellement rendue** :
   - Construire un `currentItems: { curation? }[]` selon `view` (mêmes sources que celles passées aux `<SpeciesGrid />`, sans appliquer `applyCategoryFilter` pour ne pas créer un compteur circulaire)
   - Compter les `curation.category` sur ce `currentItems`
2. Réinitialiser `categoryFilter` à `null` lors du changement d'onglet (`setView`) pour éviter qu'un filtre actif sur "EEE" cache toute la grille en passant à un onglet où aucune EEE n'existe.
3. Aucun changement sur les composants `SpeciesGrid` ni sur les hooks de données.

## Pourquoi cette solution

- **Rigoureuse** : le compteur = `count(grid.filter(cat))`, invariant garanti par construction.
- **Explicable à l'utilisateur** : "le chiffre entre parenthèses = ce que tu verras si tu cliques, dans cet onglet".
- **Minimale** : un seul fichier, pas de schéma DB, pas de nouveau hook.
- **Cohérente** avec le compteur déjà affiché sur les onglets eux-mêmes (`Sélection finale (13)` est aussi contextuel à l'onglet).
