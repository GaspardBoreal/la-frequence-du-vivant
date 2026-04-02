

## Corriger la cohérence des comptages + améliorer la carte

### Problème 1 — Comptage incohérent

- **Modal header** (ligne 234) affiche `species.count = 5` (correct, somme des `sp.observations` depuis les snapshots)
- **SpeciesMarchesTab** affiche `totalObservations = 2` (incorrect) car `useSpeciesMarches` utilise `matchingSpecies.length` (= 1 par marche) au lieu de sommer `sp.observations`

**Correction** dans `src/hooks/useSpeciesMarches.ts` ligne 109 :
```tsx
// AVANT
observationCount: matchingSpecies.length,

// APRÈS
observationCount: matchingSpecies.reduce((sum, sp: any) => sum + (sp.observations || 1), 0),
```

Cela alignera "5 observations sur 2 marches" dans le header ET dans la liste.

### Problème 2 — Carte mal centrée, pas de zoom

**Fichier** : `src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`

1. **Augmenter la hauteur** de la carte : `h-40` → `h-56` pour mieux voir les points
2. **Utiliser `useBounds`** : créer un composant interne `FitBounds` qui utilise `useMap()` de react-leaflet pour appeler `map.fitBounds(bounds, { padding })` automatiquement — même logique que l'onglet Carte principal
3. **Activer le zoom** : ajouter `zoomControl={true}` et positionner les boutons +/- avec un style sombre cohérent via CSS
4. **Activer le drag** : `dragging={true}` pour permettre l'exploration

### Fichiers modifiés

1. **`src/hooks/useSpeciesMarches.ts`** — corriger `observationCount` pour sommer `sp.observations`
2. **`src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`** — fitBounds dynamique, zoom controls, hauteur augmentée

### Résultat attendu

- Header modal : "5 observations sur 2 marches"
- Liste marches : "5 observations" total (1 + 4)
- Carte : tous les points visibles avec padding, boutons +/- élégants

