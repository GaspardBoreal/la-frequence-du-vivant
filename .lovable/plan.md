

## Correction du graphique "Aujourd'hui" — créneaux manquants et timezone

### Problème

La fonction SQL `get_activity_connections_chart` pour le mode "today" :
- Génère les créneaux avec `generate_series(v_start, v_end - interval '1 hour', ...)` — le `-1 hour` exclut le créneau en cours
- Utilise `now()` en UTC sans conversion en heure locale (Paris = UTC+2) — les labels horaires sont décalés

Gaspard s'est connecté à 12:48 UTC (14:48 Paris). Le graphique s'arrête à 11:00 UTC car `now()` ~ 12:48 minus 1h = 11:48, arrondi au créneau 11:00.

### Solution

Modifier la RPC `get_activity_connections_chart` :

1. Convertir en timezone `Europe/Paris` pour `date_trunc` et `to_char` — les labels afficheront l'heure locale
2. Remplacer `v_end - interval '1 hour'` par `v_end` pour inclure le créneau horaire en cours
3. Appliquer la même logique timezone aux modes jour/semaine pour cohérence des labels

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Créer | Migration SQL — `ALTER FUNCTION` avec timezone `Europe/Paris` et correction generate_series |

### Détail technique

```sql
-- today/yesterday : timezone-aware
v_start := date_trunc('day', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
-- generate_series jusqu'à v_end (plus de -1 hour)
generate_series(v_start, v_end, interval '1 hour')
-- labels en heure locale
to_char(gs AT TIME ZONE 'Europe/Paris', 'HH24:00')
-- buckets en heure locale
date_trunc('hour', created_at AT TIME ZONE 'Europe/Paris')
```

