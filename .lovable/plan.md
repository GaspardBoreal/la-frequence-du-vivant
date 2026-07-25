## Objectif
Ajouter le glisser-déposer directement dans la vue **Mosaïque (Bento)** du Portrait du site, pour que le propriétaire puisse réordonner les photos sans repasser par la table lumineuse de sélection.

## Changements

### 1. `src/components/propriete/portrait/GalleryBento.tsx`
- Wrapper la grille avec `DndContext` + `SortableContext` (stratégie `rectSortingStrategy`) de `@dnd-kit`.
- Extraire chaque tuile en `SortableTile` interne utilisant `useSortable` — conserve exactement les classes `TILE_CLASSES` et la lightbox actuelle.
- Sensors : `PointerSensor` (distance 8px) + `TouchSensor` (delay 200ms) pour éviter les conflits avec le clic qui ouvre la lightbox.
- Poignée visible en haut-gauche de chaque tuile (icône `GripVertical`, apparition au hover, style glassmorphism cohérent avec `DraggableContributionGrid`).
- Nouvelle prop optionnelle `onReorder?: (photos: GalleryPhoto[]) => void`. Si absente, la vue reste read-only (comportement actuel préservé pour les usages publics éventuels).
- Optimistic update : réordonnancement local immédiat, puis callback parent.

### 2. `src/components/propriete/portrait/TabPortrait.tsx`
- Ne passer `onReorder` que si `canCurate` est vrai.
- Dans le handler, appeler la mutation existante `useSavePropertyGallery` avec la nouvelle liste (mêmes champs que la sauvegarde de la table lumineuse), ce qui recalcule `order_index` côté RPC `set_propriete_gallery`.
- Invalidation de `['propriete-gallery', proprieteId]` déjà gérée par le hook — aucune modification back-end nécessaire.

## Hors périmètre
- Vues Mouvement et Constellation inchangées.
- Aucune migration ni changement RPC (le `set_propriete_gallery` existant réordonne par position dans le tableau).
- Impression A4 inchangée (l'ordre suit la nouvelle séquence sauvegardée).
