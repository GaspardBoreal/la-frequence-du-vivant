

## Fix: Graphique connexions plat pour mois/trimestre/semestre/annee

### Diagnostic

Le JOIN entre la serie temporelle (`generate_series`) et les buckets de donnees echoue a cause du changement d'heure ete/hiver (DST). 

- `generate_series` demarre en mars (UTC+1) donc les slots tombent a `23:00 UTC`
- Les donnees d'avril sont en heure d'ete (UTC+2) donc `date_trunc('day', ...)` donne `22:00 UTC`
- Le `=` entre ces deux timestamptz echoue : `23:00 UTC != 22:00 UTC`

C'est pourquoi les vues "7 derniers jours" et "aujourd'hui/hier" fonctionnent (pas de franchissement DST), mais mois/trimestre/semestre/annee sont KO.

### Solution

Modifier la fonction SQL `get_activity_connections_chart` pour comparer les timestamps en heure locale (timestamp without timezone) au lieu de timestamptz. Concretement :

1. Convertir `generate_series` en timestamps locaux : `(gs AT TIME ZONE v_tz)` 
2. Convertir les buckets de donnees aussi en local : `date_trunc(v_trunc, created_at AT TIME ZONE v_tz)`
3. Joindre sur ces deux valeurs locales (type `timestamp`, sans TZ)

```sql
RETURN QUERY
SELECT
  to_char(gs AT TIME ZONE v_tz, v_fmt) AS period_label,
  COALESCE(c.cnt, 0::bigint) AS connection_count
FROM generate_series(v_start, v_end, v_interval) AS gs
LEFT JOIN (
  SELECT
    date_trunc(v_trunc, created_at AT TIME ZONE v_tz) AS bucket,
    count(*) AS cnt
  FROM marcheur_activity_logs
  WHERE event_type = 'session_start'
    AND created_at >= v_start
    AND created_at <= v_end
  GROUP BY bucket
) c ON c.bucket = (gs AT TIME ZONE v_tz)
ORDER BY gs;
```

Le changement cle : le bucket n'est plus reconverti en timestamptz (`AT TIME ZONE v_tz` une seule fois = timestamp local), et le `gs` est aussi converti en local pour la comparaison.

### Fichier concerne

| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | `CREATE OR REPLACE FUNCTION get_activity_connections_chart` avec JOIN corrige |

