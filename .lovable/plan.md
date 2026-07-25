## Problème

Dans **J'analyse › Étape 2 · Prélèvements**, la carte n'affiche ni les **polygones verts des parcelles enregistrées**, ni le **fond cadastre** par défaut. Résultat : on ne voit qu'un fond gris avec les pastilles A/B/C, alors que **Portrait › Cadastre** affiche les parcelles retenues en vert (SAVED_STYLE) et bascule sur le fond cadastre.

Vérifié dans `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx` :
- La liste `parcelles` est chargée via `useProprieteParcelles` mais elle n'est utilisée que pour calculer le centre/bounds — **les `p.geometry` ne sont jamais rendues** en `<GeoJSON>`.
- La `RichMap` est instanciée sans `initialStyle="cadastre"`, alors que `PortraitCadastre` la passe (fond cadastre par défaut).

## Correctif ciblé (un seul fichier)

`src/components/propriete/analyze/blocks/SamplesMapBlock.tsx`

1. Ajouter le style vert partagé (identique à `PortraitCadastre.SAVED_STYLE`) :
   ```
   color:#2f5d3a, weight:3, opacity:.95, fillColor:#2f5d3a, fillOpacity:.28
   ```
2. Rendre les polygones à l'intérieur de `<RichMap>` juste avant les `<Marker>` échantillons :
   ```tsx
   {parcelles.map((p) => p.geometry ? (
     <GeoJSON key={p.id} data={p.geometry as any} style={SAVED_STYLE} />
   ) : null)}
   ```
   (import de `GeoJSON` depuis `react-leaflet` à ajouter).
3. Passer `initialStyle="cadastre"` à `<RichMap>` pour que le fond soit le même que dans Portrait › Cadastre (parcelles alentours visibles en trame beige).
4. Étendre `bounds` : utiliser les **coordonnées réelles des polygones** (pas seulement les centroïdes) via `L.geoJSON(p.geometry).getBounds()` afin que la carte cadre correctement toute la propriété au premier affichage.
5. Ne rien changer d'autre : pas d'options météo, pas de rayons, pas de menu FAB — on garde la carte simple et focalisée sur les prélèvements comme aujourd'hui.

## Résultat attendu

La même vue verte des parcelles retenues et le même fond cadastre que dans Portrait › Cadastre, avec par-dessus les pastilles A/B/C draggables inchangées.