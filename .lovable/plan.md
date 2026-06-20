# Fix : dialog « Lier une entreprise » derrière le drawer

## Diagnostic

Dans `/admin/crm/marches`, la fiche événement s'ouvre dans un `Sheet` (z-index `z-[1100]`). Quand on clique « + Lier », le `CompanyLinkPicker` utilise `Dialog` dont l'overlay et le content sont en `z-50` → il se retrouve **sous** le Sheet, illisible et non cliquable (cf. capture).

C'est un problème de stacking systémique : tout `Dialog` ouvert depuis un `Sheet` aura ce bug.

## Solution

Aligner le z-index des `Dialog` sur celui des `Sheet` pour que les dialogues s'affichent **toujours au-dessus** des drawers (comportement attendu : un modal interrompt le drawer).

### Changement

`src/components/ui/dialog.tsx` :
- `DialogOverlay` : `z-50` → `z-[1200]`
- `DialogContent` : `z-50` → `z-[1200]`

Aucun autre dialog du projet n'a besoin d'être plus haut que 1200 (les toasts/sonner sont déjà gérés à part). Les autres `Dialog` standards continuent de fonctionner normalement (juste au-dessus de la page au lieu de `z-50`, sans effet visible).

## Vérification

1. Ouvrir `/admin/crm/marches` → onglet Liste → cliquer un event → drawer s'ouvre
2. Cliquer « + Lier » → le dialog doit apparaître **par-dessus** le drawer, recherche fonctionnelle
3. Vérifier qu'aucun autre dialog (créer entreprise, créer mission, etc.) ne casse

## Fichiers modifiés

- `src/components/ui/dialog.tsx` (2 lignes)
