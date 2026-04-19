

## Refonte /admin/marche-events — Scalable 1000+ événements

### Vision

Transformer la page actuelle (liste plate, scroll infini implicite) en un **cockpit administrateur** structuré en 4 sous-onglets, avec bandeau de KPIs persistant, recherche/filtres performants, et pagination serveur. Mobile first, sobriété informationnelle.

### Architecture cible

```text
┌──────────────────────────────────────────────┐
│  ← Retour    Événements de Marche   [+ Nouvel] │
├──────────────────────────────────────────────┤
│ 🎯 BANDEAU KPIs (sticky mobile)              │
│ 📅 245 événements  🥾 1247 marches           │
│ 📏 3 482 km parcourus  👥 8 924 participants │
├──────────────────────────────────────────────┤
│ [🔎 Recherche…] [Type ▾] [Tri ▾] [Statut ▾]  │
├──────────────────────────────────────────────┤
│ [Liste] [Carte] [Analyse] [Recommandations]  │
├──────────────────────────────────────────────┤
│  …contenu de l'onglet actif…                 │
├──────────────────────────────────────────────┤
│  ◀ 1 2 3 … 25 ▶    [10 ▾] /page             │
└──────────────────────────────────────────────┘
                    [💬 Chatbot] (fab, futur)
```

### Pagination serveur (critique pour 1000+)

Bascule du `select('*')` actuel vers une pagination **côté Supabase** :
- `.range(from, to)` + `.select('*', { count: 'exact' })`
- Filtres SQL (`ilike`, `eq event_type`) appliqués avant pagination, pas en JS
- Tri SQL (`order('date_marche', ...)`)
- Tailles : **10 / 20 / 50 / 100** par page (défaut 20, persisté en `localStorage`)
- Debounced search 300ms (déjà en place)

### KPIs du bandeau (4 compteurs)

| KPI | Source | Méthode |
|---|---|---|
| Nombre d'événements | `marche_events` | `count: 'exact', head: true` |
| Nombre de marches | `exploration_marches` (jointure via `exploration_id`) | RPC dédiée ou agrégation |
| Kilomètres parcourus | `marches.distance_km` (à confirmer côté schema) | `SUM` via RPC |
| Participants total | `marche_participations` | `count: 'exact', head: true` |

→ Création d'**1 RPC `get_marche_events_dashboard_stats()`** retournant un seul JSON avec les 4 chiffres + **respect des filtres globaux** (type, recherche, statut). Cache `staleTime: 60s`.

### 4 sous-onglets

| Onglet | Contenu | Statut |
|---|---|---|
| **Liste** | Cards actuelles + pagination serveur | Refonte du composant existant |
| **Carte** | Leaflet : marqueurs des événements (lat/lng via `marche_events.lieu` ou jointure `marches`) | Réutilise `marches-map-tab-logic` (mémoire existante) |
| **Analyse** | 3 graphiques : événements/mois (bar), répartition par type (donut), top 10 lieux (horizontal bar) | Recharts |
| **Recommandations** | Placeholder structuré : "Événements à reprogrammer", "Marches sans participation", "Doublons potentiels" | V1 = règles SQL simples, IA plus tard |

### Filtres globaux (s'appliquent aux 4 onglets)

- **Recherche texte** : titre, description, lieu, qr_code, exploration name (via RPC ou `or()` Supabase)
- **Type d'événement** : agroécologique / éco-poétique / éco-tourisme / aucun
- **Statut** : à venir / passée / tous (calculé sur `date_marche`)
- **Tri** : date ↓ / date ↑ / titre A→Z / titre Z→A
- État stocké en URL via `useSearchParams` → liens partageables, navigation arrière naturelle

### Mobile first

- Bandeau KPIs : grid `grid-cols-2` mobile, `grid-cols-4` desktop, sticky `top-0` avec `backdrop-blur`
- Filtres : drawer (Sheet shadcn) sur mobile, inline desktop
- Sous-onglets : `Tabs` shadcn avec scroll horizontal mobile (`overflow-x-auto`)
- Pagination : compact mobile (◀ 3/25 ▶), full desktop (chiffres)
- Cards événements : layout vertical mobile

### Architecture technique

| Fichier | Action |
|---|---|
| `src/pages/MarcheEventsAdmin.tsx` | Refonte : layout, filtres URL, orchestration des 4 onglets |
| `src/components/admin/marche-events/EventsKpiBanner.tsx` | Nouveau : 4 KPIs sticky |
| `src/components/admin/marche-events/EventsFiltersBar.tsx` | Nouveau : recherche + selects (mobile drawer) |
| `src/components/admin/marche-events/EventsListTab.tsx` | Nouveau : extrait + pagination serveur |
| `src/components/admin/marche-events/EventsMapTab.tsx` | Nouveau : Leaflet, marqueurs filtrés |
| `src/components/admin/marche-events/EventsAnalyticsTab.tsx` | Nouveau : 3 charts Recharts |
| `src/components/admin/marche-events/EventsRecommendationsTab.tsx` | Nouveau : placeholder structuré V1 |
| `src/components/admin/marche-events/PaginationControls.tsx` | Nouveau : pagination + selector taille |
| `src/hooks/useMarcheEventsQuery.ts` | Nouveau : `useQuery` paginé centralisé |

### Côté Supabase (1 migration)

- **RPC `get_marche_events_dashboard_stats(_search, _type, _status)`** : retourne `{ events_count, marches_count, total_km, participants_count }` filtré
- **RPC `get_marche_events_paginated(_search, _type, _status, _sort, _limit, _offset)`** : retourne rows + total_count, évite N+1 et applique les filtres en SQL
- Vérifier la présence de `marches.distance_km` ; si absent, on l'ignorera dans le KPI (affiche "—") et on ouvrira un ticket séparé

### Chatbot (préparé, non implémenté)

- Réservation d'un emplacement FAB bottom-right (`fixed bottom-4 right-4`)
- Composant stub `<EventsChatbotFab />` désactivé visuellement (icône MessageCircle, opacité 50, tooltip "Bientôt disponible")
- Implémentation différée pour alignement avec PiloTerra Scope / Academy

### Points à confirmer avant implémentation

1. **Distance km** : la table `marches` a-t-elle une colonne `distance_km` ou équivalent ? Si non, faut-il l'ignorer ou la calculer via géo ?
2. **Onglet Recommandations V1** : 3 règles proposées (à reprogrammer / sans participation / doublons) — OK ou autres priorités ?
3. **Persistance des filtres** : URL (partageable) + `localStorage` (taille de page) — confirmé ?

Dis-moi ces 3 points et je passe à l'implémentation.

