
## Aligner les galeries sur les filtres actifs

### Problème

Les onglets "Textes Littéraires", "Galerie Photos" et "Galerie Audio" reçoivent `marches` (la liste complète non filtrée), alors que l'onglet "Carte" reçoit correctement `filteredMarches`. Les galeries ne reflètent donc pas les filtres appliqués.

### Solution

Passer `filteredMarches` au lieu de `marches` aux 3 composants galerie, exactement comme c'est fait pour la carte.

### Modification

**Fichier : `src/pages/MarcheAdmin.tsx`** — lignes 208, 212, 216

```tsx
// Avant
<TextesLitterairesGalleryAdmin marches={marches} />
<PhotoGalleryAdmin marches={marches} />
<AudioGalleryAdmin marches={marches} />

// Après
<TextesLitterairesGalleryAdmin marches={filteredMarches} />
<PhotoGalleryAdmin marches={filteredMarches} />
<AudioGalleryAdmin marches={filteredMarches} />
```

3 lignes modifiées, aucun nouveau fichier.
