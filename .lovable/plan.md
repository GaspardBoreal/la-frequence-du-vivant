
## Corriger définitivement la vue "mois dernier" du graphique d'activités

### Diagnostic

La vue "mois dernier" reste KO car le problème n'est pas seulement le `JOIN`, mais aussi la façon dont la série temporelle est générée.

Aujourd'hui la fonction SQL utilise :

```sql
generate_series(v_start, v_end, interval '1 day')
```

avec `v_start` et `v_end` en `timestamptz`.

Quand cette série traverse le changement d'heure Europe/Paris, les points générés dérivent en heure locale (ex. minuit puis 01:00). Ensuite la jointure compare ces repères à des buckets quotidiens tronqués en heure locale (`date_trunc('day', created_at AT TIME ZONE v_tz)`), donc certaines journées ne matchent plus. C'est exactement cohérent avec le symptôme observé : "7 derniers jours" fonctionne, mais "mois" casse dès qu'on traverse la bascule DST.

Le diff précédent a corrigé une partie du problème, mais pas la racine complète.

### Correctif à appliquer

Créer une nouvelle migration SQL pour réécrire `public.get_activity_connections_chart` avec cette stratégie :

1. Calculer les bornes en heure locale Paris.
2. Générer la série en `timestamp without time zone` pour les vues jour/semaine/mois.
3. Agréger les logs dans le même référentiel local.
4. Faire le `LEFT JOIN` entre série locale et buckets locaux.
5. Ne convertir/formatter qu'au moment d'afficher `period_label`.

### Forme attendue du correctif

Pour `month`, `7d`, `quarter`, `semester`, `year`, la logique doit ressembler à ceci :

```sql
local_series AS (
  SELECT generate_series(v_local_start, v_local_end, v_interval) AS bucket
),
counts AS (
  SELECT
    date_trunc(v_trunc, created_at AT TIME ZONE v_tz) AS bucket,
    count(*) AS cnt
  FROM marcheur_activity_logs
  WHERE event_type = 'session_start'
    AND created_at >= v_start_utc
    AND created_at < v_end_utc
  GROUP BY 1
)
SELECT
  to_char(local_series.bucket, v_fmt) AS period_label,
  COALESCE(counts.cnt, 0)
FROM local_series
LEFT JOIN counts ON counts.bucket = local_series.bucket
ORDER BY local_series.bucket;
```

L'idée clé : ne plus utiliser `generate_series(... timestamptz ..., '1 day')` pour les périodes longues.

### Portée

- `today` et `yesterday` peuvent rester en logique horaire, mais idéalement être harmonisés avec la même approche locale.
- `month` est prioritaire car c'est le bug signalé.
- `quarter`, `semester`, `year` doivent être alignés avec la même méthode pour éviter d'autres régressions.

### Vérifications après correction

Après migration, vérifier que :
- `month` affiche bien des points non nuls sur les dates où il y a des `session_start`
- `7d` reste correct
- `quarter`, `semester`, `year` continuent d'afficher des valeurs cohérentes
- il n'y a pas de doublons ou de décalage de labels autour de fin mars / début avril

### Fichier concerné

| Fichier | Action |
|---|---|
| nouvelle migration SQL dans `supabase/migrations/` | `CREATE OR REPLACE FUNCTION public.get_activity_connections_chart` avec série générée en heure locale |

### Détail technique

Le vrai bug restant vient de la combinaison suivante :

```text
timestamptz + generate_series + interval '1 day' + DST
```

Ce montage ne garantit pas un "minuit local" stable sur chaque point de série.  
La bonne solution est :

```text
1. définir les buckets en heure locale Paris
2. générer la série en timestamp local
3. agréger les logs dans ce même espace local
4. joindre local à local
```

Ainsi, la vue mois ne dépend plus des offsets UTC changeants entre CET et CEST.
