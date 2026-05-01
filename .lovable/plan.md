
# Réordonnancement des photos du mur de convivialité

## Contexte actuel

- Table `exploration_convivialite_photos` : pas de colonne d'ordre. Tri actuellement par `created_at DESC` dans `useConvivialitePhotos`.
- Affichage : `ConvivialiteMosaic.tsx` (grille `columns-*` CSS), consommé par `ExplorationMarcheurPage` (et `ConvivialiteSlideshow`/`ConvivialiteImmersiveView` qui dérivent du même tableau).
- RLS : `UPDATE` réservé aux admins. Il faut élargir le droit d'update pour le champ d'ordre aux **ambassadeurs / sentinelles / organisateurs** de l'exploration (les mêmes profils que ceux qui peuvent uploader, via `can_upload_convivialite`).
- `@dnd-kit/core` + `@dnd-kit/sortable` déjà installés (déjà utilisé pour le tri des photos perso — cf. mémoire `photo-reordering-logic`).

## Modifications base de données (migration)

1. Ajouter une colonne `position INTEGER NOT NULL DEFAULT 0` à `exploration_convivialite_photos`.
2. Index `(exploration_id, position)` pour les tris efficaces.
3. Backfill : `position = row_number() OVER (PARTITION BY exploration_id ORDER BY created_at ASC) - 1`.
4. Remplacer la policy `UPDATE` réservée aux admins par :
   - `convivialite_photos_update_admin` (inchangée pour les admins, tous champs).
   - **Nouvelle** `convivialite_photos_reorder` : `UPDATE` autorisé si `can_upload_convivialite(auth.uid(), exploration_id)` — donc ambassadeurs, sentinelles et organisateurs valides peuvent modifier la `position`. Pour limiter au seul champ `position`, on s'appuie sur une fonction RPC dédiée (voir ci-dessous) plutôt qu'un UPDATE direct.
5. Créer une fonction `reorder_convivialite_photos(_exploration_id uuid, _ordered_ids uuid[])` `SECURITY DEFINER` qui :
   - Vérifie `can_upload_convivialite(auth.uid(), _exploration_id)` OR `check_is_admin_user(auth.uid())`.
   - Met à jour `position` selon l'index dans le tableau, en une seule transaction.
   - Met à jour `updated_at`.

Cela évite d'élargir une policy UPDATE générique (sécurité plus stricte : seul ce RPC peut toucher la position).

## Modifications côté code

### Hook `src/hooks/useConvivialitePhotos.ts`
- Ajouter `position` dans l'interface `ConvivialitePhoto`.
- Tri : `.order('position', { ascending: true }).order('created_at', { ascending: true })`.
- Ajouter un hook `useReorderConvivialitePhotos(explorationId)` :
  - Mutation appelant `supabase.rpc('reorder_convivialite_photos', { _exploration_id, _ordered_ids })`.
  - **Optimistic update** sur le cache `['convivialite-photos', explorationId]` pour un retour visuel immédiat.
  - Rollback en cas d'erreur + toast.

### Composant `ConvivialiteMosaic.tsx`
- Ajouter une prop `canReorder: boolean` (true si user est ambassadeur, sentinelle, organisateur ou admin — calculée déjà via `useCanUploadConvivialite` dans la page parent).
- Ajouter un prop `onReorder: (orderedIds: string[]) => void`.
- Ajouter un **toggle "Réorganiser"** discret en haut à droite du mur : active un mode édition.
- En mode édition :
  - Remplacer la grille `columns-*` (incompatible avec dnd-kit car elle réorganise en colonnes CSS) par une **grille CSS Grid** `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` avec `aspect-square` (ou `aspect-[4/3]`) — la mosaïque libre n'est pas adaptée au DnD ; on bascule vers une grille régulière uniquement pendant l'édition.
  - Wrapper `<DndContext>` + `<SortableContext>` (stratégie `rectSortingStrategy`) + items `useSortable`.
  - Désactiver le clic-lightbox, afficher une poignée `GripVertical` et un fond légèrement plus sombre.
  - Bouton "Terminer" qui valide l'ordre courant et appelle `onReorder` avec la liste d'IDs ordonnés.
- Hors mode édition : conserver la mosaïque actuelle (colonnes CSS, lightbox, hover actions).

### Page `ExplorationMarcheurPage.tsx`
- Calculer `canReorder` à partir du rôle (`ambassadeur`/`sentinelle`/admin) et/ou du résultat de `useCanUploadConvivialite`.
- Brancher `useReorderConvivialitePhotos` et passer `canReorder` + `onReorder` à `ConvivialiteMosaic`.

### Slideshow / ImmersiveView
- Aucune modification fonctionnelle : ils consomment le tableau déjà trié par `position` via le hook.

## UX

- **Toggle "Réorganiser"** visible uniquement pour les profils habilités, à côté du bouton d'upload.
- En mode édition :
  - Grille régulière (carrés) pour un drag fluide.
  - Poignée + curseur `grab/grabbing`.
  - Animation framer-motion conservée pour le layout.
  - Boutons "Annuler" (revert au snapshot pré-édition) et "Enregistrer l'ordre".
- Toast de succès "Ordre du mur mis à jour".
- Mobile : drag activé via long-press (sensor `TouchSensor` avec `delay: 200, tolerance: 5`).

## Détails techniques

- Sensors : `PointerSensor` (activation `distance: 6`) + `TouchSensor` (long-press) + `KeyboardSensor` pour l'accessibilité.
- `arrayMove` de `@dnd-kit/sortable` pour calculer le nouvel ordre localement.
- Persistance déclenchée au "Enregistrer" (pas à chaque drag) pour limiter les appels RPC, mais on garde un optimistic update local pendant le DnD.
- Mémoire à mettre à jour : ajouter une référence dans `mem://index.md` vers `mem://features/community/convivialite-photo-reordering-logic` décrivant : RPC dédié, mode édition avec bascule de layout, droits ambassadeur/sentinelle/organisateur.

## Fichiers impactés

- **Nouveau** : `supabase/migrations/<timestamp>_convivialite_reorder.sql`
- **Modifié** : `src/hooks/useConvivialitePhotos.ts`
- **Modifié** : `src/components/community/exploration/convivialite/ConvivialiteMosaic.tsx`
- **Modifié** : `src/components/community/ExplorationMarcheurPage.tsx`
- **Nouveau (mémoire)** : `mem://features/community/convivialite-photo-reordering-logic` + mise à jour de `mem://index.md`
