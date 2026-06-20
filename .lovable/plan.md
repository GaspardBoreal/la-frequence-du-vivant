## Diagnostic

Dans `CrmMissions.tsx`, le drawer reçoit la mission via un state local `openMission` figé à l'ouverture. Quand `setAssignees.mutate(...)` réussit, le hook invalide `crm-missions` et `allMissions` se met à jour — mais `openMission` (et donc la prop `mission` du drawer) garde la version *initiale* sans les nouveaux assignés. Résultat : la base est OK, le picker (`value={assigneeIds}`) ne reflète pas le changement tant qu'on ne ferme/rouvre pas.

Même problème latent pour `statut`, `priorite`, `due_at` modifiés ailleurs (kanban, planning).

## Solution

Faire du drawer un **consommateur live** du cache React Query plutôt qu'un afficheur d'un snapshot.

### Changement (1 fichier : `src/components/crm/missions/MissionDrawer.tsx`)

1. Récupérer `allMissions` depuis `useCrmMissions()` (déjà appelé).
2. Dériver la mission affichée :
   ```ts
   const liveMission = allMissions.find(m => m.id === mission?.id) ?? mission;
   ```
3. Remplacer toutes les lectures de `mission.*` (en particulier `mission.assignees`, `mission.id` pour les mutations restant sur l'identité stable, et la dérivation `assigneeIds`) par `liveMission.*`.
4. Conserver les `useState` locaux (titre, desc, statut, priorite, dueAt) qui sont des champs édités — ils restent pilotés par le `useEffect` sur `mission?.id`. Les assignés, eux, sont lus directement depuis `liveMission.assignees` (pas de state local à resynchroniser).

### Pourquoi ça suffit
- La mutation `setAssignees` invalide déjà `['crm-missions']` → `allMissions` se rafraîchit → `liveMission.assignees` change → `MissionAssigneesPicker` reçoit un nouveau `value` → re-render avec coches et avatars à jour.
- Aucun changement nécessaire dans `useCrmMissions` ni dans le picker.
- Pas de risque de boucle : `liveMission` est dérivé, pas stocké.

### Vérification
- Ouvrir une mission → cliquer Assigner → cocher/décocher un membre → les coches dans la liste et les avatars du bouton se mettent à jour immédiatement, sans fermer le drawer.
