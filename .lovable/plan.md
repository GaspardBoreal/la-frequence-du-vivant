## Réorganisation des 3 actions sur la vignette Œil

### Cibles
- **Haut-gauche** : icône verte « Attribuer à un marcheur » (`UserPlus`) + icône orange « Épingler / Retirer de la sélection » (`Pin`), côte à côte, gap discret.
- **Haut-droite** : pastille tags-marcheurs (inchangée de position) + ajout d'un tooltip au survol « Mes tags ».
- **Bas-droite** : badge ambre « à réviser » ou étoiles IA (déplacé pour libérer le haut-gauche).
- **Bas-gauche** : pill « N obs. » (inchangée).

### Fichiers

1. **`src/components/community/insights/curation/CuratedSpeciesCard.tsx`**
   - Cluster actions curateur passé de `top-2 right-2 flex-col` → `top-2 left-2 flex-row items-center gap-1.5`.
   - Bouton `Attribuer` conserve son style verre dépoli, accent vert sur hover (`hover:bg-primary hover:text-primary-foreground`) — déjà en place.
   - `PinToggle` reste tel quel (orange ambre actif), juste à droite, espacement `gap-1.5`.
   - Tooltip `Attribuer` repositionné `side="bottom"` (la gauche est désormais hors carte).
   - Badge « à réviser » et étoiles IA déplacés de `top-1.5 left-1.5` → `bottom-1.5 right-1.5`. Tooltip `side="top"` conservé.

2. **`src/components/community/tags/MarcheurSpeciesTagDots.tsx`**
   - Envelopper le `trigger` dans un `<Tooltip>` (`@/components/ui/tooltip`) avec `TooltipContent side="left"` → texte « Mes tags ».
   - Ne pas toucher au comportement Popover ni à la position `overlay top-1.5 right-1.5`.

### Hors-scope
- Pas de changement de logique (attribution, épinglage, tags, scoring IA).
- Pas de touche aux autres usages de `CuratedSpeciesCard` hors visuel.
- Pas de modification de `PinToggle` ni du Popover des tags.

### Vérification
Recharger Apprendre › L'Œil :
- Coin haut-gauche : `Attribuer` (vert au hover) puis `Épingler` (orange si actif), bien séparés.
- Coin haut-droite : la pastille tags ouvre un tooltip « Mes tags » au survol avant clic.
- Coin bas-droite : badge « à réviser » ou étoiles, lisible sans concurrencer les actions.
- Aucun chevauchement avec la pill « N obs. » en bas-gauche.
