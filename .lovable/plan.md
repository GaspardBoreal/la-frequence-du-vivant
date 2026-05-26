## Diagnostic

Les deux occurrences « Aurélien DRIPT » sur les marches DEVIAT viennent de **3 lignes orphelines dans `exploration_marcheurs`** dont les `user_id` n'existent plus dans `auth.users` :

| exploration_id | marcheur_id | user_id (mort) |
|---|---|---|
| `20dd3be8…5094` | `620bbbc7…` | `3ad53b2b…` |
| `70fcd8d1…3437` | `6670e63d…` | `ced8277b…` |
| `20dd3be8…5094` | `7282f4ac…` | `df57cd31…` |

→ La marche `20dd3be8…5094` en a deux (d'où le doublon « copie 1 / copie 2 ») et la marche `70fcd8d1…3437` en a une.

### Cause racine

L'edge function `admin-delete-user-cascade` ne supprime que 4 tables :
`marche_participations`, `event_invited_readers`, `event_invitations`, `community_profiles`.

Or **17 autres tables `public` portent une colonne `user_id`** (parmi lesquelles `exploration_marcheurs`, `marcheur_medias`, `marcheur_observations` (via `marcheur_id`), `marcheur_audio`, `marcheur_textes`, `marcheur_activity_logs`, `event_testimonies`, `kigo_entries`, `quiz_responses`, `frequences_log`, `sound_recordings`, `exploration_convivialite_photos`, `marcheur_species_tags`, `marcheur_backfill_log`, `curation_marcheurs.curated_by_user_id`).

Aucune n'a de FK `ON DELETE CASCADE` vers `auth.users`. Quand on supprime le compte auth, tout reste — d'où l'apparition fantôme dans les vues marcheurs.

## Plan de correction

### 1. RPC SECURITY DEFINER `admin_purge_user_cascade(target_user_id uuid)`

Centralise le wipe atomique côté Postgres (plus fiable que des `delete` enchaînés en edge) :

```text
1. Garde-fou : raise si target = admin
2. delete from marcheur_observations
     where marcheur_id in (select id from exploration_marcheurs where user_id = target)
3. delete from marcheur_medias        where user_id = target
   delete from marcheur_audio         where user_id = target
   delete from marcheur_textes        where user_id = target
   delete from marcheur_species_tags  where user_id = target
   delete from marcheur_activity_logs where user_id = target
   delete from marcheur_backfill_log  where user_id = target
4. delete from exploration_marcheurs  where user_id = target
5. delete from exploration_convivialite_photos where user_id = target
   delete from event_testimonies      where user_id = target
   delete from kigo_entries           where user_id = target
   delete from quiz_responses         where user_id = target
   delete from frequences_log         where user_id = target
   delete from sound_recordings       where user_id = target
6. update curation_marcheurs set curated_by_user_id = null where curated_by_user_id = target
7. delete from marche_participations  where user_id = target
   delete from event_invited_readers  where user_id = target
   delete from event_invitations where consumed_by_user_id = target
8. delete from community_profiles     where user_id = target
9. return jsonb des counts par table
```

Grant `EXECUTE` à `service_role` uniquement.

### 2. Edge function `admin-delete-user-cascade` (refacto)

- Appelle la nouvelle RPC en lieu et place du bloc actuel de `delete`.
- Le `dry_run` appelle une seconde RPC `admin_count_user_cascade(target_user_id)` qui renvoie les `count(*)` par table sans rien supprimer.
- Étape finale inchangée : `auth.admin.deleteUser(userId)` + suppression `event_invitations` par email.

### 3. Cleanup immédiat des 3 fantômes Aurélien

Migration ponctuelle : `select admin_purge_user_cascade(uid)` pour chacun des 3 `user_id` ci-dessus (ces comptes auth n'existent déjà plus, mais leurs miettes oui).

### 4. Nouveau panneau « Maintenance · Marcheurs orphelins »

Dans `CommunityProfilesAdmin` onglet Activités, à côté des autres panneaux d'orphelins :

- Liste les `exploration_marcheurs` dont `user_id is not null` et absent de `auth.users` (via RPC `admin_orphan_exploration_marcheurs`).
- Colonnes : exploration · prenom/nom · created_at · nb observations/medias rattachés.
- Action « Purger » par ligne ou en lot → réutilise `admin_purge_user_cascade`.

## Validation

1. Recharger `/m/deviat-jardin-monde…` onglet Marcheurs → plus aucune carte « Aurélien DRIPT ».
2. Idem sur `/m/deviat-marcher-sur-un-sol-qui-respire…`.
3. Aperçu dans « Maintenance · Supprimer un compte de test » d'un futur compte test affiche bien les counts pour les 17 tables.
4. Le panneau « Marcheurs orphelins » reste à 0 ligne après purge.

## Détails techniques

- La RPC reste idempotente : ré-exécution sans erreur si déjà vide.
- `curation_marcheurs.curated_by_user_id` est mis à `null` (pas supprimé) pour conserver les curations validées.
- `admin_users` / `team_members` / `user_roles` : non touchés, le garde-fou « target = admin » bloque la purge en amont.
- Les RPC sont ajoutées à `src/integrations/supabase/types.ts` automatiquement après migration.
