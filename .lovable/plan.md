

## Fix: Poignée de drag-and-drop invisible

### Probleme
La classe CSS `group` est placee sur un `<div>` enfant (ligne 70), mais la poignee grip (ligne 57) est un element frere au meme niveau. Le selecteur `group-hover:opacity-100` ne fonctionne donc jamais car le hover sur le parent ne declenche pas le `group`.

### Solution
Dans `DraggableContributionGrid.tsx`, deplacer la classe `group` du `<div>` enfant (ligne 70) vers le `<div>` parent (ligne 55, le `ref={setNodeRef}`). Cela permet au hover sur l'ensemble de l'item de reveler la poignee.

### Fichier modifie

| Fichier | Modification |
|---------|-------------|
| `src/components/community/contributions/DraggableContributionGrid.tsx` | Deplacer `group` de la ligne 70 vers la ligne 55 |

