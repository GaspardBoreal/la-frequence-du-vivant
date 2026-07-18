## Objectif

Rendre les 4 propositions du Studio Fonds d'écran visuellement très distinctes, avec des compositions plus design que la mosaïque de ronds actuelle, des titres à taille variable, et un fond bien plus riche inspiré des pages Jardin (vagues dorées, particules, halo profond) que la communauté a adoré.

## Ce qui change

### 1. Quatre "variantes de composition" (au lieu de 4 seeds identiques)

Dans `wallpaperCanvas.ts`, introduire un paramètre `variant: 'organic' | 'editorial' | 'diptyque' | 'constellation'` et générer chaque proposition avec une variante distincte :

- **Organic** — la mosaïque de ronds actuelle (conservée, retravaillée).
- **Editorial** — 1 grande photo hero plein cadre (côté droit), colonne gauche avec bandeau typographique large, filet doré vertical, 2 petites vignettes rectangulaires arrondies en bas.
- **Diptyque** — split-screen 60/40 : hero rectangulaire à gauche (mask arrondi asymétrique), à droite trois cartes photo superposées légèrement rotées, titre centré en pied.
- **Constellation** — hero central petit, 4-6 satellites de tailles très variées reliés par des filets dorés courbes et points lumineux (inspiration Jardin/carte céleste).

Dans `WallpaperStudio.tsx` (`handleGenerate`), boucler sur les 4 variantes au lieu de 4 seeds neutres.

### 2. Taille du titre variable

Ajouter `titleScale: 'small' | 'medium' | 'large'` calculé par variante (Editorial → large, Diptyque → medium, Organic → small, Constellation → small). Adapter `wordmark` + panneau signature en conséquence (fontSize proportionnel à `height`, poids et couleur inchangés).

### 3. Fond inspiré des pages Jardin

Réutiliser le vocabulaire visuel du hero Jardin (fond sombre profond + vagues dorées verticales + particules + halo radial chaud). Nouvelle fonction `drawJardinBackdrop(ctx, w, h, palette, rng)` dans `wallpaperCanvas.ts` qui remplace `drawGradient` par défaut :

- Base sombre profonde (nuit dérivée de la palette, pas neutre).
- 4-6 courbes verticales dorées translucides (Bézier, épaisseur variable, opacité 0.08-0.18).
- Semis de particules (points + petits traits) pseudo-aléatoires seedés.
- Halo radial chaud décentré (déjà présent, retravaillé plus intense).
- Grain final conservé.

Les palettes `dawn/day/dusk/night/any` continuent de piloter la teinte (l'accent doré/émeraude reste, seule la base change de saturation).

### 4. Ajustements mineurs

- Le panneau signature bas devient plus discret (dégradé plus fin) pour laisser respirer le fond.
- Bordure/liseré doré très fin sur la variante Editorial pour l'effet magazine.
- Les 4 tuiles d'aperçu du wizard restent en `aspect-video` — pas de changement UI.

## Fichiers modifiés

- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` — ajout `variant` + `titleScale` dans `RenderOptions`, `drawJardinBackdrop`, dispatcher `drawVariant{Organic,Editorial,Diptyque,Constellation}`, refonte panneau signature.
- `src/components/wallpaper-studio/WallpaperStudio.tsx` — la boucle `handleGenerate` itère sur `['organic','editorial','diptyque','constellation']` et passe `variant` + `titleScale` à `renderWallpaper`.
- `src/components/wallpaper-studio/WallpaperPreviewModal.tsx` — propage `variant` + `titleScale` de `proposal` vers `renderWallpaper` lors du téléchargement HD, et stocke `variant` dans `wallpaper_generations` (colonne `variant text` — migration légère si non présente, sinon on l'injecte dans le champ `category` existant en secondaire… on préfère l'ajout de colonne).

## Migration base

`alter table wallpaper_generations add column if not exists variant text;` — non bloquant, ancienne data reste valide.

## Note

Aucune logique métier back-office impactée : uniquement rendu canvas + wizard front + une colonne optionnelle en base pour traçabilité.
