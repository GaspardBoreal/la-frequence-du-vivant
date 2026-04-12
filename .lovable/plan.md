

## Drag-and-drop pour réordonner les photos — Mes contributions

### Contexte
- La table `marcheur_medias` a déjà une colonne `ordre`
- `@dnd-kit/core` et `@dnd-kit/sortable` sont déjà installés
- `useUpdateContribution` permet de mettre à jour n'importe quel champ
- Le tri actuel est par `created_at` — il faut prioriser `ordre` quand il est défini

### Plan

**1. Nouveau hook `useReorderContributions`** dans `useMarcheurContributions.ts`
- Mutation batch qui met à jour le champ `ordre` de chaque `marcheur_medias` après un drag-and-drop
- Invalidation optimiste du cache React Query

**2. Modifier `useMarcheurMedias`** pour trier par `ordre` en priorité, puis `created_at` en fallback
- `.order('ordre', { ascending: true, nullsFirst: false }).order('created_at', { ascending: sort === 'asc' })`

**3. Nouveau composant `DraggableContributionGrid.tsx`**
- Wraps la grille "Mes contributions" avec `DndContext` + `SortableContext` (grid strategy)
- Chaque `ContributionItem` est wrappé dans un composant sortable utilisant `useSortable`
- Indicateur visuel de drag : opacité réduite + bordure emerald sur l'item déplacé
- Sur `onDragEnd` : recalcule l'ordre et appelle `useReorderContributions`
- Support tactile natif via `TouchSensor` + `PointerSensor` de dnd-kit
- Un petit indicateur "grip" (⠿) apparaît en overlay sur chaque photo en mode édition ou en permanence, subtil

**4. Modifier `MarcheDetailModal.tsx`**
- Remplacer la grille statique `myMedias.map(...)` par `<DraggableContributionGrid>` uniquement pour les photos propres de l'utilisateur (isOwner)
- Passer les callbacks existants (onUpdate, onDelete, onClick)

### Fichiers

| Fichier | Action |
|---------|--------|
| `src/components/community/contributions/DraggableContributionGrid.tsx` | **Nouveau** — grille drag-and-drop avec dnd-kit |
| `src/hooks/useMarcheurContributions.ts` | Ajouter `useReorderContributions` + modifier le tri de `useMarcheurMedias` |
| `src/components/community/MarcheDetailModal.tsx` | Intégrer `DraggableContributionGrid` pour "Mes contributions" |

### UX
- Le drag fonctionne au doigt (mobile) et à la souris (desktop)
- Animation fluide pendant le déplacement
- Toast de confirmation après réordonnancement
- L'ordre est persisté immédiatement en base

