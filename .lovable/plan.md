## Objectif

Permettre la suppression d'un événement depuis `/admin/marche-events` (onglet Liste) avec confirmation explicite Oui/Non.

## UI

Dans le menu `⋮` (DropdownMenu) de chaque carte événement (`EventsListTab.tsx`), ajouter en dernière position :

- Séparateur
- Item **« Supprimer »** en rouge (icône `Trash2`, `text-destructive`)

Au clic, ouverture d'un `<AlertDialog>` (shadcn, déjà présent) :

```
Titre    : « Supprimer cet événement ? »
Corps    : « "{titre}" — {date formatée}.
            Cette action est définitive et supprimera l'événement
            ainsi que ses participations, invités, témoignages et
            médias associés. Les marcheurs ne pourront plus y accéder. »
Boutons  : [ Non, annuler ]   [ Oui, supprimer ]  (destructive)
```

Pendant la suppression : bouton en état loading (spinner), boutons désactivés. Toast succès/erreur à la fin.

## Comportement / données

- Nouveau hook `useDeleteMarcheEvent()` (mutation React Query) dans `src/hooks/useMarcheEventsQuery.ts` :
  - `await supabase.from('marche_events').delete().eq('id', id)`
  - Sur succès : invalider `['marche-events-paginated']`, `['marche-events-dashboard-stats']`, `['marche-events-filtered-all']`, `['events-public-visibility']`, toast `"Événement supprimé"`.
  - Sur erreur : toast destructive avec le message Postgres (utile si RLS bloque ou FK manquante).
- Les tables enfants avec `ON DELETE CASCADE` sur `marche_events.id` disparaissent automatiquement. Pour celles sans cascade, la mutation renverra l'erreur PostgREST correspondante — le toast la remonte pour qu'on puisse ajuster ensuite (aucune migration dans ce lot, pour rester sur du frontend/presentation comme demandé).

## Sécurité

- La page est déjà protégée admin. La policy DELETE existante sur `marche_events` s'applique (rôle admin via `has_role`). Aucun changement RLS.

## Fichiers touchés

- `src/hooks/useMarcheEventsQuery.ts` — ajout du hook `useDeleteMarcheEvent`.
- `src/components/admin/marche-events/EventsListTab.tsx` — item « Supprimer » + `AlertDialog` + état local `deleteTarget`.

## Hors scope

- Suppression en masse.
- Corbeille / soft-delete.
- Migration SQL de cascades manquantes (à traiter si un toast d'erreur apparaît en pratique).
