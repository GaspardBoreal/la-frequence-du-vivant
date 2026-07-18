## Objectif

Repositionner le titre de l'événement (nom de la marche) : le placer **sous** le QR code, avec son **bord droit aligné** sur le bord droit du QR code, et un petit espace vertical entre les deux pour la lisibilité.

## État actuel

Dans `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`, `drawSignature` calcule la baseline du titre à partir du **bas du QR** (alignement vertical avec le bas du QR), et le texte est placé à gauche du QR dans un « couloir » réservé. Résultat : titre **à côté** du QR, pas dessous.

## Changement proposé

Dans `drawSignature` (branche « événement sélectionné ») :

1. Mesurer la largeur du titre (avec ellipsis si trop long — max = largeur QR + marge raisonnable, sinon on borne à la largeur du canvas moins marges).
2. `textAlign = 'right'`.
3. `x = qrRect.x + qrRect.width` (bord droit du texte = bord droit du QR).
4. `y = qrRect.y + qrRect.height + gap + fontSize` (baseline sous le QR, avec `gap ≈ 14–18 px` selon échelle).
5. Conserver le halo/ombre existant pour la lisibilité sur fond sombre.
6. Si le titre dépasse à gauche du canvas (marches très longues), réduire la taille de police d'un cran puis tronquer avec `…`.

Aucun autre bloc n'est touché (CTA fusionné, wordmark, QR restent inchangés).

## Fichier concerné

- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` → `drawSignature`

## Question

Le titre pourra être **plus large que le QR** (le QR fait ~11% de la dimension min). Je propose de le laisser déborder **vers la gauche** uniquement (bord droit ancré sur le QR), avec troncature `…` seulement si ça touche la marge gauche du canvas. OK ? Ou tu préfères borner strictement à la largeur du QR (titres très courts uniquement, sinon `…`) ?
