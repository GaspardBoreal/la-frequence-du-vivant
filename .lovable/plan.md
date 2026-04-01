

## Ajouter les compteurs d'espèces aux filtres Taxons observés

### Objectif
Afficher le nombre d'espèces à côté de chaque filtre dans l'onglet "Taxons observés" (ex: `Faune (14)`), et masquer le nombre si celui-ci vaut 0. Cela garantit aussi la cohérence visuelle avec l'onglet Synthèse.

### Modification

**Fichier** : `src/components/community/EventBiodiversityTab.tsx`

**Zone** : Les boutons de filtre catégorie (lignes 242-262)

- Calculer un objet `categoryCounts` via `useMemo` qui mappe chaque `CategoryFilter` vers son nombre d'espèces (réutilisant `allSpecies` et la même logique kingdom que `stats`)
- Dans chaque bouton filtre, afficher `{cfg.label} ({count})` si `count > 0`, sinon uniquement `{cfg.label}`
- Les counts utilisent exactement la même source (`allSpecies`) que le reste, donc cohérence garantie avec Synthèse

### Détail technique
```tsx
const categoryCounts = useMemo(() => {
  const kingdomMap: Record<CategoryFilter, string | null> = {
    all: null, birds: 'Animalia', plants: 'Plantae', fungi: 'Fungi', others: 'Other'
  };
  const counts: Record<CategoryFilter, number> = { all: allSpecies.length, birds: 0, plants: 0, fungi: 0, others: 0 };
  allSpecies.forEach(sp => {
    if (sp.kingdom === 'Animalia') counts.birds++;
    else if (sp.kingdom === 'Plantae') counts.plants++;
    else if (sp.kingdom === 'Fungi') counts.fungi++;
    else counts.others++;
  });
  return counts;
}, [allSpecies]);

// Dans le bouton :
{cfg.label}{categoryCounts[cat] > 0 ? ` (${categoryCounts[cat]})` : ''}
```

