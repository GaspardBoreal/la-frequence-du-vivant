# Plan — Cron quotidien de re-synchro iNaturalist marcheurs

## Objectif
Mettre en place une re-synchro automatique quotidienne pour que toute nouvelle observation iNaturalist d'un marcheur (ex: l'orchidée de Laurence) soit rattachée à son carnet sans intervention manuelle.

## Architecture

```text
┌─ pg_cron (03:30 Europe/Paris, daily)
│    └─ select cron.schedule(...)
│         └─ HTTP POST → backfill-marcheur-inaturalist-batch (edge function)
│              └─ pour chaque (user_id, exploration_id) éligible :
│                   POST → backfill-marcheur-inaturalist (existant, idempotent)
└─ table marcheur_backfill_log : trace de chaque run
```

## Critères d'éligibilité scannés par le batch
Pour chaque `community_profile` ayant un compte iNaturalist lié, on relance le backfill sur **chaque exploration** où ce marcheur a au moins une participation. C'est exactement le périmètre couvert par les triggers existants.

```sql
SELECT DISTINCT mp.user_id, me.exploration_id
FROM marche_participations mp
JOIN marche_events me ON me.id = mp.marche_event_id
JOIN community_profiles cp ON cp.user_id = mp.user_id
JOIN community_profile_science_accounts csa
  ON csa.profile_id = cp.id AND csa.network = 'inaturalist'
WHERE me.exploration_id IS NOT NULL;
```

## Étapes d'implémentation

1. **Migration SQL** :
   - Activer `pg_cron` et `pg_net` (idempotent).
   - Planifier `daily-marcheur-inat-backfill` à `30 1 * * *` UTC (= 03:30 Paris en heure d'été, 02:30 en heure d'hiver — créneau creux).
   - Le job appelle l'edge function batch via `net.http_post`.

2. **Nouvelle edge function** `backfill-marcheur-inat-batch` :
   - Service-role only (validée par header partagé `X-Cron-Secret`).
   - Lit la liste éligible.
   - Pour chaque couple `(user_id, exploration_id)` : invoke `backfill-marcheur-inaturalist` avec `source = 'cron_daily'`.
   - Throttling simple : pause 250 ms entre appels, limite 200 couples par run (pour rester sous 60 s d'edge timeout). Si dépassé, le run du lendemain prendra le relais (déjà idempotent côté insert).
   - Insère un résumé dans `marcheur_backfill_log` (source `cron_daily_summary`).

3. **Secret** : `CRON_SHARED_SECRET` (généré côté Lovable, utilisé par le cron SQL et vérifié par la fonction batch).

## Sécurité
- La fonction batch refuse toute requête sans `X-Cron-Secret` valide.
- Pas d'exposition côté front.
- Le service_role n'est utilisé que côté edge.

## Observabilité
- Visible dans le dashboard admin via le `marcheur_backfill_log` existant (source `cron_daily` et `cron_daily_summary`).
- L'orchidée de Laurence apparaîtra dès le premier run quotidien — et reste dispo manuellement via le bouton existant côté admin si besoin immédiat.

## Hors scope (volontairement)
- Pas de bouton UI dédié (option 2).
- Pas de hook front (option 3).
- Pas de modification de la fonction `backfill-marcheur-inaturalist` existante (déjà idempotente).