# Cron quotidien — Backfill iNaturalist marcheurs

## Objectif
Chaque nuit, ré-attacher automatiquement les nouvelles observations iNaturalist de tous les marcheurs ayant un compte iNat lié, sur l'ensemble de leurs participations validées.

## Ce qui sera créé

### 1. Edge function `backfill-marcheur-inat-batch`
- **Auth** : refuse toute requête sans header `X-Cron-Secret` valide (comparé à `Deno.env.get('CRON_SHARED_SECRET')`).
- **Logique** :
  1. Lit avec service role les couples `(user_id, exploration_id)` éligibles : `marche_participations` (statut validé) jointes à `community_profile_science_accounts` où `network = 'inaturalist'`.
  2. Pour chaque couple, invoque la fonction existante `backfill-marcheur-inaturalist` avec `source: 'cron_daily'` (idempotente, ne dédoublonne pas les obs déjà rattachées).
  3. Throttle : pause 250 ms entre chaque appel, plafond 200 couples/run pour rester sous le timeout edge.
  4. Insère un résumé final dans `marcheur_backfill_log` (`source = 'cron_daily_summary'`, totaux : couples traités, obs ajoutées, erreurs).
- **Aucune modification** de la fonction existante `backfill-marcheur-inaturalist`.

### 2. Job `pg_cron`
- Planning : `30 1 * * *` UTC → 03:30 Paris en été, 02:30 en hiver (heure creuse).
- Action : `net.http_post` vers `…/functions/v1/backfill-marcheur-inat-batch` avec :
  - `apikey` : anon key
  - `X-Cron-Secret` : valeur de `CRON_SHARED_SECRET` (lue via `vault.decrypted_secrets` ou injectée dans la requête SQL)
- Extensions `pg_cron` et `pg_net` déjà actives sur le projet (vérifié).

### 3. Stockage du secret côté SQL
Le secret `CRON_SHARED_SECRET` est déjà ajouté côté edge functions. Pour que le cron SQL puisse l'envoyer dans le header, on l'enregistre aussi dans `vault.create_secret(...)` sous le nom `cron_shared_secret`, puis le cron le lit via `vault.decrypted_secrets`.

## Hors scope
- Aucun bouton ni hook front.
- Pas de changement dans la fonction `backfill-marcheur-inaturalist`.
- Pas de modification des triggers de participation existants.

## Détails techniques

**Fichiers / objets touchés**
- `supabase/functions/backfill-marcheur-inat-batch/index.ts` (nouveau)
- Migration SQL : insertion dans `vault` + `cron.schedule('backfill-marcheur-inat-daily', …)`
- Aucune modification du schéma de tables existant.

**Critères d'éligibilité d'un couple `(user_id, exploration_id)`**
```
marche_participations p
  JOIN community_profile_science_accounts s
    ON s.user_id = p.user_id AND s.network = 'inaturalist'
WHERE p.statut IN ('validee', 'confirmee')   -- à confirmer avec les valeurs réelles
```
~12 couples actuellement éligibles (compté précédemment).

**Observabilité**
- Logs edge function visibles dans le dashboard Supabase.
- Table `marcheur_backfill_log` filtrable par `source = 'cron_daily'` ou `'cron_daily_summary'`.
