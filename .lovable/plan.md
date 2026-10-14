# Réparer « Mes tags » dans l'Atelier et l'ajouter à l'Herbier du moment

## Constat (vérifié dans le code)
1. **Le bouton ne réagit pas** : il s'ouvre bien, mais sa fenêtre de choix passe *derrière* l'Atelier. L'Atelier est un plein écran posé très haut dans la pile d'affichage (niveau 3000), alors que la fenêtre « Mes tags » est réglée au niveau 1100 (et le tiroir mobile au niveau par défaut). On clique, rien ne semble se passer.
2. **Absent de l'Herbier du moment** : le bandeau droit affiche seulement les pastilles des tags déjà actifs, sans moyen de les choisir.

## Ce qui change
- Le bouton « Mes tags » des Calques ouvre enfin son choix au premier plan (fenêtre sur ordinateur, tiroir par le bas sur téléphone).
- Dans l'Herbier du moment, un bouton « Mes tags » apparaît dans la ligne des filtres en haut, à côté de la période. Même choix (Au moins un / Tous / Sauf), mêmes compteurs, uniquement vos tags.
- Un seul filtre partagé : un tag choisi dans Calques s'applique à l'Herbier et à la carte, et inversement. Les pastilles actives restent retirables d'une croix.

## Détails techniques
- `MyTagsFilterPicker` : nouvelle prop `contentClassName` (z-index surchargeable) ; dans l'Atelier, passer `z-[3600]` au `PopoverContent` et au `DrawerContent` (+ overlay du Drawer).
- `HerbierDuMomentDrawer` : nouvelles props `tagFacets`, `tagsLoading` ; rendu du picker dans l'en-tête, `onChange` → `onFilterChange({ ...filter, tags })`.
- `PaletteStudio` : transmettre `tagFacets` et `tagsLoading` déjà calculés à l'Herbier.
- Vérification Playwright de l'ouverture du picker au-dessus de l'Atelier (sans session : vérification visuelle limitée).
