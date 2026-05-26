# Fix garde admin sur les RPC d'activités orphelines

## Cause

J'ai utilisé `has_role(auth.uid(), 'admin'::app_role)` mais ce projet n'a ni la fonction `has_role` ni l'enum `app_role`. La convention locale est `public.check_is_admin_user(uuid) RETURNS boolean` (vue dans toutes les autres migrations admin).

## Correction

Migration qui remplace `CREATE OR REPLACE FUNCTION` sur les deux RPC :

- `admin_orphan_activity_logs()` : remplacer la garde par `IF NOT public.check_is_admin_user(auth.uid()) THEN raise…`
- `admin_delete_orphan_activity_logs(uuid[])` : idem.

Aucun changement de signature, aucun changement côté frontend. Le panneau « Activités orphelines » se chargera correctement et affichera les 3 user_ids orphelins identifiés.
