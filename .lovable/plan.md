

## Corriger l'affichage vide des galeries Photos, Audio et Textes littéraires

### Diagnostic

Les 3 galeries (Photos, Audio, Textes) reçoivent `filteredMarches` comme source de données. Ce `filteredMarches` est contrôlé par les filtres globaux de l'onglet "Liste". Actuellement, les filtres réduisent la liste à seulement 2 marches (`7ec14756...` et `67890ed0...`) qui n'ont aucune photo, aucun audio et aucun texte en base.

**Données en base** : 241 photos, 51 audios, 52 textes répartis sur 27+ marches — les données existent, mais les galeries ne les voient pas car elles sont limitées aux marches filtrées.

**Problème de design** : les galeries ont déjà leurs propres filtres internes (par marche, par exploration, par tags, etc.). Appliquer en amont le filtre global de la liste crée une double restriction incohérente.

### Solution

Passer `marches` (toutes les marches, non filtrées) aux 3 galeries au lieu de `filteredMarches`.

### Modification

**Fichier : `src/pages/MarcheAdmin.tsx`**

Remplacer :
```tsx
<TextesLitterairesGalleryAdmin marches={filteredMarches} />
<PhotoGalleryAdmin marches={filteredMarches} />
<AudioGalleryAdmin marches={filteredMarches} />
```

Par :
```tsx
<TextesLitterairesGalleryAdmin marches={marches} />
<PhotoGalleryAdmin marches={marches} />
<AudioGalleryAdmin marches={marches} />
```

Les galeries utilisent déjà leurs propres sélecteurs "Marche" et "Exploration" en interne, donc aucune perte de fonctionnalité de filtrage.

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier (3 lignes) | `src/pages/MarcheAdmin.tsx` |

