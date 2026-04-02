

## Tri par observations + affichage des photos dans Taxons observés

### Problemes identifies

1. **Tri** : `SpeciesExplorer` (ligne 143) trie les especes par ordre alphabetique (`commonName.localeCompare`). Les especes les plus observees ne remontent pas en haut.

2. **Photos** : `EnhancedSpeciesCard` affiche la photo uniquement si `species.photoData` est present. Or les donnees issues des snapshots n'incluent pas `photoData` — elles n'ont que `scientificName`, `kingdom`, `observations`. Le hook `useSpeciesPhoto` (qui interroge l'API iNaturalist) existe mais n'est pas appele dans `EnhancedSpeciesCard`. Seul le modal detail (`SpeciesGalleryDetailModal`) et `SpeciesCardWithPhoto` l'utilisent.

### Solution

**Fichier 1 : `src/components/biodiversity/SpeciesExplorer.tsx`**
- Ligne 143 : remplacer `.sort((a, b) => a.commonName.localeCompare(b.commonName))` par `.sort((a, b) => b.observations - a.observations)` pour trier par nombre d'observations decroissant.

**Fichier 2 : `src/components/audio/EnhancedSpeciesCard.tsx`**
- Ajouter le hook `useSpeciesPhoto` pour charger automatiquement la photo quand `species.photoData` est absent.
- Utiliser la photo retournee par le hook comme fallback si `species.photoData` n'existe pas.
- Supprimer les `console.log` de debug qui polluent la console.

### Detail technique

```tsx
// EnhancedSpeciesCard.tsx — ajout du hook photo
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';

// Dans le composant :
const shouldFetchPhoto = !species.photoData || species.photoData.source === 'placeholder';
const { data: fetchedPhoto } = useSpeciesPhoto(
  shouldFetchPhoto ? species.scientificName : undefined
);
const effectivePhoto = species.photoData || fetchedPhoto;

// Puis remplacer toutes les refs a species.photoData par effectivePhoto
```

### Resultat attendu
- Les especes les plus observees apparaissent en premier dans tous les onglets Taxons
- Chaque carte affiche la photo iNaturalist chargee dynamiquement
- Coherence visuelle avec l'onglet Vivant des marches individuelles

