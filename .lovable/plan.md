## Ajustements QR & signature

Dans `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` :

### 1. Espacement titre événement / QR
- Dans `drawSignature`, remonter davantage `metaBaseY` quand un événement est présent, en tenant compte de la nouvelle taille de QR (~11 % de min(w,h)) :
  `metaBaseY = panelY - Math.round(h * 0.05)` (au lieu de `panelY - smallSize * 1.8`).
- Ajouter aussi une marge droite supplémentaire si le titre est long : décaler `rightX` de `padX * 1.2` pour garantir un couloir visuel avec le QR.

### 2. QR sur fond noir
- Inverser les couleurs du QR : `dark: pal.paper` (crème/or clair pour les modules), `light: '#0b0b0b'` (fond noir profond).
- Remplacer le `ctx.fillStyle = pal.paper` du padding par un noir assorti (`'#0b0b0b'`), pour que la zone de silence reste noire et lisible.
- Conserver `errorCorrectionLevel: 'M'` et `margin: 2`.

Aucun autre écran ni composant modifié.