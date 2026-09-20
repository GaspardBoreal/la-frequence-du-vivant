# Corriger l'erreur de clé étrangère lors de la nomination d'un administrateur

## Problème
Le message « insert or update on table admin_audit_log violates foreign key constraint admin_audit_log_admin_user_id_fkey » apparaît au moment de nommer Laurence Karki administratrice.

Cause vérifiée en base : la colonne `admin_audit_log.admin_user_id` référence `admin_users.id` (l'identifiant interne de la ligne administrateur), alors que les fonctions `grant_admin_access` et `revoke_admin_access` y écrivent `auth.uid()` (l'identifiant du compte utilisateur). La nomination elle-même réussit mais l'écriture au journal échoue, ce qui fait échouer toute la transaction.

## Correction
Migration qui recrée les deux fonctions avec la bonne écriture au journal :

1. Retrouver la ligne `admin_users` du compte qui agit (à partir de `auth.uid()`) et prendre son `id`.
2. Écrire cet `id` dans `admin_audit_log.admin_user_id`.
3. Comportement inchangé sinon : seul `gaspard.boreal@gmail.com` (compte fondateur) peut nommer ou retirer un accès ; le compte fondateur ne peut pas retirer son propre accès ; message d'erreur clair si le compte qui agit n'est pas répertorié dans `admin_users`.

## Vérification
Après la migration : Administration → Communauté, chercher « Karki », bouclier bleu, confirmer « Karki » → plus d'erreur, badge Admin visible, compteur Admis mis à jour, et une ligne apparaît dans le journal d'audit.

## Détails techniques
- `CREATE OR REPLACE FUNCTION public.grant_admin_access(_user_id uuid)` et `public.revoke_admin_access(_user_id uuid)` : ajout d'une variable `v_actor_admin_id uuid` alimentée par `SELECT id FROM public.admin_users WHERE user_id = auth.uid()` ; `INSERT INTO public.admin_audit_log(admin_user_id, action, details)` utilise `v_actor_admin_id`.
- Aucun changement de schéma, aucun changement côté écran.
