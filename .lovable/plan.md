## Contexte

Aujourd'hui, `InviteReaderDialog` ne sait que créer une invitation par email (nouveau compte). Pour un utilisateur déjà inscrit dans `community_profiles`, il n'y a pas de chemin direct : il faudrait lui envoyer un lien token, qu'il consommerait alors qu'il est déjà connecté — friction inutile.

## Objectif

Permettre à l'admin, depuis le même dialogue, de **rattacher directement un marcheur existant** comme « Lecteur invité » d'un événement, sans passer par un token email.

## UX proposée

Dans `InviteReaderDialog`, ajouter en haut un toggle à 2 modes :

```text
( • ) Marcheur existant     ( ) Nouvelle personne (email)
```

- **Mode "Marcheur existant"** : un champ de recherche (combobox) qui filtre `community_profiles` par prénom/nom/email. Sélection → bouton « Ajouter comme Lecteur ». Pas d'email envoyé (ou option à cocher pour notifier).
- **Mode "Nouvelle personne"** : formulaire actuel inchangé (prénom + email + envoi email).

## Étapes

### 1. Backend — RPC `add_existing_reader_to_event`
Nouvelle fonction SECURITY DEFINER, admin-only :
- Input : `_event_id`, `_user_id`
- Vérifie que l'appelant est admin
- Vérifie que `_user_id` n'est pas déjà participant validé (sinon retour `already_participant`)
- Insère dans `event_invited_readers` (ON CONFLICT DO NOTHING) avec `invitation_id = NULL`, `added_by_user_id = auth.uid()`
- Met `community_profiles.statut = 'invite'` si pas de participation validée
- Retour JSONB `{ success, already_reader, already_participant }`

### 2. Backend — RPC `search_community_profiles_for_invite`
Admin-only, retourne max 20 profils (id, user_id, prenom, nom, email, avatar_url) filtrés par texte (`ILIKE` sur prenom/nom + email via jointure `auth.users` côté SECURITY DEFINER), excluant ceux déjà readers ou participants de l'événement passé en paramètre.

### 3. Edge function — optionnelle
Pas nécessaire : tout passe par RPC. Pas d'email envoyé par défaut dans ce mode.

### 4. Frontend — `InviteReaderDialog.tsx`
- Ajouter un `Tabs` ou `RadioGroup` en haut : "Marcheur existant" / "Nouvelle personne"
- Mode existant : `Command` (cmdk) avec debounce sur la recherche, appelle `search_community_profiles_for_invite`, affiche avatar + nom + email
- Bouton « Ajouter comme Lecteur » → appelle `add_existing_reader_to_event`
- Toast de succès + invalidation de la liste (`invalidateKey`)
- Gestion des cas : déjà reader (info), déjà participant (warning + propose d'ouvrir l'onglet Participants)

### 5. Frontend — `InvitedReadersTab.tsx`
Aucune modif structurelle : la liste se rafraîchira via `invalidateKey`. Afficher distinctement les readers ajoutés manuellement (badge « Ajouté manuellement » quand `invitation_id IS NULL`).

## Détails techniques

- La table `event_invited_readers` a déjà `invitation_id` nullable et `added_by_user_id` → schéma compatible, **aucune migration de table** n'est nécessaire.
- Pour la recherche par email, la RPC SECURITY DEFINER lit `auth.users.email` (jointure sur `user_id`) — c'est sûr car la fonction vérifie le rôle admin avant.
- Limiter la recherche à 20 résultats et exiger au moins 2 caractères pour éviter de scanner toute la table.

## Hors scope

- Notification email au marcheur existant (peut être ajoutée en v2 via un toggle "Prévenir par email").
- Sélection multiple (pour ajouter plusieurs marcheurs en bloc) — à voir si besoin remonte.
