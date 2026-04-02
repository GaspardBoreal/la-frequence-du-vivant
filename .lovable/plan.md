

## Corriger l'incohérence du compteur d'espèces entre Carte (30) et Empreinte (28)

### Cause racine

Deux calculs différents coexistent :

- **Empreinte** (`EventBiodiversityTab.tsx` ligne 132) : déduplique les espèces par `scientificName` via un `Map`, compte les **espèces uniques** → 28. C'est la valeur correcte.
- **Carte** (`ExplorationCarteTab.tsx` ligne 424) : affiche `bioSummary.totalSpecies` qui vient de `useExplorationBiodiversitySummary.ts` ligne 260 : `speciesByMarche.reduce((sum, m) => sum + m.speciesCount, 0)`. C'est la **somme brute** des `total_species` par marche — une espèce présente sur 2 marches est comptée 2 fois → 30.

### Correction

**Fichier** : `src/hooks/useExplorationBiodiversitySummary.ts`

Remplacer le calcul de `totalSpecies` (ligne 260) par le nombre d'espèces uniques déjà calculé dans `uniqueSpeciesMap` :

```tsx
// AVANT (somme brute des per-marche counts)
const totalSpecies = speciesByMarche.reduce((sum, m) => sum + m.speciesCount, 0);

// APRÈS (nombre d'espèces uniques, cohérent avec Empreinte)
const totalSpecies = uniqueSpeciesMap.size;
```

Ce `uniqueSpeciesMap` déduplique déjà par `scientificName` (lignes 100-140), c'est exactement la même logique que le `speciesMap` d'Empreinte. Le résultat sera 28 partout.

### Impact

- **Carte** : affichera 28 espèces (via `bioSummary.totalSpecies`)
- **Empreinte Synthèse** : déjà 28 (inchangé, calcul local)
- **Empreinte Taxons** : déjà 28 (inchangé, calcul local)
- Aucun autre fichier à modifier

