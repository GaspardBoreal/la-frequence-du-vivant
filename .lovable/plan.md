## Objectif
Rendre le CTA « Rejoignez la communauté des Marcheurs du Vivant » parfaitement lisible et élégant sur toutes les variantes (Organic, Editorial, Diptyque, Constellation) et tous formats (paysage, portrait mobile, ultra-wide).

## Diagnostic
Dans `wallpaperCanvas.ts > drawCommunityCta` :
- Le texte est posé sans fond, à ~82 % d'opacité doré, souvent sur une photo ou zone claire → contraste insuffisant.
- La taille (h × 0.018) devient minuscule en paysage et se chevauche avec la signature bottom (`drawSignature`, panel h × 0.13).
- Aligné à droite juste à gauche du QR → collision fréquente avec le bloc meta droit de la signature.
- Aucun padding de sécurité, pas de plaque de fond, pas de scaling par variante.

## Correctifs (fichier unique : `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`)

### 1. Refonte de `drawCommunityCta`
- **Pilule/plaque de fond** : rectangle arrondi semi-transparent noir (`rgba(10,8,4,0.55)`) avec bordure dorée 1px `rgba(232,192,122,0.35)` + léger blur d'ombre → garantit le contraste sur n'importe quelle photo.
- **Typo plus généreuse** : `ctaSize = max(14px, h × 0.022)` (au lieu de 0.018) ; sous-titre `max(11px, h × 0.014)`.
- **Couleurs** : titre en `#f5e6c8` opacité 1.0 (paper doré chaud), sous-titre `rgba(245,230,200,0.85)`.
- **Petit pictogramme feuille/point doré** à gauche du texte pour ancrer visuellement.
- **Padding interne** : 20 × 12 px scalé.

### 2. Placement anti-collision
- Positionner la plaque **au-dessus du panel signature** (donc dans la zone `y = h - panelH - ctaHeight - marge`), centrée horizontalement OU alignée à gauche selon la variante :
  - Organic / Constellation : centrée horizontalement en bas.
  - Editorial : alignée à gauche sous le trait doré du titre (le titre étant en haut).
  - Diptyque : alignée à droite sous les cartes.
- Toujours laisser une marge de `w × 0.02` avec le QR (jamais dessous).

### 3. Adapter la signature pour laisser la place
- Si `ctaEnabled`, réduire légèrement `panelH` de 0.13 → 0.11 et remonter le CTA juste au-dessus, avec un espacement de `h × 0.015`.

### 4. Format portrait mobile (h > w)
- Empiler CTA + sous-titre + QR verticalement, texte centré, plaque pleine largeur `w × 0.86`.

## Résultat attendu
CTA toujours lisible (plaque sombre + texte crème + liseré doré), harmonieux avec la charte Jardin, sans jamais chevaucher le QR ni la signature, quelle que soit la variante ou la résolution.

## Fichier modifié
- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` (uniquement `drawCommunityCta` + petit ajustement dans `renderWallpaper` pour passer la variante/format et réduire le panel si CTA actif).
