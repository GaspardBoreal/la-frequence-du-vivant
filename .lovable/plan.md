

## KPI "Kilomètres parcourus" — Méthode (C) Hybride

### Constat technique
- Table `marches` : ne contient **que** `latitude` / `longitude` (pas de `distance_km`).
- RPC actuelle `get_marche_events_dashboard_stats` retourne `total_km = NULL` en dur.
- Données existantes : marches ordonnées par `exploration_marches.ordre` avec coordonnées GPS exploitables.

### Approche (C) — Haversine par défaut + override manuel

**1. Migration SQL** — 2 changements

a) **Ajouter colonne** `marches.distance_km numeric` (nullable). Permet la saisie manuelle quand connue (ex: tracé GPX précis). Si vide → fallback Haversine.

b) **Recréer la RPC `get_marche_events_dashboard_stats`** avec calcul réel :

```text
Pour chaque exploration des événements filtrés :
  Pour chaque paire (marche n, marche n+1) ordonnée par `ordre` :
    segment_km =
       COALESCE(
         marche.distance_km,                          -- override manuel
         haversine(lat_n, lng_n, lat_n+1, lng_n+1)   -- défaut auto
       )
  total_km += somme des segments
```

Implémentation : fonction SQL `haversine_km(lat1,lng1,lat2,lng2)` immutable + CTE `LAG()` sur `exploration_marches` joint à `marches`.

**Note de sémantique** : la distance d'une exploration = somme des segments entre marches consécutives (= longueur du parcours). Si une marche a un `distance_km` manuel renseigné, il **remplace** le segment qui la **précède** (plus précis pour les boucles GPX). C'est l'interprétation la plus utile et la plus simple.

### 2. Frontend
Aucun changement requis. `EventsKpiBanner` affiche déjà `total_km` dès qu'il est non-null. Le formatage `${fmt(Math.round(...))} km` est en place.

### 3. Cohérence avec les filtres
La RPC respecte déjà `_search`, `_type`, `_status` → la somme reste alignée avec la liste affichée à droite.

### Fichiers touchés

| Fichier | Action |
|---|---|
| Migration SQL | `ALTER TABLE marches ADD COLUMN distance_km numeric;` + `CREATE FUNCTION haversine_km(...)` + `CREATE OR REPLACE FUNCTION get_marche_events_dashboard_stats(...)` avec calcul réel |
| Frontend | Aucun changement |

### Bénéfices
- KPI **immédiatement utile** (Haversine ~10-15% d'écart vs tracé réel, suffisant pour un dashboard agrégé).
- **Précision améliorable** : tout admin pourra renseigner `distance_km` sur une marche pour affiner.
- **Aucune régression** : les autres RPC (`get_marche_events_paginated`, `get_marche_events_filtered_all`) ne sont pas touchées.

### Limites assumées
- Les marches sans coordonnées GPS sont ignorées dans la somme (segment sauté).
- Une exploration avec une seule marche → 0 km (normal, pas de segment).
- Les événements sans `exploration_id` n'ajoutent rien (cohérent avec le KPI "marches associées" déjà à 0 dans ce cas).

