# Harmoniser la fiche espèce entre "Empreinte → Taxons observés" et "Apprendre → L'œil"

## Diagnostic

Deux régressions visuelles dans **Apprendre → L'œil** par rapport à **Empreinte → Taxons observés** :

### 1. Modal de détail vide (pas de photo)
`SpeciesDetailModal` lit l'image via `species.photos[selectedImageIndex]`. Or, dans `OeilCuration.handleSpeciesClick`, on construit le `BiodiversitySpecies` envoyé au modal **sans renseigner `photos[]` ni `photoData`**. La carte `CuratedSpeciesCard` a pourtant déjà résolu une URL via `useSpeciesPhoto(scientificName)` — mais cette URL reste prisonnière de la carte.

À l'inverse, `SpeciesExplorer` (vue Empreinte) passe au modal un `BiodiversitySpecies` complet (`photos`, `family`, `kingdom`) alimenté par `EnhancedSpeciesCard` qui enrichit `photoData` via le même hook iNaturalist.

### 2. Badge catégorie IA absent
Dans **L'œil**, le badge coloré (Emblématique, Parapluie, EEE, Auxiliaire, Protégée) n'apparaît que sur les cartes **épinglées** : le `footer` n'est rendu que si `isPinned` dans `OeilCuration > SpeciesGrid`. Conséquence : sur la vue *Suggestions IA* (copie 2), aucune catégorie n'est visible alors que la curation IA propose justement une `category`.

## Solution — factorisation et enrichissement

### A. `CuratedSpeciesCard.tsx`
- Remonter la photo résolue via une **prop `onClick(species, displayName, photos[])`** : la carte connaît déjà `species.imageUrl` + `photoData.photos` du hook `useSpeciesPhoto`.
- Toujours afficher un **badge catégorie en bas de la vignette** quand `curation?.category` est défini (suggestion IA OU sélection finale), en réutilisant le style `CATEGORIES` de `OeilCuration` (extrait dans un module partagé `curationCategories.ts`).
- Le `footer` (CategoryControl éditable) reste réservé aux curateurs sur les cartes épinglées.

### B. Nouveau module `src/components/community/insights/curation/curationCategories.ts`
Centralise `CATEGORIES`, `getCatStyle`, `getCatLabel` (actuellement dupliqués dans `OeilCuration` et `CategoryControl`) et un petit composant `<CategoryBadge value={cat} />` réutilisable carte + footer.

### C. `OeilCuration.tsx > handleSpeciesClick`
Recevoir `photos[]` depuis la carte et bâtir le `BiodiversitySpecies` complet attendu par le modal :

```ts
const handleSpeciesClick = (
  species: CuratedSpeciesItem,
  displayName: string,
  photos: string[],
) => {
  setSelectedSpecies({
    id: species.key,
    scientificName: species.scientificName || '',
    commonName: displayName,
    kingdom: mapKingdom(species.group),
    family: '',
    observations: species.count,
    lastSeen: '',
    source: 'inaturalist',
    attributions: [],
    photos,                                    // ← clé manquante
    photoData: photos[0]
      ? { url: photos[0], source: 'inaturalist', attribution: '' }
      : undefined,
  });
};
```

### D. Pré-charger la photo iNaturalist côté carte
Dans `CuratedSpeciesCard`, exposer `photos = species.imageUrl ? [species.imageUrl, ...(photoData?.photos ?? [])] : (photoData?.photos ?? [])` et le transmettre au `onClick` afin que le modal s'ouvre instantanément avec la même image que la vignette (pas de "Aucune photo disponible" pendant le fetch).

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/components/community/insights/curation/curationCategories.ts` | **créer** (CATEGORIES, getCatStyle, getCatLabel, CategoryBadge) |
| `src/components/community/insights/curation/CuratedSpeciesCard.tsx` | étendre `onClick` (ajout `photos`), afficher `<CategoryBadge>` en overlay si `curation?.category` |
| `src/components/community/insights/curation/OeilCuration.tsx` | importer depuis `curationCategories.ts`, passer `photos` dans `setSelectedSpecies` |
| `src/components/community/insights/curation/CategoryControl.tsx` | consommer `curationCategories.ts` (suppression duplication) |

## Résultat attendu

- Vue **L'œil → Suggestions IA** : chaque vignette affiche désormais le **badge catégorie IA** (Parapluie, EEE…) comme dans la copie 1.
- Clic sur la vignette : **photo haute résolution** affichée dans le modal (identique à Empreinte → Taxons observés copie 2 d'origine).
- Code de catégories **factorisé** dans un seul module → cohérence garantie entre L'œil et tout autre futur consommateur.
