## Ce qui se passe
- Vincent Levavasseur est bien enregistré en base pour l’événement actuel `f6095e8d-44a8-4156-951f-dd604b821603` (« DEVIAT / Jardin Monde du 11.03.26 à aujourd'hui »).
- Donc l’ajout fonctionne.
- Le problème est sur le rechargement de la liste : le RPC `list_event_invited_readers(...)` peut repartir dans un état auth/admin transitoire et répondre `forbidden`, ce qui affiche le faux message « Impossible de charger les Lecteurs invités ».
- J’ai aussi confirmé qu’un diagnostic précédent regardait un autre événement (`df85910e-82da-4ef7-98d2-d4c827d1d0ec`) ; ce n’est plus le cas ici.

## Plan
1. Stabiliser le rechargement de la liste des Lecteurs
   - Supprimer le refetch forcé déclenché juste après l’ajout dans `InviteReaderDialog`.
   - Garder une invalidation simple du cache pour laisser `InvitedReadersTab` refetcher seulement quand sa garde auth/admin est réellement prête.

2. Durcir `InvitedReadersTab`
   - Empêcher tout affichage d’erreur tant que la session/admin n’est pas complètement résolue.
   - Ne montrer l’état d’erreur que pour une vraie erreur après auth stabilisée.
   - Conserver l’actualisation immédiate visuelle de la liste une fois l’invalidation terminée.

3. Fiabiliser la source d’état admin
   - Vérifier et ajuster `useAuth` pour éviter les états intermédiaires où `isLoading` passe à `false` avant que `isAdmin` soit confirmé.
   - Si nécessaire, séparer clairement « session chargée » et « statut admin vérifié » pour que les composants RPC admin attendent le bon signal.

4. Validation ciblée
   - Rejouer le cas exact de l’événement DEVIAT / Jardin Monde.
   - Vérifier les 2 cas attendus :
     - Vincent apparaît immédiatement dans la liste.
     - Aucun message « Impossible de charger les Lecteurs invités » n’apparaît après ajout ou au rechargement de l’onglet.

## Détails techniques
- Fichiers visés :
  - `src/components/admin/marche-events/InviteReaderDialog.tsx`
  - `src/components/admin/marche-events/InvitedReadersTab.tsx`
  - potentiellement `src/hooks/useAuth.ts`
- Aucun changement SQL ne semble nécessaire à ce stade : la donnée est bien écrite, c’est le flux frontend/auth qui est instable.