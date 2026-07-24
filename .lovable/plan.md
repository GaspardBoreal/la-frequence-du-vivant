## Diagnostic

Le bouton **« Marquer l'étape comme terminée »** est bien câblé sur `markComplete()` → `persist(local, true)` → RPC `upsert_propriete_observation(..., p_completed=true)`.

Le RPC existe et est autorisé pour `authenticated`. Techniquement l'appel part, mais **rien n'est visible côté utilisateur** :

1. `persist()` avale les erreurs (`if (!error)` sans `else`, pas de `toast`).
2. En cas de succès, aucun feedback UI : pas de toast, le bouton ne change ni d'état, ni de libellé, et `completed_at` n'est jamais lu par le composant.
3. La date `completed_at` retournée par la query n'est pas re-mergée dans `local` après la première init (`initRef.current` bloque la resync), donc même après reload le bouton reste identique.

Résultat perçu : « il ne se passe rien ».

## Correctifs

### `src/hooks/propriete/usePropertyObservation.ts`
- `persist()` remonte l'erreur (`throw`) et retourne le résultat.
- Après succès de `markComplete`, mettre `local.completed_at = now()` localement pour refléter immédiatement l'état.
- Exposer `completedAt` dans le retour du hook.
- Après refetch (invalidateQueries), autoriser la resync de `completed_at` sans écraser les édits en cours (merger uniquement le champ `completed_at`).

### `src/components/propriete/tabs/TabObserve.tsx`
- `markComplete` devient `async` avec `try/catch` + `toast` (succès : « Étape 1 marquée comme terminée ✓ » ; erreur : message d'échec).
- Quand `completedAt` est défini :
  - Le bouton affiche « Étape terminée le JJ/MM » avec icône ✓, style vert plein, non-cliquable (ou re-cliquable pour « Rouvrir »).
  - Un petit badge « Terminée » apparaît à côté du compteur `x / 8`.
- Pendant l'appel : `disabled` + spinner sur le bouton.

Aucune modif SQL, aucune modif design system : uniquement feedback UI et gestion d'état du hook.
