## Problème

Dans l'onglet **Lecteurs invités** d'une fiche événement, il n'existe aucune action pour retirer un invité. La seule action disponible aujourd'hui est « Promouvoir ». Si on se trompe d'email, ou si l'on veut nettoyer après un test d'onboarding (typiquement `aurelien.dript@gmail.com` sur DEVIAT), l'invité reste collé à l'événement sans solution depuis l'UI.

## Objectif

Ajouter une action **Retirer** par ligne dans l'onglet *Lecteurs invités*, qui supprime proprement l'invitation dans toutes les tables liées, avec garde-fous.

## Tables impactées

Pour un même `(event_id, user_id)` invité, plusieurs lignes peuvent exister :

- `event_invited_readers` — la ligne principale (toujours présente)
- `event_invitations` — le token d'invitation initial (présent si `invite_source = 'invitation'`, peut avoir été consommé)
- `marche_participations` — uniquement si l'invité a déjà été **promu** Participant (`promoted_to_participant_at` non null)
- `community_profiles.statut` — repassé éventuellement à `'lecteur'` si on retire l'unique événement où il était promu

## Règles de cascade

1. **Invité non promu** (cas standard, ex. Aurélien) :
   - Supprimer la ligne `event_invited_readers`
   - Si `invitation_id` est renseigné et que l'invitation n'a pas été utilisée pour d'autres événements : supprimer (ou expirer) la ligne `event_invitations` correspondante
2. **Invité déjà promu Participant** :
   - **Bloquer la suppression depuis cet onglet** et afficher un message clair : « Ce Lecteur a été promu Participant. Désinscrivez-le d'abord depuis l'onglet Participants. »
   - Évite de supprimer en cascade des contributions/photos rattachées à la participation
3. **Source `auto_new_signup`** (ajouté automatiquement à la création de compte) :
   - Suppression autorisée comme cas 1, mais avec un avertissement secondaire : « Cet invité a été ajouté automatiquement à l'inscription du compte. Il pourra être réajouté manuellement si besoin. »

## Implémentation

### 1. Edge function `event-invited-reader-delete`

Nouvelle fonction admin-only (pattern identique à `event-invited-reader-promote`) :

- Entrée : `{ event_id, invited_reader_id }`
- Vérifie `check_is_admin_user`
- Recharge la ligne `event_invited_readers` ; refuse si `promoted_to_participant_at` non null (retourne `{ error: 'already_promoted' }`)
- `DELETE` sur `event_invited_readers` (par `id`)
- Si `invitation_id` présent : supprime la ligne `event_invitations` correspondante (le token devient inutile)
- Retourne `{ success: true }`

### 2. UI — `InvitedReadersTab.tsx`

- Ajouter un bouton icône `Trash2` à droite de « Promouvoir » (ou à la place quand déjà promu n'est pas le cas, sinon désactivé avec tooltip)
- `AlertDialog` de confirmation listant : prénom, nom, email, événement
- Mutation appelant la nouvelle edge function
- En cas de succès : `toast.success` + invalidation de :
  - `['event-invited-readers', eventId]`
  - `['community-invited-events', userId]`
  - `['marcheur-events', userId]`
  - `['marche-participations', eventId]` (cohérence, même si non touché ici)
- En cas d'erreur `already_promoted` : toast explicite « Lecteur déjà promu — gérer depuis Participants »

### 3. Pas de changement DB

Aucune nouvelle migration : on réutilise les tables et droits existants (l'edge function utilise `service_role`).

## Tests manuels

1. Inviter `aurelien.dript@gmail.com` sur DEVIAT, puis le retirer → la ligne disparaît de *Lecteurs invités*, et l'événement disparaît de l'espace Marcheur d'Aurélien
2. Promouvoir un invité, puis tenter de le retirer → bouton désactivé / message « déjà promu »
3. Retirer un invité dont `invite_source = 'invitation'` (avec token) → la ligne `event_invitations` est aussi supprimée

## Hors scope

- La désinscription d'un Participant promu reste gérée dans l'onglet *Participants* existant
- Aucun changement aux panneaux *Orphelins* (déjà couverts par les précédentes itérations)