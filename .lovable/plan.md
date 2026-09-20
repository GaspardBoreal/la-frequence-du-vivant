# Nommer un administrateur depuis l'écran Communauté

Aujourd'hui aucun écran ne permet de donner l'accès administrateur : les deux comptes administrateurs actuels (Gaspard Boréal, Victor Boixeda) ont été créés directement en base. Ce plan ajoute l'action dans le back-office, réservée à vous seul.

## Ce qui sera ajouté

1. **Action « Nommer administratrice · administrateur »** sur chaque ligne du tableau des marcheurs (/admin/community), à côté de « Éditer ».
   - Visible uniquement pour le compte fondateur `gaspard.boreal@gmail.com`.
   - Masquée pour les marcheurs qui portent déjà le badge Admin ; ceux-là reçoivent à la place l'action **« Retirer l'accès administrateur »**.
   - Le compte fondateur ne peut pas se retirer lui-même l'accès.

2. **Fenêtre de confirmation** rappelant ce que l'accès implique (toutes les pages d'administration, données personnelles des marcheurs, suppression de comptes, envois d'e-mails) et demandant de saisir le nom de famille de la personne pour débloquer le bouton.

3. **Après validation** : le badge Admin apparaît immédiatement sur la ligne, le compteur « Admins » se met à jour, et l'opération est inscrite au journal d'audit administrateur (qui a nommé qui, et quand).

4. **Cas de Laurence Karki** : une fois la fonctionnalité en place, il suffira d'ouvrir /admin/community, de chercher « Karki », de cliquer sur l'action et de confirmer. Rien à faire côté base de données.

## Détails techniques

- Migration : deux fonctions `SECURITY DEFINER`
  - `grant_admin_access(_user_id uuid)` — vérifie que `auth.uid()` correspond à un compte présent dans `admin_users` dont l'e-mail `auth.users` est `gaspard.boreal@gmail.com`, résout l'e-mail cible depuis `auth.users`, insère dans `admin_users` (`on conflict do nothing`), écrit une entrée dans `admin_audit_log`, renvoie un JSON `{ ok, message }`.
  - `revoke_admin_access(_user_id uuid)` — même garde, refuse la cible `auth.uid()` (pas d'auto-retrait), supprime la ligne `admin_users`, journalise.
  - `EXECUTE` accordé à `authenticated` uniquement ; toute la sécurité reste côté serveur (une personne non fondatrice reçoit un refus explicite même si elle appelle la fonction directement).
- `src/pages/CommunityProfilesAdmin.tsx` : nouveau composant `GrantAdminDialog.tsx` (confirmation + saisie du nom), appel des RPC, invalidation des clés React Query `community-admins-set` et `community-profiles-admin`.
- Garde d'affichage côté écran : e-mail du compte connecté (déjà disponible via `useAuthContext`) comparé à `gaspard.boreal@gmail.com` ; l'adresse fondatrice est définie dans une constante unique pour pouvoir évoluer plus tard.
- Aucun changement sur `check_is_admin_user`, les routes admin ou les politiques existantes.
