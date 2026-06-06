## Objectif

Le bandeau « Indicateurs globaux » de `/admin/community` → Activités est aujourd'hui **figé sur 7 jours** et **ignore** les filtres période/événement/marcheur. On le rend pleinement réactif et on ajoute une **5ᵉ carte « Marche la plus active »** (événement le plus consulté par les marcheurs sur la fenêtre choisie).

## Comportement cible

- Le sous-titre passe de « Indicateurs globaux — 7 derniers jours » à un libellé dynamique :
  `Indicateurs globaux — Aujourd'hui` / `Hier` / `7 derniers jours` / `01/05 → 06/06` / etc.
- Les 5 cartes recalculent leurs valeurs à chaque changement de période, événement ou marcheur, en cohérence stricte avec le tableau « Détail par marcheur » en dessous.
- Nouvelle carte **« Marche la plus active »** : affiche le titre de l'événement (`marche_events.title`) le plus consulté (event_type `marche_view` ou `page_view` ciblant `/m/:slug`/`exploration`) sur la fenêtre, avec un compteur discret en sous-ligne (« 42 vues »).
- Quand un événement est filtré, la carte affiche directement ce titre (cohérence) plutôt que de masquer la carte.
- Layout : grille `md:grid-cols-5` (au lieu de 4), cartes plus compactes, troncature `truncate` + tooltip sur le titre long.

## Détail technique

### 1. Migration SQL — refonte de `get_activity_global_stats`

Nouvelle signature alignée sur les 3 autres RPC du dashboard :

```
get_activity_global_stats(
  p_period text default '7d',
  p_event_id uuid default null,
  p_user_filter uuid default null,
  p_start timestamptz default null,
  p_end   timestamptz default null
)
RETURNS TABLE(
  active_sessions      bigint,
  media_uploads        bigint,
  most_popular_tab     text,
  most_active_user_id  uuid,
  most_active_prenom   text,
  most_active_nom      text,
  most_active_event_id uuid,         -- NEW
  most_active_event_title text,      -- NEW
  most_active_event_views bigint,    -- NEW
  total_events         bigint
)
```

Logique interne (SECURITY DEFINER, `search_path = public`, Europe/Paris) :

- `v_start` / `v_end` calculés exactement comme dans `get_marcheur_activity_dashboard` (override par `p_start`/`p_end` sinon dérivés de `p_period` ; `all` = pas de borne).
- CTE `recent` = `marcheur_activity_logs` filtré sur `[v_start, v_end]` + `p_event_id` (sur `marche_event_id`) + `p_user_filter` (sur `user_id`).
- Compteurs : `active_sessions = COUNT(DISTINCT user_id)`, `media_uploads = COUNT(event_type='media_upload')`, `total_events = COUNT(*)`.
- `most_popular_tab` : `event_target` le plus fréquent parmi `event_type='tab_switch'`.
- `most_active_user` : `user_id` avec le plus d'events, jointure `community_profiles`.
- `most_active_event` :
  - source = `recent` où `marche_event_id IS NOT NULL` (couvre `marche_view`, `page_view`, `tab_switch` sur la page marche),
  - `GROUP BY marche_event_id ORDER BY COUNT(*) DESC LIMIT 1`,
  - jointure `marche_events` pour récupérer `title`.

Renommage des colonnes `_7d` → sans suffixe (la fenêtre n'est plus fixe). Anciennes colonnes supprimées proprement par `DROP FUNCTION` puis `CREATE`.

### 2. Frontend — `ActivityDashboard.tsx`

- `useQuery(['activity-global-stats', period, eventId, userFilter, rpcStart, rpcEnd])` : passer les 5 mêmes args que les 3 autres queries, `enabled: filtersReady`.
- Adapter le typage TS de la réponse (nouveaux champs).
- Remplacer le sous-titre figé par `Indicateurs globaux — {periodLabel}` (déjà calculé).
- Passer de `md:grid-cols-4` à `md:grid-cols-5` (responsive : `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`).
- Ajouter la 5ᵉ carte « Marche la plus active » :
  - icône `MapPin` (cohérent avec le filtre Événement),
  - titre tronqué + `title={...}` pour tooltip natif,
  - sous-ligne `text-xs text-muted-foreground` : `{views} vue·s`,
  - fallback `'—'` si aucune vue.
- Quand `eventId` est défini, court-circuit côté frontend : afficher directement le titre de l'événement sélectionné (récupéré depuis la liste `get_activity_events_for_filter` déjà chargée par la barre de filtres) plutôt que d'attendre la RPC, pour une UX instantanée.

### 3. Hors scope

- Pas de changement aux RPCs `get_marcheur_activity_dashboard`, `get_activity_timeline`, `get_activity_connections_chart` (déjà réactives).
- Pas de modif de `ActivityFiltersBar.tsx`.

## Fichiers touchés

- `supabase/migrations/<timestamp>_activity_global_stats_filters.sql` (drop + recreate fonction)
- `src/components/admin/ActivityDashboard.tsx` (query args + nouvelle carte + libellé dynamique + grid-cols-5)
- `src/integrations/supabase/types.ts` (régénéré auto après migration)

## Validation

1. Sélectionner « Aujourd'hui » → vérifier que Sessions / Médias chutent et que « Marche la plus active » affiche un titre cohérent avec le tableau.
2. Sélectionner un événement → la carte « Marche la plus active » verrouille sur ce titre.
3. Plage personnalisée 2 jours → tous les KPI recalculés, libellé `01/05 → 02/05`.
4. Filtrer sur un marcheur → « Plus actif » = ce marcheur, « Marche la plus active » = sa marche la plus consultée.
