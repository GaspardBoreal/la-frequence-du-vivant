## Problème

Aujourd'hui les filtres sont éclatés et incohérents entre les 3 vues :

| Vue        | Filtre Jalons (`PipelineActionsFilter`) | Filtre Étapes (`PipelineStagesFilter`) |
|------------|-----------------------------------------|----------------------------------------|
| Kanban     | OUI (rendu dans `CrmPipeline.tsx`)      | Implicite (chips d'étapes au-dessus des colonnes) |
| Carte      | OUI                                     | OUI (rendu dans `PipelineMapView`)     |
| Liste      | OUI                                     | **MANQUANT**                           |

Le filtre Étapes n'est rendu que dans `PipelineMapView.tsx`, donc invisible en vue Liste. Et le code de filtrage est dupliqué (un `matchesActions` côté page, un filtre stages côté map). À chaque évolution future (nouveau filtre type/budget/owner…), il faudrait toucher 3 endroits.

## Objectif

Une **barre de filtres unique** rendue une seule fois dans `CrmPipeline.tsx`, partagée par Kanban / Liste / Carte, avec un **prédicat unique `matchesAll(opp)`** appliqué partout.

## Plan

### 1. Créer `PipelineFiltersBar.tsx` (nouveau composant factorisé)

`src/components/crm/pipeline/PipelineFiltersBar.tsx`

Composition visuelle (une seule rangée responsive, design sobre cohérent avec l'existant) :

```text
┌──────────────────────────────────────────────────────────────────────┐
│ JALONS  [① Plaquette] [② Fiche prépa] [③ Point] [④ Pack]   8/8 ET│OU │
│ ÉTAPES  [● À contacter] [● Relance 1] [● Relance 2] … Tout / Aucun   │
└──────────────────────────────────────────────────────────────────────┘
```

- Réutilise `PipelineActionsFilter` (jalons + mode AND/OR) tel quel
- Réutilise `PipelineStagesFilter` (étapes colorées) tel quel
- Props : `actionsFilter, setActionsFilter, actionsMode, setActionsMode, stagesFilter, setStagesFilter, matchedCount, totalCount`

### 2. Créer un hook `usePipelineFilters` (état + URL + prédicat)

`src/hooks/usePipelineFilters.ts`

Centralise tout l'état actuellement éparpillé dans `CrmPipeline.tsx` :

- Lit/écrit les `searchParams` : `?actions=`, `?actions_mode=`, `?stages=`
- Expose `{ actionsFilter, setActionsFilter, actionsMode, setActionsMode, stagesFilter, setStagesFilter, matchesAll }`
- `matchesAll(opp)` = `matchesActions(opp) && matchesStages(opp)`
  - `stagesFilter.length === 0` → laisser passer (= toutes)
  - sinon `stagesFilter.includes(opp.statut)`
- Extensible : prochains filtres (owner, type, budget) viendront ici sans toucher les vues

### 3. Refactor `CrmPipeline.tsx`

- Supprime les `useMemo`/`useCallback` `actionsFilter` / `matchesActions` → remplacés par `const { matchesAll, …filters } = usePipelineFilters()`
- Remplace le bloc `<PipelineActionsFilter />` par `<PipelineFiltersBar {...filters} matchedCount={filtered.length} totalCount={opportunities.length} />`
- Passe `matchesAll` (au lieu de `matchesActions`) à :
  - `<KanbanBoard filterPredicate={matchesAll} />`
  - `<PipelineMapView opportunitiesAfterActions={opportunities.filter(matchesAll)} />` (renommé prop → `opportunities`)
  - Vue Liste : `opportunities.filter(matchesAll)`

### 4. Refactor `PipelineMapView.tsx`

- Retire le `PipelineStagesFilter` interne (déplacé dans la barre globale)
- Retire l'état local `stagesFilter` / les `useSearchParams` redondants
- Reçoit simplement `opportunities` déjà filtrées
- Le `colorBy` pin reste sur `dominantStatut` (inchangé)

### 5. Vue Kanban — comportement avec `stagesFilter`

Décision UX : quand des étapes sont sélectionnées, **masquer les colonnes non sélectionnées** (le Kanban devient une vue focalisée Relance 2 + Gagné, par ex.). Si aucune étape n'est sélectionnée → toutes les colonnes. Cela évite des colonnes vides parasites et est cohérent avec la sémantique « filtre actif ».

→ Ajouter une prop `visibleStages?: OpportunityStatus[]` à `KanbanBoard` (optionnelle, rétrocompatible).

### 6. Vérification

- `/admin/crm/pipeline?view=list&stages=relance_3` → seuls les Relance 3 listés
- `/admin/crm/pipeline?view=list&actions=plaquette_envoyee&stages=gagne,relance_2` → intersection
- Toggle Kanban / Liste / Map → la barre de filtres et le compteur `n/total` restent identiques
- URL deep-linkable et rétrocompatible (les anciens `?actions=…` continuent de marcher)

## Fichiers touchés

**Créés**
- `src/components/crm/pipeline/PipelineFiltersBar.tsx`
- `src/hooks/usePipelineFilters.ts`

**Modifiés**
- `src/pages/CrmPipeline.tsx` (simplification, supprime la duplication)
- `src/components/crm/pipeline/PipelineMapView.tsx` (retire son filtre interne)
- `src/components/crm/KanbanBoard.tsx` (ajoute `visibleStages` optionnel)

**Inchangés**
- `PipelineActionsFilter.tsx`, `PipelineStagesFilter.tsx`, `PipelineMapTooltip.tsx`, `useCrmPipelineMapData.ts`

## Bénéfice

Un seul endroit pour faire évoluer les filtres pipeline (prochains ajouts : owner, type d'expérience, plage budget, marche liée…). Les 3 vues restent strictement synchronisées via `matchesAll` + URL params partagés.
