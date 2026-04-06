

## Réorganisation de `/admin/community` en onglets

### Structure

La page `CommunityProfilesAdmin` sera restructurée avec 4 onglets via `Tabs` de Radix :

**Communauté** (onglet par défaut) — Le contenu actuel : indicateurs par rôle (avec ajout d'un card "Total"), barre de recherche, tableau des profils avec formation/certification.

**Activités** — Le composant `ActivityDashboard` actuel, enrichi d'un toggle Liste/Graphique :
- Vue Liste (icone `List`) : tableau + timeline existants
- Vue Graphique (icone `BarChart3`) : graphe temporel recharts (`AreaChart`) avec x=temps, y=connexions. Sélecteur de période : Aujourd'hui / Hier / 7 derniers jours / Mois dernier / Trimestre dernier / Semestre dernier / Année dernière. Granularité adaptée (heures pour aujourd'hui/hier, jours pour 7j/mois, semaines pour trimestre+).

**Affiliation marcheurs** — Le bloc affiliation actuel (cards KPI + tableau).

**Marcheurs** — Réservé pour les futures fonctionnalités (placeholder).

### Indicateurs rôle enrichis

Ajouter un card "Total" avec icône `Users` avant les 5 rôles existants. Grille passée à `grid-cols-3 md:grid-cols-6`.

### Vue Graphique — Données

Nouvelle RPC SQL `get_activity_connections_chart(p_period text)` qui retourne `{ period_label, connection_count }[]` en agrégeant les `session_start` de `marcheur_activity_logs` selon la période choisie. Format du label adapté : `HH:00` pour aujourd'hui/hier, `dd/MM` pour 7j/mois, `Sem. XX` pour trimestre+.

### Responsive

- Onglets : `TabsList` en scroll horizontal sur mobile avec `overflow-x-auto`
- Graphique : hauteur responsive (`h-64 md:h-80`)
- Cards indicateurs : `grid-cols-2 sm:grid-cols-3 md:grid-cols-6`

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/CommunityProfilesAdmin.tsx` — restructurer en Tabs, déplacer affiliation dans son onglet |
| Modifier | `src/components/admin/ActivityDashboard.tsx` — ajouter toggle Liste/Graphique + composant chart |
| Créer | Migration SQL — RPC `get_activity_connections_chart` |

