## Objectif
Résoudre le chevauchement entre le bloc « STRATE 2 — RHIZOSPHÈRE / Le silence fertile des racines » et l'index latéral droit, sans bouger l'index.

## Principe retenu
L'index reste à sa position. Ses **labels** (Canopée, Arbustive, Rhizosphère, Saisons) s'estompent quand leur strate est **active** à l'écran — seuls les points restent visibles. À la sortie de la strate, les labels réapparaissent en fondu. Cela libère la lecture du titre sans supprimer le repère.

## Implémentation

**Fichier : `src/pages/ImmersiveGardenFiche.tsx`**

1. `IndicatorDot` — ajouter une prop `end` (fin de plage active) et calculer une opacité de label distincte :
   - `labelOpacity` = 1 hors de `[start, end]`, ~0.05 dedans (via `useTransform` sur le scrollYProgress déjà utilisé).
   - Le point garde son animation actuelle (opacity/scale existantes).
   - Appliquer `labelOpacity` sur le `<span>` du label uniquement.

2. `StratIndicator` — passer les plages :
   - Canopée `start=0 end=0.25`
   - Arbustive `start=0.25 end=0.5`
   - Rhizosphère `start=0.5 end=0.75`
   - Saisons `start=0.75 end=1`

3. Transition douce : `transition: { duration: 0.4 }` sur le span label (via `motion.span`), pour éviter un flash.

4. Accessibilité / reduced motion : si `useReducedMotion()` est vrai, garder les labels à opacité 1 (pas de masquage animé).

## Détails techniques
- Réutiliser le `useScroll` déjà présent dans `IndicatorDot` (pas de nouveau listener).
- `useTransform(scrollYProgress, [start-0.02, start, end, end+0.02], [1, 0.05, 0.05, 1])` pour un fondu net mais non brutal.
- Aucun changement sur le bloc texte de la section Rhizosphère (z-index, marges, largeur inchangés).
- Aucun impact sur les autres sections ni sur le layout mobile (index déjà `hidden md:flex`).

## Hors scope
- Ne pas modifier la position, la taille ou la couleur de l'index.
- Ne pas toucher au contenu ni à la mise en page du bloc titre Rhizosphère.
