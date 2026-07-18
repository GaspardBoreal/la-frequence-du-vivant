## Correctifs Studio Fond d'écran

### 1. QR code lisible
Dans `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` :
- Passer la taille du QR de `6%` à `~11%` du min(width, height) — un QR de ~140 px sur un 1280×800 est actuellement à ~48 px, ce qui rend le scan impossible.
- Augmenter la marge du QRCode (`margin: 2`) et générer à `qrSize * 3` pour piquer la netteté.
- Épaissir le padding blanc autour (de `0.08` à `0.14`) pour la zone de silence exigée par les scanners.
- Ajouter le `qrRect` élargi à la liste des zones à éviter par la signature meta et le CTA (déjà présent pour le CTA, à renforcer pour le bloc meta droit).

### 2. Signature quand un événement est sélectionné
Dans `drawSignature` du même fichier :
- Si `event?.title` existe → n'afficher **que** le titre de l'événement à droite (suppression de la date, commune, GPS).
- Sinon (mode "toute la Fréquence") → garder le comportement actuel (rien ou mentions génériques).
- Repositionner ce titre plus haut pour ne pas croiser le nouveau QR agrandi (baseY remonté quand `event` présent).

### Détails techniques
- `qrSize = Math.round(Math.min(width, height) * 0.11)`
- `QRCode.toDataURL(qrTarget, { margin: 2, errorCorrectionLevel: 'M', color: { dark: pal.ink, light: pal.paper }, width: qrSize * 3 })`
- `lines` dans `drawSignature` devient `event?.title ? [event.title] : []`.

Aucun autre écran impacté.