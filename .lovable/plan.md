## Diagnostic

**Pb 1 — "Aujourd'hui" affiche d'anciens enregistrements.** Le filtre fonctionne correctement sur la **Timeline** (RPC `get_activity_timeline` bornée à `date_trunc('day', now() AT TIME ZONE 'Europe/Paris')`). Mais le tableau **« Détail par marcheur »** juste au-dessus utilise une RPC séparée `get_marcheur_activity_dashboard` qui **ignore complètement** les filtres et agrège toujours sur 7 jours (colonne hardcodée « Sessions (7j) », `last_seen` = max global). Visuellement, l'utilisateur croit donc que le filtre est cassé.

**Pb 2.** Pas de plage personnalisée date début → date fin.

## Correctifs proposés

### 1. Faire respecter les filtres au tableau « Détail par marcheur »
Étendre `get_marcheur_activity_dashboard(p_start timestamptz, p_end timestamptz, p_event_id uuid, p_user_filter uuid)` — tous optionnels (défauts : 7 derniers jours, comportement actuel conservé). Les agrégats `last_seen`, `sessions`, `photos/sounds/texts/explorations`, `favorite_tabs` se calculent **dans la fenêtre** et tiennent compte de `marche_event_id` + `user_id` si fournis. La colonne du header devient dynamique : « Sessions (aujourd'hui) », « Sessions (7 j) », « Sessions (01/05 → 06/06) »…

### 2. Ajouter une option « Plage personnalisée »
- Nouvelle valeur de période : `custom`.
- Quand sélectionnée, deux date-pickers (shadcn `Calendar` dans `Popover`) apparaissent à droite du select Période : **Du** … **Au** … (inclusif). Validation : `from ≤ to ≤ aujourd'hui`, max 2 ans.
- URL sync : `?period=custom&from=YYYY-MM-DD&to=YYYY-MM-DD`.
- Bouton « Effacer » remet `period=7d` et purge `from`/`to`.

### 3. Étendre les 3 RPC pour accepter `p_start` / `p_end` (timestamptz, optionnels)
- `get_activity_timeline`, `get_activity_connections_chart`, `get_marcheur_activity_dashboard`.
- Si `p_start`/`p_end` fournis, ils **priment** sur `p_period`. Sinon, comportement actuel inchangé.
- Pour le chart en mode `custom`, le bucket est inféré de la durée : ≤2 j → hour, ≤60 j → day, ≤24 mois → week, sinon month.

### 4. Frontend
- `ActivityFiltersBar` :
  - Ajouter option `custom` dans `PERIOD_OPTIONS` (label « Plage personnalisée »).
  - Quand `period === 'custom'`, afficher 2 boutons date (icône `CalendarIcon` + label `dd MMM yyyy`) ouvrant un `Calendar` shadcn (locale fr).
  - Nouvelles props `from`, `to`, `onRangeChange(from, to)`.
- `ActivityDashboard.tsx` :
  - Lire `from`/`to` depuis `useSearchParams`, convertir en `YYYY-MM-DD` → bornes timestamptz Paris (`from 00:00`, `to 23:59:59.999`).
  - Passer `p_start`/`p_end` aux 3 RPC.
  - Remplacer la requête `get_marcheur_activity_dashboard` (sans args) par l'appel filtré → invalidation à chaque changement de filtre.
  - Header colonne dynamique « Sessions (<label période>) ».
  - Sous-titre du bloc : « Aucune activité enregistrée pour cette période / cet événement. ».

### 5. Hors scope
- Pas de modification des 4 KPI cards globales (gardent 7 j explicite, libellé déjà en place).

## Fichiers touchés
- Migration : 3 RPC remplacées (signatures rétro-compatibles via `DEFAULT NULL`).
- `src/components/admin/ActivityFiltersBar.tsx` (option custom + date pickers).
- `src/components/admin/ActivityDashboard.tsx` (URL params from/to, dashboard query paramétrée, libellé colonne dynamique).
- `src/integrations/supabase/types.ts` régénéré.
