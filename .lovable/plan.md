## Objectif
Masquer les labels de **tous** les points de l'index (pas seulement Rhizosphère) pendant la lecture de la **Strate 2**, puis les faire réapparaître dès qu'on en sort. Les points (dots) restent visibles en permanence.

## Constat
Aujourd'hui seul le label « Rhizosphère » s'efface (prop `fadeDuringActive` posé uniquement sur ce dot). La capture montre que « CANOPÉE », « ARBUSTIVE » et « SAISONS » restent visibles et chevauchent le titre "Le silence fertile des racines".

## Implémentation (fichier : `src/pages/ImmersiveGardenFiche.tsx`)

1. **Remonter le fade au niveau du conteneur `StratIndicator`** :
   - Calculer une seule `labelsOpacity` via `useTransform(scrollYProgress, [0.48, 0.5, 0.75, 0.77], [1, 0, 0, 1])`.
   - Respecter `useReducedMotion()` → opacité fixe à 1.
   - Wrapper chaque label dans un `motion.div` (ou passer l'opacité via un contexte / prop partagée) qui applique cette opacité commune. Les dots ne sont pas affectés.

2. **Simplifier `IndicatorDot`** :
   - Supprimer la prop `fadeDuringActive` et la logique `labelOpacity` locale.
   - Accepter une prop `labelStyle?: MotionStyle` (ou lire l'opacité via contexte) appliquée uniquement au `<span>` label.
   - Conserver l'animation `opacity` / `scale` du dot inchangée.

3. **`StratIndicator`** :
   - Passer la même `labelsOpacity` aux 4 `IndicatorDot` (Canopée, Arbustive, Rhizosphère, Saisons).
   - Garder `z-20` pour rester sous les `StratPanel` (z-30).

## Hors scope
- Pas de modification des sections, `StratPanel`, ni du positionnement de l'index.
- Pas de nouvelle librairie.
