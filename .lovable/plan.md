# Filtres Activités — Date & Événement

## Objectif
Dans `/admin/community` → onglet **Activités**, permettre de filtrer la Timeline et le graphique des connexions par **période** (aujourd'hui, hier, semaine, mois, année, tout) et par **événement** (un événement précis ou tous), en plus du filtre marcheur existant.

## UX / UI

Une barre de filtres unifiée, sticky en haut du dashboard (sous les 4 KPI cards), regroupant tous les contrôles de la vue active. Trois "chip-selects" alignés à droite, séparés par un fin diviseur, cohérents avec le style des autres filtres admin (`NetworkFilters`, `EventsFiltersBar`) :

```text
┌──────────────────────────────────────────────────────────────────┐
│ 🗓 Période ▾   📍 Événement ▾   👤 Marcheur ▾   [📋 Liste|📊 Chart]│
└──────────────────────────────────────────────────────────────────┘
```

- **Période** : pill-select avec 6 options + badge du nombre d'événements correspondants  
  `Aujourd'hui · Hier · 7 j · 30 j · 12 mois · Tout` (défaut : 7 j).
- **Événement** : Combobox cherchable (Command + Popover shadcn) listant les `marche_events` triés par date décroissante avec format `📅 dd/MM · Titre court · Lieu`. Largeur min 260 px, max 360 px, ellipsis. Option par défaut « Tous les événements ».
- **Marcheur** : conserve le Select existant, déplacé dans la même barre pour cohérence.
- **Reset** : petit bouton « Effacer » apparaît seulement si ≥ 1 filtre non-défaut.
- Les filtres pilotent **les deux vues** (Liste timeline + Chart connexions). Les 4 KPI cards restent globales 7 j (inchangées) pour garder un repère stable — un libellé « 7 derniers jours » discret sous le titre KPI clarifie le périmètre.
- État stocké dans l'URL (`?period=&event=&user=`) pour partage/back-button, comme `MarcheEventsAdmin`.
- Vue vide : illustration + texte « Aucune activité sur cette période / cet événement », avec lien « Réinitialiser les filtres ».

## Comportement

- Changement de filtre ⇒ refetch immédiat (debounce 150 ms pour la recherche d'événement).
- Le sélecteur `chartPeriod` actuel disparaît : la **période globale** pilote le chart. Le bucket d'agrégation est dérivé automatiquement (hour pour today/yesterday, day pour 7j/30j, month pour 12 mois & all).
- Quand un événement est choisi, un sous-titre apparaît au-dessus du chart : « Connexions des participants à *Titre* — *date* ».

## Détails techniques

### 1. Étendre les RPC Postgres (migration)
- `get_activity_timeline(p_limit, p_user_filter, p_period text default 'all', p_event_id uuid default null)`  
  Ajoute `WHERE created_at >= <bornes calculées>` + `AND (p_event_id is null OR marche_event_id = p_event_id)`.
- `get_activity_connections_chart(p_period, p_event_id uuid default null, p_user_filter uuid default null)`  
  Même filtre `marche_event_id`. Le bucket SQL est inféré côté fonction depuis `p_period` (réutilise la logique time-series existante en heure locale Paris — cf. mémoire `activity-chart-time-series-logic`).
- Bornes période (heure locale Paris) :  
  `today` = `date_trunc('day', now() AT TIME ZONE 'Europe/Paris')`  
  `yesterday` = veille uniquement  
  `7d` / `30d` / `12m` = `now() - interval`  
  `all` = pas de borne.
- Aucune modification de schéma de table ; la colonne `marche_event_id` existe déjà sur `marcheur_activity_logs`.

### 2. Nouveau RPC léger
- `get_activity_events_for_filter()` : retourne `id, title, date_marche, lieu` des événements ayant au moins 1 ligne d'activité (évite de lister 500 events vides). Tri date desc, limit 200.

### 3. Frontend
- `src/components/admin/ActivityDashboard.tsx` :
  - State `period`, `eventId`, `userFilter` (URL-synced via `useSearchParams`).
  - Nouveau sous-composant `ActivityFiltersBar` (fichier dédié) avec les 3 selects + reset.
  - Passe les filtres aux 2 queries (`activity-timeline`, `activity-chart`).
  - Supprime le second Select période du chart.
- Pas de changement aux 4 cards KPI globales.

### 4. Types
- `src/integrations/supabase/types.ts` est régénéré automatiquement après la migration.

## Hors scope
- Pas de filtre par type d'événement (`event_type`) — reportable.
- Pas d'export CSV de la timeline filtrée — reportable.
- Pas de modification des KPI cards (gardent leur fenêtre 7 j).
