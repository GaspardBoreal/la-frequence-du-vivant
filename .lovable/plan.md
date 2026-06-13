## Diagnostic

Les logs de l'edge function `admin-create-marcheur` montrent :

```
duplicate key value violates unique constraint "community_profiles_user_id_key"
```

**Cause racine** : un trigger Postgres `on_auth_user_created_community` sur `auth.users` appelle `handle_new_community_user()` qui insère automatiquement une ligne dans `community_profiles` à chaque signup (avec `on conflict do nothing`).

Flow actuel cassé :
1. L'admin crée le marcheur → `auth.admin.inviteUserByEmail` (ou `createUser`)
2. Le trigger crée déjà un `community_profiles` minimal (prenom/nom depuis metadata, role=`marcheur_en_devenir`)
3. L'edge function fait ensuite un `.insert()` → conflit, rollback, message d'erreur côté UI
4. L'utilisateur auth est supprimé mais en pratique le profil créé par le trigger reste orphelin si la suppression échoue

## Correctif

**Fichier** : `supabase/functions/admin-create-marcheur/index.ts`

Remplacer le `.insert()` du profil par un `.upsert({...}, { onConflict: 'user_id' }).select().single()`. Cela :
- met à jour la ligne créée par le trigger avec toutes les valeurs fournies (ville, téléphone, csp, genre, date_naissance, role…)
- reste idempotent si le trigger est désactivé un jour
- supprime le besoin de rollback dans le cas nominal (on garde le rollback en cas d'erreur réelle d'upsert)

Aucun changement SQL nécessaire — le trigger reste utile pour les signups directs hors admin.

## Hors scope

- Pas de refonte du formulaire UI
- Pas de modification du trigger DB (il protège les signups publics)
