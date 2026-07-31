## Diagnostic (vérifié dans le code)

1. `PaletteStudio.tsx` passe `maxZoom={22}` à `RichMap` — c'est le plafond dur : arrivé à 22, les boutons + et la molette ne font plus rien.
2. `PaletteStudio.tsx` passe `scrollWheelZoom={!drawGeom}` : **dès qu'un dessin est en cours, la molette est désactivée**. C'est exactement le moment où vous voulez zoomer pour tracer le massif.
3. Les tuiles s'arrêtent tôt en natif (`mapStyles.ts`) : satellite Esri `maxZoom: 19`, cadastre `19`, terrain `17`. Au-delà, Leaflet ré-échantillonne — d'où l'image grise/floue de la copie d'écran.

## Correctifs proposés

**1. Plafond de zoom porté à 24 (Atelier + cartes propriété)**
- `PaletteStudio.tsx` : `maxZoom={24}`.
- Alignement des autres cartes du parcours propriété (`ZonesMapBlock`, `SamplesMapBlock`, `RevealMapBlock`, `PortraitCadastre`) sur la même valeur pour éviter les écarts de comportement.

**2. Molette toujours active, même en mode dessin**
- `scrollWheelZoom` reste `true` pendant le dessin ; on garde le clic pour poser les sommets, la molette ne pose pas de point.
- Ajout de `zoomSnap={0.25}` / `zoomDelta={0.5}` sur le `MapContainer` de `RichMap` pour un zoom fin (paliers doux) au lieu des sauts entiers.

**3. Tuiles réellement plus fines au grand zoom**
- Satellite : passage à l'ortho IGN (Géoplateforme, natif jusqu'à z21) avec repli Esri si la tuile manque → image nette là où Esri décroche.
- `maxNativeZoom` explicite par style et `maxZoom` du calque relevé à 24, pour que l'upscale soit propre plutôt que gris.

**4. Repère d'échelle pour le tracé**
- Petit indicateur discret dans la barre carte de l'Atelier : niveau de zoom courant + échelle métrique (barre Leaflet `scale`), utile pour dimensionner un massif au mètre près.

## Détails techniques
- Fichiers touchés : `src/components/maps/RichMap.tsx`, `src/components/maps/DynamicTileLayer.tsx`, `src/components/maps/mapStyles.ts`, `src/components/propriete/palette/studio/PaletteStudio.tsx`, plus l'alignement `maxZoom` sur 4 cartes propriété.
- Aucune logique métier modifiée : uniquement configuration carte et rendu.
