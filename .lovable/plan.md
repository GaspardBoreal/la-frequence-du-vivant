## Objectif

Afficher, au survol (mouse over) de chacun des 3 choix « Compacte / Grumeleuse / Particulaire » du bloc 3 « Structure du sol », un tooltip riche, design et impactant contenant les descriptions terrain fournies (D.S.).

## Cible

- Fichier : `src/components/propriete/analyze/blocks/StructureBlock.tsx`
- Composant réutilisé : `ChoiceButton` (`src/components/propriete/analyze/ChoiceButton.tsx`)

## Ce qu'on va livrer

### 1. Nouveau composant `StructureChoiceTooltip.tsx`

Un tooltip flottant maison (pas de dépendance Radix supplémentaire), positionné au-dessus du bouton survolé, avec :

- Fond `hsl(var(--ds-cream))` + bordure `hsl(var(--ds-forest))/40` + shadow douce ambre.
- En-tête : mini-picto (réutilise `IconCompacte / IconGrumeleuse / IconParticulaire` en taille 28px) + titre « Compacte / Grumeleuse / Particulaire » en `--ds-forest-deep`, gras.
- Bandeau « verbe clé » (repris de `StructureCrossSection`) en petites capitales espacées, doré.
- 3 puces sensorielles (icônes Lucide : `Droplets`, `Thermometer`, `Hand` / `Sprout`) déclinant le texte D.S. en fragments courts et lisibles.
- Animation `framer-motion` : `opacity 0→1`, `y: 8→0`, `scale: 0.96→1`, easing doux (240 ms). Sortie miroir.
- Petite flèche SVG pointant vers le bouton.
- Largeur ~ 280 px, `pointer-events-none` pour ne pas gêner le clic.
- Accessibilité : `role="tooltip"`, `id` lié en `aria-describedby` sur le bouton parent.

### 2. Contenu par variante (fidèle au texte utilisateur)

**Compacte** — verbe : « Résiste · bloc unique »
- 💧 L'eau s'infiltre mal
- 🧱 Motte difficile à diviser, rupture brusque, effet de lourdeur (ocre)
- 🌡 Dur et sec l'été / élastique et gorgé d'eau l'hiver, lent à se réchauffer

**Grumeleuse** — verbe : « S'émiette · respire »
- 🌱 Agrégats visibles, motte qui se divise facilement et tient
- 🫧 Bulles au test de stabilité = air ; galeries de lombrics, racines, micro-faune
- 💧 Bonne infiltration de l'eau

**Particulaire** — verbe : « Se disperse · sable »
- 🪨 La motte ne tient pas, s'effondre avant même la main ou le bocal
- 💧 L'eau s'infiltre trop vite
- 🌡 Sol qui se réchauffe rapidement, pauvre (nutriments lessivés)

(Icônes rendues via Lucide, pas des emojis, pour rester dans la charte.)

### 3. Intégration dans `StructureBlock.tsx`

- Envelopper chaque `ChoiceButton` dans un conteneur `relative` + gestionnaires `onMouseEnter / onMouseLeave / onFocus / onBlur` qui pilotent un état local `hoveredValue`.
- Sur desktop (`hover: hover` media query implicite via événement souris) : afficher le tooltip.
- Sur mobile (pas de hover) : le tooltip s'ouvre également au `focus` (au tap le bouton reçoit le focus), et se ferme au tap suivant hors zone. Aucune régression du comportement de sélection existant.
- Aucun changement de logique métier, aucun changement de stockage, aucun impact sur `StructureCrossSection`, `SoilPictos`, ni sur les autres blocs.

## Fichiers touchés

- **Nouveau** : `src/components/propriete/analyze/StructureChoiceTooltip.tsx`
- **Modifié** : `src/components/propriete/analyze/blocks/StructureBlock.tsx` (état hover + wrapping des `ChoiceButton`)

Aucun autre fichier n'est modifié.
