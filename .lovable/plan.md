## Correctif z-index panneau « Repositionnement — aperçu local »

### Problème
Le panneau est rendu **à l'intérieur** du `<MapContainer>` Leaflet (lignes 1064‑1076 de `ExplorationCarteTab.tsx`). Leaflet crée son propre stacking context, donc le `z-[1100]` interne ne dépasse pas la barre de pied "13 étapes / ~7 km / 38 espèces" rendue plus bas dans le DOM.

### Correctif
Dans `src/components/cadastre/GpsEditOverlay.tsx` :
- Importer `createPortal` de `react-dom`.
- Sortir le `<div>` du panneau (lignes 73‑116) via `createPortal(..., document.body)` pour le détacher du stacking context Leaflet.
- Passer la classe en `fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto` (au‑dessus de la barre de pied à `z-[1000]`, légèrement remonté pour ne pas la masquer).
- Le `<Marker>` draggable reste dans le `MapContainer` (inchangé).

### Hors périmètre
Pas de changement de logique métier ni de styles du panneau — uniquement le portail + z-index.
