

# Carte — Fond français + boutons zoom élégants

## Changements

### 1. Fond de carte en français

Remplacer le tile CARTO dark anglophone par **OpenStreetMap France** en version sombre. Utiliser le tile `https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png` qui affiche tous les noms de lieux en français. Appliquer un filtre CSS `filter: brightness(0.6) saturate(0.3)` sur le conteneur `.leaflet-tile-pane` pour conserver l'ambiance sombre "Forêt Émeraude" tout en ayant les labels français.

### 2. Boutons zoom custom

Ajouter un composant `ZoomControls` positionné en bas à droite de la carte (absolute, z-1000). Deux boutons glassmorphism empilés verticalement :
- **+** pour zoomer
- **−** pour dézoomer
- Style : `bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl` avec hover emerald
- Utilise `useMap()` pour appeler `map.zoomIn()` / `map.zoomOut()`

## Fichier impacté

| Fichier | Action |
|---|---|
| `src/components/community/exploration/ExplorationCarteTab.tsx` | Changer URL TileLayer + ajouter filtre CSS sombre + composant ZoomControls inline |

