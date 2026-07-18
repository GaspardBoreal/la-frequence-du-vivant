## Diagnostic

Le CTA se retrouve au-dessus d'une image parce que le placement actuel est **réactif** :
- `drawCommunityCta` teste 8 positions (coins + milieux) contre la liste `photoRects`
- Si aucune position ne passe (cas fréquent en variante **Organic** où les 5 ellipses couvrent presque toute la toile), il tombe dans le **fallback absolu** ligne 642 : bottom-left, sans check de collision → chevauchement visible sur ta copie.

Le problème est structurel : les 4 variantes sont dessinées **sans savoir** que le CTA doit être placé après. Ajouter des tailles/positions supplémentaires ne suffira pas — il faut réserver l'espace **avant** de peindre les images.

## Correction (2 niveaux, complémentaires)

### 1. Réservation d'une "safe zone" en amont (le vrai fix)

Quand `ctaEnabled === true`, calculer une bande basse-gauche réservée (≈ 40 % largeur × 18 % hauteur en paysage) et **contraindre chaque variante** à ne pas y dessiner d'image :

- `variantOrganic` : décaler le satellite bottom-left vers le haut, réduire son rayon.
- `variantEditorial` : déjà safe (hero à gauche, thumbs à droite) → juste vérifier la marge basse.
- `variantDiptyque` : décaler la carte inférieure gauche vers la droite/haut.
- `variantConstellation` : exclure les points aléatoires dont la bbox tombe dans la safe zone (re-tirer position).

La safe zone devient une **contrainte de layout**, pas un test a posteriori. Résultat : la zone du CTA est garantie vide, quelle que soit la variante ou les images.

### 2. Placement robuste (garde-fou)

Dans `drawCommunityCta` :
- Passer la safe zone en priorité 1 des candidats.
- Ajouter un **3ᵉ palier ultra-compact** (police + 15 % plus petite).
- Remplacer le fallback aveugle par un **scan de grille** (pas de 3 % du canvas) qui retourne la position avec le **moins d'overlap** — jamais un chevauchement franc.
- Log console si fallback grille utilisé, pour monitoring.

## Fichier touché

- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` :
  - Nouveau helper `getCtaSafeZone(w, h, isPortrait): Rect`
  - Signature des 4 `variantX(..., safeZone?: Rect)` — évitement en interne
  - `renderWallpaper` : calcule `safeZone` si `ctaEnabled`, la transmet aux variantes et à `drawCommunityCta` (priorité 1)
  - `drawCommunityCta` : ajoute palier 3, scan de grille en fallback, jamais de collision franche

## Détails techniques

```text
safeZone (paysage) = { x: 0, y: h*0.78, w: w*0.42, h: h*0.20 }
safeZone (portrait)= { x: 0, y: h*0.85, w: w*0.60, h: h*0.14 }
```

Aucun changement UI côté `WallpaperStudio.tsx` — le toggle reste identique, l'effet visuel est simplement propre à 100 %.
