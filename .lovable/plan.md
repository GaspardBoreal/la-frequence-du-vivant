## Ajustements Studio Fonds d'Écran

**A. CTA jamais au-dessus d'une image**

Fichier : `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`

- Dans chaque layout (Editorial, Organic, Diptyque, Constellation), la fonction de rendu calcule déjà les rectangles des photos (`photoRects: {x,y,w,h}[]`). Exposer ces rects au moment d'appeler `drawCommunityCta`.
- Modifier `drawCommunityCta(ctx, W, H, opts, photoRects)` : au lieu de positions fixes bas-gauche/droite, tester une liste de positions candidates (bas-gauche, bas-centre, bas-droite, haut-gauche, milieu-gauche selon variante) et retenir la première dont le rectangle CTA n'intersecte AUCUN `photoRect` (avec marge 12px). Fallback : réduire la largeur du CTA (mode compact 1 ligne) puis, en dernier recours, dessiner sur une bande noire pleine largeur en bas hors images.
- Même logique appliquée pour éviter chevauchement avec QR et signature (déjà positionnés bas-droite/bas-gauche selon variante).

**B. Supprimer la signature "Territoires en éveil · France - une mosaïque de marches"**

Fichier : `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`

- Retirer l'appel à `drawSignature` (ou équivalent) dans les 4 variantes. Conserver le petit label "Les Marches du Vivant" / "La Fréquence du Vivant" en titre et le QR code, mais supprimer la ligne secondaire "Territoires en éveil…".

**C. CTA coché par défaut**

Fichier : `src/components/wallpaper-studio/WallpaperStudio.tsx`

- Initial state `ctaEnabled` : passer de `false` à `true`.

Aucun changement DB ni edge function.
