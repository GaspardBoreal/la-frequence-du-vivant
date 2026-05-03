## Objectif

Dans `Marcheurs → Marcheurs`, lorsqu'on ouvre le bandeau d'un marcheur, permettre le **classement (drag-and-drop)** des photos de l'onglet *Observations*, à la manière de `Marches → Voir` (cf. `MediaUploadSection` + `SortablePhotoCard`) et de la mosaïque Convivialité (`ConvivialiteMosaic`).

## Analyse de l'existant

- Les photos affichées dans `ObservationsSubTab` (`src/components/community/exploration/MarcheursTab.tsx`) proviennent de **deux tables hétérogènes** :
  - `marcheur_medias` (colonne `ordre` existe) — photos & vidéos liées aux events
  - `exploration_convivialite_photos` (colonne `position` existe) — mur convivialité de l'exploration
- Règle d'appartenance déjà en place (`belongsToMe`) : exclusive à l'utilisateur réattribué, sinon à l'uploader.
- **RLS contraignant** : `marcheur_medias` n'est modifiable que par l'uploader (`user_id = auth.uid()`) ou un admin ; idem pour `exploration_convivialite_photos` (admin uniquement). Or un marcheur peut être propriétaire **par réattribution** d'une photo qu'il n'a pas uploadée → il n'aura pas le droit UPDATE direct.
- L'ordre actuel d'affichage est par `created_at` via `SortToggle` (asc/desc).

## Décision d'architecture

L'ordre demandé est **un ordre personnel** au marcheur (la même photo ne peut pas exister dans deux galeries puisque l'appartenance est exclusive), donc on peut l'écrire **directement sur la ligne** :
- `marcheur_medias.ordre`
- `exploration_convivialite_photos.position`

Pour contourner les RLS quand l'utilisateur courant n'est pas l'uploader (cas de la réattribution) ou n'est pas admin, on passera par une **RPC `SECURITY DEFINER`** unique côté Supabase qui valide la légitimité (admin OU propriétaire effectif via `attributed_marcheur_id` lié à son `user_id`, OU uploader d'origine sans réattribution).

## Plan d'implémentation

### 1. Backend Supabase (migration)

Créer la fonction `public.reorder_marcheur_observation_photos(p_owner_user_id uuid, p_owner_crew_id uuid, p_items jsonb)` :
- `p_items` = tableau `[{ kind: 'media' | 'conv', id: uuid, ordre: int }, ...]`
- Vérifie l'autorisation : `auth.uid() = p_owner_user_id` OU `has_role(auth.uid(),'admin')` OU rôle ambassadeur/sentinelle gérant la fiche crew.
- Pour chaque item : recalcule `belongsToMe` côté SQL (mêmes règles que le front) puis update `ordre` (medias) ou `position` (convivialité).
- `SECURITY DEFINER`, `SET search_path = public`.

### 2. Hook React

Nouveau `src/hooks/useReorderMarcheurObservations.ts` (mutation TanStack) :
- Appelle la RPC, invalide la query `['marcheur-observations-photos', userId, crewId, ...]`.
- Optimistic update.

### 3. UI — `ObservationsSubTab` (`MarcheursTab.tsx`)

Sur le modèle `ConvivialiteMosaic` :
- Ajout d'états `editMode`, `orderedItems`.
- Bouton **Réorganiser** (visible si `canReorder`) à côté du `SortToggle`. Désactive automatiquement le tri par date pendant l'édition (force ordre manuel).
- En mode édition :
  - `DndContext` + `SortableContext` (`rectSortingStrategy`) avec `PointerSensor` + `TouchSensor` (delay 200ms pour mobile).
  - `SortablePhotoTile` interne (poignée `GripVertical`, badge index) — composant local léger réutilisant l'esthétique actuelle (carrés `aspect-square`).
  - Boutons **Annuler** / **Enregistrer l'ordre** (toast succès/erreur).
- Hors édition : tri par `ordre`/`position` (asc) puis fallback `created_at`. Le `SortToggle` reste disponible et bascule entre *Ordre manuel* et *Date*.

`canReorder` = vrai si `currentUserId === userId` OU si l'utilisateur courant est admin/sentinelle (réutiliser les hooks `useAuth` + `useCommunityProfile` déjà disponibles).

### 4. Tri en lecture

Mettre à jour la requête `ObservationsSubTab` pour sélectionner `ordre` (medias) et `position` (convivialité) et trier en priorité par cet index manuel quand le mode "manuel" est actif.

### 5. QA

- Vérifier qu'un marcheur réordonne bien des photos qui lui sont **réattribuées** (cas Sophie D).
- Vérifier qu'un marcheur sans droit ne voit pas le bouton.
- Vérifier que l'ordre persiste après refresh et reste cohérent dans les autres vues qui consomment ces tables (galerie publique convivialité, etc.) — l'usage de `position`/`ordre` y est déjà répandu, donc cohérent.

## Fichiers impactés

- `supabase/migrations/<new>.sql` — RPC `reorder_marcheur_observation_photos`.
- `src/hooks/useReorderMarcheurObservations.ts` — nouveau.
- `src/components/community/exploration/MarcheursTab.tsx` — refactor `ObservationsSubTab` (DnD, mode édition, tri manuel).

## Hors scope

- Réordonner les vidéos / sons / textes (uniquement photos comme demandé).
- Modifier l'ordre dans les galeries publiques tierces (impact indirect via `ordre`/`position` accepté et souhaitable).
