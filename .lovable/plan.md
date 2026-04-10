

## Corriger le filtre contributeur sur l'onglet Carte

### Probleme

`BioDivSubSection` passe un `mapContent` statique a `SpeciesExplorer` avec le dataset complet (`biodiversityData`). Le filtre contributeur vit dans le state interne de `SpeciesExplorer` mais n'est jamais transmis a la carte.

### Solution

Remplacer le pattern `mapContent` (ReactNode statique) par un **render prop** qui recoit les especes filtrees depuis `SpeciesExplorer`.

### Modifications

**1. `SpeciesExplorer.tsx`** -- Changer le type de `mapContent`

```ts
// Avant
mapContent?: React.ReactNode;

// Apres
mapContent?: React.ReactNode | ((filteredSpecies: BiodiversitySpecies[]) => React.ReactNode);
```

Dans le rendu du TabsContent "map", appeler le render prop avec `filteredSpecies` :

```tsx
{showMap && mapContent && (
  <TabsContent value="map" className="space-y-4">
    {typeof mapContent === 'function' ? mapContent(filteredSpecies) : mapContent}
  </TabsContent>
)}
```

**2. `BioDivSubSection.tsx`** -- Passer un render prop

```tsx
<SpeciesExplorer
  species={biodiversityData.species}
  showMap
  mapContent={(filteredSpecies) => (
    <div className="h-[600px]">
      <BiodiversityMap
        data={{ ...biodiversityData, species: filteredSpecies }}
        centerLat={marche.latitude}
        centerLon={marche.longitude}
      />
    </div>
  )}
/>
```

**3. `ExplorationBiodiversite.tsx`** -- Meme adaptation si BiodiversityMap y est aussi passe via mapContent (verification necessaire, meme pattern a appliquer).

### Resultat

Quand un marcheur selectionne "Gaspard Boreal" dans le filtre contributeur, la carte n'affiche que les observations rattachees a ce contributeur. Le filtre par categorie, source, et audio continue de fonctionner comme avant.

