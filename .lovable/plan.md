

## Corriger les compteurs sur la carte + visibilité des infobulles

### Problème 1 — Compteur toujours à 0

Dans `SpeciesMiniMap.tsx`, quand `allEventMarches` est fourni, le composant itère sur ces points qui ont tous `observationCount: 0` (ligne 102 de `EventBiodiversityTab.tsx`). Le check `isObserved` fonctionne (il utilise les IDs de `marches`), mais le compteur affiché vient de `allEventMarches` au lieu de `marches`.

**Correction** dans `SpeciesMiniMap.tsx` :
- Créer un `Map<marcheId, observationCount>` à partir du prop `marches` (les marches observées avec les bons compteurs)
- Lors du rendu, si `isObserved`, récupérer le count depuis ce Map au lieu de `marche.observationCount`

```tsx
const observedMarcheMap = useMemo(() => {
  const map = new Map<string, number>();
  marches.forEach(m => map.set(m.marcheId, m.observationCount));
  return map;
}, [marches]);

// Dans le rendu :
const obsCount = observedMarcheMap.get(marche.marcheId) || 0;
// Utiliser obsCount pour le radius ET le tooltip
```

### Problème 2 — Infobulles coupées par les bords

Les tooltips Leaflet avec `direction="top"` sont coupées quand un point est proche du bord de la carte (visible sur les copies). Le container a `overflow: hidden` et la tooltip déborde.

**Correction** dans `SpeciesMiniMap.tsx` :
- Remplacer `Tooltip` par `Popup` de react-leaflet, qui bénéficie nativement du `autoPan` (la carte se décale pour montrer le popup)
- Ou bien : garder `Tooltip` mais ajouter `direction="auto"` (Leaflet choisit automatiquement la direction) et ajouter du CSS pour que le tooltip ne soit pas clippé : `.species-minimap .leaflet-tooltip-pane { overflow: visible !important; }`

Approche retenue : `Tooltip` avec `direction="auto"` + CSS anti-clip. Plus léger qu'un Popup, pas de changement d'interaction.

### Fichier modifié

**`src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`** uniquement :
1. Créer `observedMarcheMap` pour résoudre les compteurs corrects
2. Utiliser `obsCount` du map pour le radius et le tooltip
3. Passer `direction="auto"` sur les Tooltips
4. Ajouter CSS `.leaflet-tooltip-pane { overflow: visible }` et `.leaflet-tooltip { white-space: nowrap }`

### Résultat attendu
- Marche #10 avec 1 obs → tooltip affiche "1 obs."
- Marche #4 avec 4 obs → tooltip affiche "4 obs."
- Infobulles toujours visibles, jamais coupées par les bords

