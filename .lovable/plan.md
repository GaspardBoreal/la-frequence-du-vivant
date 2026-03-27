
# Fix : liste des participants non mise à jour après ajout

## Cause racine

Le projet utilise **React Query v5** (`^5.56.2`). Dans cette version, les callbacks `onSuccess`/`onError` sur `useMutation()` **n'existent plus** au niveau de la définition du hook. Ils doivent être passés dans l'appel `.mutate()` ou via `.mutateAsync().then()`.

Actuellement, toutes les mutations dans `MarcheEventDetail.tsx` utilisent `onSuccess` dans la config du hook — elles sont silencieusement ignorées. Le toast "Participant ajouté avec succès" apparaît mais **l'invalidation de cache ne s'exécute jamais**, donc la liste ne se rafraîchit pas.

## Correction

Déplacer les callbacks `onSuccess` de chaque `useMutation()` vers l'appel `.mutate(value, { onSuccess })` — ou convertir en `mutateAsync` + `then`. Cela concerne **4 mutations** dans le fichier :

1. `createEvent` — invalidation + navigation
2. `updateEvent` — invalidation + toast
3. `deleteEvent` — invalidation + navigation
4. `addParticipant` — invalidation + reset état + toast

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventDetail.tsx` | Migrer les 4 `onSuccess` vers les appels `.mutate()` |

## Exemple de pattern appliqué

Avant (ignoré en v5) :
```ts
const addParticipant = useMutation({
  mutationFn: async (userId) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries(...);
    toast.success('...');
  },
});
// appel : addParticipant.mutate(userId)
```

Après (fonctionne en v5) :
```ts
const addParticipant = useMutation({
  mutationFn: async (userId) => { ... },
});
// appel :
addParticipant.mutate(userId, {
  onSuccess: () => {
    queryClient.invalidateQueries(...);
    toast.success('...');
  },
});
```
