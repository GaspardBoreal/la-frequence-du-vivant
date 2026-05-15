
# Lecteur invité — Plan d'implémentation

## Vision

Un marcheur (ou un admin) émet une invitation depuis un événement. Le destinataire reçoit un email avec un **token d'invitation** (30 j, usage unique). À l'inscription, son compte est créé en rôle `marcheur_en_devenir` avec un nouveau **statut `invité`**, et il est rattaché à l'événement source comme **Lecteur invité** (lecture seule). L'admin peut, depuis la fiche événement, le promouvoir en Participant.

---

## Étape 1 — Modèle de données

Nouvelles tables / colonnes :

- `event_invitations`
  - `id`, `event_id` (fk marche_events), `invited_by_user_id`, `invited_email` (lower), `invited_prenom`,
  - `token` (uuid unique), `expires_at` (default now()+30d), `consumed_at`, `consumed_by_user_id`,
  - `created_at`.
- `event_invited_readers` (rattachement effectif après inscription, ou ajout manuel)
  - `id`, `event_id`, `user_id`, `invitation_id` nullable, `created_at`, `promoted_to_participant_at` nullable.
  - Unique (`event_id`, `user_id`).
- `community_profiles.statut` (nouvelle colonne text) — valeurs : `invité`, `marcheur` (défaut). Indépendante du `role` (qui reste `marcheur_en_devenir`).

RLS :
- `event_invitations` : insert pour marcheur authentifié + admin ; select restreint au créateur ou admin ; UPDATE consumed_at via RPC `consume_event_invitation(token)` SECURITY DEFINER.
- `event_invited_readers` : select admin + le user concerné + RPC dédiée pour la fiche événement ; insert via RPC consume + admin.
- Politique de **lecture étendue pour Lecteur invité** : modifier les RLS existantes (marche_events, marches, marcheur_observations, event_testimonies, medias liés, profils participants) pour autoriser SELECT si `EXISTS (event_invited_readers WHERE user_id = auth.uid() AND event_id = X)`. Aucun INSERT/UPDATE/DELETE ajouté pour ce rôle.

Helper SQL : `is_invited_reader(_event_id uuid, _user_id uuid) returns boolean SECURITY DEFINER`.

## Étape 2 — Edge functions

- `event-invitation-create` : auth requis (marcheur/admin), payload `{ event_id?, invited_email, invited_prenom }` → crée row + envoie email transactionnel (via `send-transactional-email`, template `event-reader-invitation`) avec lien `https://app/invitation?token=…`.
- `event-invitation-consume` : appelé après signup OAuth/email, payload `{ token }` → valide expiration/non-consommé, crée `event_invited_readers`, met `community_profiles.statut='invité'` si pas déjà.
- `event-invited-reader-promote` (admin) : passe le user en participant via `marche_event_participations` insert + `statut='marcheur'`.

## Étape 3 — UI invitation côté marcheur

Réutiliser le bouton actuel "Inviter un marcheur" (MarcheursTab + admin) :
- Modal simplifiée : prénom, email, (optionnel) sélection de l'événement source si plusieurs (préselectionné = contexte courant).
- Submit → `event-invitation-create`. Confirmation discrète + lien copiable.

## Étape 4 — Page publique `/invitation`

- Lecture du `token` en query.
- Si user non connecté → écran "Vous êtes invité à découvrir l'événement X" + formulaire `prénom + email + mot de passe` (signup) ou bouton "Se connecter".
- Après auth réussie → appelle `event-invitation-consume`, redirige vers la fiche événement en mode lecture invité.
- Token invalide/expiré → message clair + CTA contact.

## Étape 5 — Sous-onglets dans `MarcheEventDetail`

Ajouter un Tabs interne au bloc Participants actuel :

```text
[ Participants (12) ] [ Lecteurs invités (3) ]
```

Onglet **Lecteurs invités** :
- Tableau colonnes : Prénom · Nom · Email · Date d'inscription · Statut (Invité / Inscrit) · Source (invitation / ajout manuel) · Invité par · Actions (Promouvoir en Participant, Retirer).
- Bouton **Ajouter manuellement** : modal prénom+email, checkbox "Envoyer l'email d'invitation".
- Bouton **Inviter** (réutilise étape 3 pré-rempli avec event courant).
- Liste alimentée par jointure `event_invited_readers` + `event_invitations` non consommées.

## Étape 6 — Filtres et exclusions

- `CommunityProfilesAdmin` : ajout d'un filtre statut multi-select `Invité` / `Ayant fait une marche` (basé sur `community_profiles.statut` + EXISTS participations validées).
- Onglet **Profils** : exclure `statut='invité' AND aucune participation validée` des KPIs et graphes existants (filtre WHERE dans `useCommunityImpactAggregates` + agrégats serveur).

## Étape 7 — Permissions runtime

- Hook `useIsInvitedReaderForEvent(eventId)`.
- Dans la fiche événement et marches associées, masquer tous les CTA de contribution (upload, témoignage, édition) si invited reader.
- Bandeau discret "Vous consultez en tant que Lecteur invité — promotion possible auprès de l'organisateur".

## Étape 8 — Promotion par l'admin

- Action ligne "Promouvoir" → `event-invited-reader-promote` → suppression de `event_invited_readers`, insertion `marche_event_participations` (statut validé), `community_profiles.statut='marcheur'`. Toast + invalidation queries.

## Étape 9 — QA

- Création invitation depuis admin & depuis marcheur.
- Inscription via lien : token valide, expiré, déjà consommé, email déjà compte existant (alors → seulement rattachement).
- Lecture des données événement : un Lecteur invité voit synthèse, marches, profils, témoignages ; ne voit aucun CTA d'écriture.
- Filtres & KPIs : statut Invité visible, indicateurs Profils inchangés.
- Promotion : statut bascule, fiche bascule sous Participants.

---

## Détails techniques

- Réutilise l'infra `email_domain--scaffold_transactional_email` (template `event-reader-invitation` avec props `{ inviterName, eventTitle?, inviteUrl }`).
- Table `community_profiles` : `statut` colonne nullable; backfill `statut='marcheur'` pour profils ayant ≥1 participation validée.
- Pas de breaking change sur URLs publiques.
- Tous les changements RLS via RPC `is_invited_reader` pour éviter récursion.
