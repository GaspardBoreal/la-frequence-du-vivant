## Objectif

Outiller proprement le cycle de test d'onboarding pour `aurelien.dript@gmail.com` (et tout futur compte de test) en deux briques réutilisables, puis dérouler le scénario de validation.

## Brique 1 — Edge function `admin-delete-user-cascade`

Nouvelle fonction admin-only (pattern `validateAuth` + `check_is_admin_user`) qui supprime un compte de bout en bout dans le bon ordre, en une transaction logique côté service_role.

**Entrée :** `{ user_id?: string, email?: string }` (au moins un des deux ; résolution via `auth.admin.listUsers` si seul l'email est fourni).

**Garde-fous :**
- Refus si le user_id correspond à un admin (`has_role(user_id, 'admin')`) — pas de suicide accidentel.
- Dry-run optionnel `{ dry_run: true }` qui retourne juste le décompte par table sans rien supprimer.

**Ordre de suppression (cascade explicite) :**

1. `marche_participations` where user_id
2. `event_invited_readers` where user_id
3. `event_invitations` where invited_user_id (tokens qui pointaient sur lui)
4. `marcheur_observations` + `marcheur_media` + `marcheur_media_gps_audit` rattachés (FK déjà cascade pour la plupart, on vérifie)
5. `exploration_curations` où il apparaît comme marcheur attribué → on dé-attribue (mise à NULL), on ne supprime pas la curation
6. `community_profiles` where user_id
7. `auth.users` via `supabase.auth.admin.deleteUser(user_id)` en dernier

**Retour :** `{ success, deleted: { table: count, ... }, user_id, email }`

## Brique 2 — Étendre la maintenance « Orphelins »

Le panneau `OrphanInvitedReadersPanel` couvre déjà `event_invited_readers`. On ajoute deux RPC sœurs et deux sections au même panneau (ou trois sous-panneaux empilés sous le même titre « Maintenance · Données orphelines »).

**Nouvelles RPC + actions admin :**

- `admin_orphan_event_invitations()` + `admin_delete_orphan_event_invitations(p_ids uuid[])` — tokens dont `invited_user_id` n'a plus ni `community_profiles` ni `auth.users` ; renvoie token, email cible, événement, date.
- `admin_orphan_marche_participations()` + `admin_delete_orphan_marche_participations(p_ids uuid[])` — participations dont `user_id` n'existe plus côté auth. **Garde-fou** : on n'auto-supprime que si la participation n'a aucune contribution rattachée (sinon on flague pour revue manuelle).

**UI :** 3 cartes dans `CommunityProfilesAdmin` → onglet Activités, sous un même bandeau « Maintenance · Données orphelines », avec compteur global. Sélection multiple + confirmation alertDialog (pattern déjà en place).

## Scénario de validation (à dérouler après livraison)

1. **Toi** : ouvres Admin Communauté → onglet Activités → bouton « Supprimer compte test » sur `aurelien.dript@gmail.com` (lance la nouvelle edge function en dry-run d'abord, puis pour de vrai).
2. **Toi** : lances « Actualiser » sur les 3 panneaux orphelins → aucun reliquat ne doit apparaître pour cet email/UUID. Si oui, sélection + suppression.
3. **Toi** : refais l'inscription d'`aurelien.dript@gmail.com` via la page publique.
4. **Vérifications attendues :**
   - Le compte apparaît automatiquement en `event_invited_readers` sur tous les events avec `share_new_signups=true` (trigger `auto_new_signup`).
   - Dans `Mon espace → Marches`, ces marches apparaissent dans la section « Lecteur invité » (pas Participant).
   - Sur la fiche événement admin (DEVIAT), Aurélien apparaît uniquement dans l'onglet **Lecteurs invités**, jamais dans **Marcheurs → Marcheurs**.
   - Aurélien accepte l'invitation depuis son espace → passe en Participant → disparaît de « Lecteurs invités », apparaît dans « Marcheurs ».
5. **Cycle complet validé** → on peut clore.

## Hors scope

- Pas de changement à la logique de promotion existante (`event-invited-reader-promote`).
- Pas de changement au trigger `auto_new_signup` (déjà conforme).
- Pas de désinscription auto en cas de rétrogradation — on garde la règle « promote-only ».

## Détails techniques

- Edge function : `supabase/functions/admin-delete-user-cascade/index.ts`, pattern identique à `event-invited-reader-promote` (validateAuth + service_role client + JSON in/out + CORS).
- Migration : 2 RPC SECURITY DEFINER `admin_orphan_*` + 2 RPC `admin_delete_orphan_*` (revérifient l'absence côté auth.users et community_profiles avant DELETE, comme l'existant).
- Composants : nouveau `OrphanEventInvitationsPanel.tsx` + `OrphanMarcheParticipationsPanel.tsx` calqués sur `OrphanInvitedReadersPanel.tsx` ; bouton « Supprimer compte test » dans un nouveau bandeau admin (mini-form email + dry-run/confirm).
- Invalidations React Query : `['orphan-invited-readers']`, `['orphan-event-invitations']`, `['orphan-marche-participations']`, `['exploration-pending-invitees']`.
