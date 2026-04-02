

## Corriger le compteur d'espèces dans le Carnet Vivant (17 → 21)

### Cause racine

`useMarcheCollectedData.ts` (ligne 66-73) calcule `species_count` par **proximité GPS** : il cherche le snapshot le plus proche des coordonnées du `marche_event`. Il trouve le snapshot de "Deviat une maison pour vivre" (17 espèces) car c'est le point le plus proche.

Mais le `marche_event` "DEVIAT première découverte" est lié à l'exploration `607a0ae3...` qui contient **3 marches** avec 17+8+5 = 30 espèces brutes, soit **21 espèces uniques** après dédoublonnage par `scientificName`.

L'Empreinte et la Carte utilisent `useExplorationBiodiversitySummary` qui déduplique correctement → 21.

### Correction

**Fichier** : `src/hooks/useMarcheCollectedData.ts`

Quand un `marche_event` a un `exploration_id`, le species_count doit être calculé au niveau exploration (dédupliqué), pas par proximité GPS.

Logique modifiée :
1. Grouper les events par `exploration_id`
2. Pour chaque exploration : récupérer tous les `marche_id` via `exploration_marches`, puis tous les `biodiversity_snapshots`, puis dédupliquer les espèces par `scientificName` dans `species_data`
3. Affecter le même `species_count` (exploration-level) à tous les events de cette exploration

Le matching par proximité GPS (lignes 64-75) reste en fallback pour les events sans `exploration_id`.

### Détail technique

```text
AVANT (par proximité GPS) :
  marche_event(lat,lng) → snapshot le plus proche → total_species = 17

APRÈS (par exploration) :
  marche_event.exploration_id → exploration_marches → biodiversity_snapshots
    → species_data dédupliqué par scientificName → count = 21
```

### Impact

- Carnet Vivant : affichera 21 espèces (cohérent avec Empreinte et Carte)
- Aucun autre fichier modifié
- Le fallback proximité reste pour les events sans exploration

