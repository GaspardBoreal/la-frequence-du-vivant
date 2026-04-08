

## Ajouter la pagination à la liste des marches

### Résumé

Ajouter une pagination au composant `MarcheList` avec un sélecteur de nombre d'éléments par page (10, 20, 50), 10 par défaut.

### Modifications

**Fichier : `src/components/admin/MarcheList.tsx`**

1. Ajouter deux états : `currentPage` (défaut 1) et `itemsPerPage` (défaut 10)
2. Calculer `paginatedMarches` via slice sur le tableau `marches`
3. Réinitialiser `currentPage` à 1 quand `marches` ou `itemsPerPage` changent
4. Remplacer `marches.map(...)` par `paginatedMarches.map(...)`
5. Ajouter en bas de la liste :
   - Un sélecteur `<Select>` avec les options 10 / 20 / 50 par page
   - Les composants `Pagination` existants (Previous / numéros de page / Next) depuis `src/components/ui/pagination.tsx`
   - Un indicateur "Affichage X-Y sur Z marches"

### Détails techniques

- Utilise les composants UI existants : `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` et `Select`
- Le compteur dans le header (`Marches existantes (N)`) reste sur le total non paginé
- La pagination affiche max 5 numéros de page avec ellipsis si nécessaire

