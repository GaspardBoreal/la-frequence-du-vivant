# Onglet "Profils" dans la vue Marcheurs (exploration)

## Objectif
Réutiliser les 3 widgets de l'onglet Profils de `/admin/marche-events/:id` :
- Pyramide des âges
- Tisser la diversité (donut genres)
- Mosaïque des activités (treemap CSP)

Et les afficher dans un nouvel onglet **"Profils"** placé **après "Marcheurs"** dans le sous‑menu de la vue `Marcheurs` d'une exploration (`/marches-du-vivant/mon-espace/exploration/:id`).

Contrainte clé : **un seul code source** pour les 3 widgets, déjà utilisé sur 2 pages admin (`ProfilsImpactDashboard` rendu via `ProfilsPanel`). Toute évolution future doit profiter aux 3 vues.

## Analyse de l'existant

- Code admin : `src/components/admin/community/ProfilsImpactDashboard.tsx` rend les 5 compteurs + les 3 widgets cibles, alimenté par `useCommunityImpactAggregates(eventId | null)` → RPC `get_community_impact_aggregates_scoped(p_event_id uuid)`.
- Cette RPC :
  - filtre par participants d'**un événement** (ou global si `null`) ;
  - **bloque les non‑admins** (`check_is_admin_user`) → inutilisable côté communauté.
- Le sous‑menu actuel de la vue Marcheurs vit dans `src/components/community/ExplorationMarcheurPage.tsx` (`marcheursSubTabs` = `convivialite`, `profils`). Le label `profils` y désigne en réalité l'onglet "Marcheurs" (composant `MarcheursTab`). À renommer proprement.

## Plan

### 1. Backend — RPC scopée exploration, accessible aux marcheur·euse·s

Nouvelle migration SQL :

- Étendre `get_community_impact_aggregates_scoped` (ou créer `get_community_impact_aggregates_by_exploration(p_exploration_id uuid)`) qui :
  - agrège les `community_profiles` des `user_id` ayant une `marche_participations` validée sur un `marche_events.exploration_id = p_exploration_id` ;
  - renvoie le **même JSON** que la RPC existante (`total`, `with_*`, `by_age`, `by_gender`, `by_csp`, `by_role`, `csp_x_age`, `top_cities`, `territories_count`).
- Sécurité : `SECURITY DEFINER`, `STABLE`, `search_path = public`. Accessible à `authenticated` (pas de garde admin). Aucune PII renvoyée — uniquement des agrégats (counts par tranche/genre/CSP), donc safe vis‑à‑vis du RLS sur `community_profiles`.
- `GRANT EXECUTE ... TO authenticated`.

### 2. Hook — extension non cassante

`src/hooks/useCommunityImpactAggregates.ts` :
- Garder la signature actuelle `(eventId?: string | null)` intacte (admin).
- Ajouter `useCommunityImpactAggregatesByExploration(explorationId?: string | null)` qui appelle la nouvelle RPC. Même type `CommunityImpactAggregates`.

### 3. Factorisation du composant widgets

Extraire les 3 widgets (Pyramide, Donut, Treemap) dans un sous‑composant **partagé** :

```
src/components/community/profils/
  ProfilsWidgets.tsx        ← uniquement les 3 cartes Recharts + CSPTreemapTile
  ProfilsScopeContainer.tsx ← wrapper qui choisit le bon hook (event|exploration|global)
```

- `ProfilsWidgets` reçoit en props `data: CommunityImpactAggregates` (pure présentation, aucune dépendance admin).
- `ProfilsImpactDashboard` (admin) est refactoré pour **composer** : compteurs (admin only) + `<ProfilsWidgets data={data} />`. Aucune régression visuelle sur les 2 pages admin existantes.
- Aucun composant Recharts dupliqué : un seul endroit à maintenir → toute évolution (couleurs, légendes, accessibilité) se propage aux 3 vues.

### 4. Intégration dans la vue Marcheurs

`src/components/community/ExplorationMarcheurPage.tsx` :
- Renommer la clé existante `profils` → `marcheurs` (label inchangé "Marcheurs"), pour libérer le nom.
- Ajouter une 3ᵉ entrée à `marcheursSubTabs` :

  ```ts
  { key: 'convivialite', label: 'Convivialité', icon: Sparkles },
  { key: 'marcheurs',    label: 'Marcheurs',    icon: Users },
  { key: 'profils',      label: 'Profils',      icon: PieChart },
  ```

- Brancher le rendu : si `activeMarcheursSubTab === 'profils'` → `<ProfilsScopeContainer scope={{ type: 'exploration', explorationId: effectiveExplorationId }} />` qui appelle le nouveau hook et rend `<ProfilsWidgets />`.
- Tracking activité (`trackActivity('tab_switch', 'tab:marcheurs:profils')`) — déjà géré génériquement.

### 5. UX & responsive

- Mobile‑first : la grille `lg:grid-cols-3` du `ProfilsWidgets` s'empile naturellement sur petit écran ; conserver `ResponsiveContainer` Recharts.
- Pas de compteurs/PII dans la version communauté — uniquement les 3 widgets demandés + un en‑tête sobre ("Qui marche sur cette exploration ?") aligné sur la sobriété informationnelle.
- État vide : afficher un message neutre quand `total === 0`.

## Fichiers touchés

- **Nouveau** : `supabase/migrations/<ts>_profils_widgets_by_exploration.sql`
- **Nouveau** : `src/components/community/profils/ProfilsWidgets.tsx`
- **Nouveau** : `src/components/community/profils/ProfilsScopeContainer.tsx`
- **Modifié** : `src/hooks/useCommunityImpactAggregates.ts` (ajout du hook exploration)
- **Modifié** : `src/components/admin/community/ProfilsImpactDashboard.tsx` (utilise `ProfilsWidgets`)
- **Modifié** : `src/components/community/ExplorationMarcheurPage.tsx` (3ᵉ sous‑onglet)
- **Mémoire** : MAJ `mem://features/mon-espace/exploration-dedicated-page-architecture` (4 sous‑onglets désormais).

## Risques & garde‑fous

- RPC sans garde admin → ne renvoie que des **agrégats** ; aucune ligne PII. À documenter dans le commentaire SQL.
- Refactor admin : vérifier visuellement les pages `/admin/community` et `/admin/marche-events` après extraction (mêmes props, mêmes données).
- Ne pas casser la clé d'onglet existante : migration de `profils → marcheurs` à appliquer dans le state initial et dans le tracking.
