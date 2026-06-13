# Refonte de la vue Observations — Pouls du vivant

Périmètre : **uniquement** `src/components/community/exploration/BiodiversityEvolutionChart.tsx` quand `metric === 'observations'`. La vue Espèces reste **strictement inchangée**. Pas de modif de données — tout est dérivé de `series` + `byDay` déjà filtrés par période dans `useBiodiversityEvolution`.

## 1. Inversion de hiérarchie visuelle

Quand `metric === 'observations'` :

- **Barres XXL** : hauteur conteneur `h-80 sm:h-96` (vs `h-64 sm:h-72`), `maxBarSize=42`, `radius=[6,6,0,0]`, **dégradé vertical** (`hsl(var(--primary))` → `hsl(var(--primary)/0.45)`) au lieu du gris à 25 % d'opacité.
- **Highlight du jour record** : la barre du `daily` max passe en accent (`hsl(var(--accent))` ou primary saturé) + label valeur au-dessus.
- **Courbe espèces discrète** : la `Area cumulative` devient une `Line` fine sur **axe Y droit** — `stroke="hsl(var(--muted-foreground))"`, `strokeWidth={1}`, `strokeDasharray="3 3"`, `strokeOpacity={0.5}`, `dot={false}`. Légende : « Cumul espèces (réf.) ». En vue Espèces, on garde l'`Area` actuelle inchangée.
- Tooltip enrichi : observations du jour (gros), + cumul espèces (petit, secondaire), + jour vs moyenne (ex : « +120 % vs moyenne période »).

## 2. Bandeau KPI riche (sous le header, au-dessus du graphe)

Composant inline `<ObservationsKpiStrip />` rendu uniquement si `metric === 'observations'` et `series.length > 0`. **Mobile first** : `flex overflow-x-auto snap-x` sur < sm, `grid grid-cols-4` sur sm+, `grid-cols-8` sur lg.

8 KPI calculés en `useMemo` à partir de `series` + `byDay` filtrés sur la période :

| KPI | Calcul |
|---|---|
| **Total obs** | `Σ observationsDaily` |
| **Jour record** | `max(daily)` + date courte (« 12 mars · 47 obs ») |
| **Moy / jour actif** | `total / jours où daily > 0` |
| **Jours actifs** | `filteredDays.filter(d => daily>0).length` / nb total jours période (ex « 14 / 30 j ») |
| **Streak actuel** | nb jours consécutifs avec `daily>0` en fin de période |
| **Nouv. espèces** | `Σ newSpeciesCount` sur la période + % du total obs |
| **Contributeurs** | `Set(observerName)` agrégé sur les buckets filtrés |
| **Top espèce** | espèce avec le plus d'`observations` sur la période (nom FR via `commonNameFr` déjà résolu) |

Chaque chip : icône lucide (`Eye`, `Trophy`, `TrendingUp`, `CalendarDays`, `Flame`, `Sparkles`, `Users`, `Star`), valeur en `text-xl sm:text-2xl font-bold tabular-nums`, label en `text-[10px] uppercase tracking-wide text-muted-foreground`. Bordure `border-border`, fond `bg-gradient-to-br from-primary/5 to-transparent`, hover scale léger. Largeur min sur mobile `min-w-[140px] snap-start`.

Texte « 211 observations enregistrées depuis le 29 janv. 2026 » du header devient redondant en vue Observations → on le **masque** au profit du strip KPI (gardé tel quel en vue Espèces).

## 3. Cohérence période

Tous les KPI consomment exactement `series` (déjà filtré par `period`/`customRange`) et `byDay` restreint à `filteredDays` — un changement de période recalcule l'intégralité du strip via `useMemo([series, byDay, period])`. Pour `today`, on bascule automatiquement le graphe en barres horaires si possible — sinon affiche 1 grosse barre + KPI strip (les KPI restent pertinents même sur 1 jour).

## 4. Mobile first

- KPI strip horizontal scrollable avec snap (8 chips visibles par scroll), gradients fade gauche/droite pour suggérer le scroll.
- Graphe : hauteur `h-80` sur mobile, marges X réduites (`-mx-3`), `XAxis` `minTickGap={32}` pour éviter le chevauchement, `YAxis` masqué sur mobile (`width={0}` < sm) car les valeurs sont surfaceées via le tooltip et les KPI.
- Toggle Espèces/Observations reste accessible en haut à droite, inchangé.

## Détails techniques

- Pas de nouvelle dépendance. Recharts gère le second axe Y (`yAxisId="right"` + `<YAxis yAxisId="right" orientation="right" hide />`).
- `ObservationsKpiStrip` reste **dans le même fichier** (pas de nouveau fichier) — composant local pour éviter la prop drilling de `byDay`/`series`.
- Calcul Top espèce : itérer `filteredDays.flatMap(d => byDay.get(d).observations)` puis `Map<sciName, count>`.
- Calcul streak : remonter `filteredDays` depuis la fin tant que `daily > 0`.
- Toutes les couleurs via tokens sémantiques (`--primary`, `--accent`, `--muted-foreground`) — aucune couleur custom.

## Hors scope

- Vue Espèces : aucune modif.
- `useBiodiversityEvolution` : aucune modif (toutes les données nécessaires y sont déjà).
- DayDetailDrawer : inchangé.
- Vue horaire intra-journée (`today`) : implémentée seulement si les données portent une heure exploitable ; sinon fallback barre unique + KPI (à confirmer pendant l'implémentation, pas bloquant).
