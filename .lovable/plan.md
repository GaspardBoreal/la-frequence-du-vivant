## Diagnostic

Sur la copie d'écran 3 :
- Le toast "Segment sélectionné — confirmez l'insertion" s'affiche (la sélection a bien fonctionné).
- Le dialog "Où insérer ce point ?" s'est rouvert avec le bon segment surligné.
- **MAIS** le bouton orange "Confirmer l'insertion" est tronqué tout en bas de l'écran : on devine sa moitié supérieure orange, et il n'y a aucun moyen de scroller dans le dialog.

Cause : `DialogContent` n'a pas de `max-height` ni de zone scrollable interne. Avec 4 candidats + textes + bouton "choisir sur la carte" + footer, la hauteur dépasse celle du viewport (~754 px ici, encore moins après les marges du Dialog) et le footer sort hors champ. Aucun overflow scroll n'est défini, donc l'utilisateur ne peut ni voir ni atteindre "Confirmer".

## Solution

Rendre le `DialogContent` borné en hauteur avec footer collant et corps scrollable.

### Fichier `WaypointInsertConfirmDialog.tsx`

1. **`DialogContent`** : ajouter `max-h-[85vh] flex flex-col p-0 overflow-hidden` pour piloter la hauteur et la structure.
2. **`DialogHeader`** : `px-6 pt-6 pb-2 shrink-0`.
3. Wrapper le bloc des candidats + bouton "Aucune ne correspond" dans un `<div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">` → c'est cette zone qui scrolle si trop d'options.
4. **`DialogFooter`** : ajouter `px-6 py-4 border-t bg-background shrink-0` pour qu'il reste toujours visible en bas (collant).
5. Bouton "Confirmer l'insertion" : ajouter `aria-label` et un focus visible plus marqué pour aider en cas de viewport étroit.

### Bonus robustesse

Quand le `pickMode` se termine avec succès (`selectedIdx` mis à jour via la sélection sur la carte) :
- Dans `ExplorationCarteTab.tsx`, après `setPendingWaypoint(... selectedIdx: finalIdx ...)`, ajouter un toast persistant ou un re-focus sur le bouton "Confirmer" pour que l'utilisateur sache où aller.
- Optionnel : fermer le toast toast.success existant et le remplacer par un toast avec une action "Confirmer" cliquable directement (`toast.success("...", { action: { label: 'Confirmer', onClick: confirmInsert } })`) — confort supplémentaire si la viewport est petite.

## Pourquoi ça résout le bug

- La hauteur du Dialog est désormais bornée à 85% du viewport.
- Le footer (avec "Confirmer l'insertion") est hors de la zone scrollable et reste toujours visible.
- Si la liste de candidats grandit, c'est elle qui scrolle, pas l'écran.
- Le toast d'action offre un raccourci immédiat même sans toucher au Dialog.