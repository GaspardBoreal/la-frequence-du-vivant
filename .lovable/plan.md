
# Carte interactive du Pipeline

## Objectif
Ajouter à `/admin/crm/pipeline` une 3ᵉ vue **Carte** (à côté de Kanban / Liste) qui affiche les entreprises liées aux opportunités, filtrables par **étape pipeline** ET / OU **jalons**, avec tooltip riche et ouverture du **drawer entreprise** déjà utilisé dans l'annuaire (factorisé).

## UX cible

### 1. Sélecteur de vue
Ajout d'un 3ᵉ bouton `<Map />` dans le toggle existant Kanban / Liste / **Carte** (même groupe `bg-muted rounded-lg p-1`, aucune nouvelle nav).

### 2. Barre de filtres compacte (au-dessus de la carte)

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Étapes pipeline                          Jalons                     │
│  ◉ À contacter  ◉ Relance 1  ◉ Relance 2  │ □ Plaquette  □ Fiche…    │
│  ◉ Relance 3   □ Pas intéressé  ◉ Gagné  │ □ Point avanc. □ Pack…   │
│  □ Perdu          [Tout]  [Aucun]         │ Mode  ◉ ET   ○ OU        │
└──────────────────────────────────────────────────────────────────────┘
            42 entreprises affichées · 17 sans géoloc (cachées)
```

- **Étapes** : chips multi-select colorées (couleurs `KANBAN_COLUMNS`). Clic toggle ; bouton "Tout / Aucun".
- **Jalons** : réutilise **exactement** `PipelineActionsFilter` déjà en place (mêmes URL params `actions` + `actions_mode`).
- **Étapes** synchronisées sur URL via `?stages=a_contacter,gagne` (cohérent avec `?actions=`).
- Compteur dynamique `N affichées / N sans géoloc`.

### 3. Carte (réutilise `CrmCompaniesMap`)
- Composant existant `CrmCompaniesMap` déjà parfait (pins SVG avec halo, fitBounds, flyTo, tooltip Leaflet). On l'enrichit légèrement :
  - **Couleur du pin** = couleur de l'étape opportunité (et non du `lifecycle_stage` entreprise) → nouvelle prop `colorBy?: (point) => string`.
  - **Tooltip riche** (overload du `<Tooltip>` actuel) : nom entreprise · ville · activité (NAF) · contact principal · nb marches liées · badges étape + jalons.
  - **Cluster doux** : si > 80 points, regrouper visuellement par offset radial automatique (`leaflet.markercluster` optionnel — sinon décalage déterministe pour éviter superposition). Démarrage : pas de cluster, on garde l'esthétique pin+halo ; on ajoute cluster seulement si l'utilisateur en a besoin.
- Hauteur `calc(100vh - 320px)` pour une vraie carte immersive sur desktop.

### 4. Tooltip vignette (mouse-over)
Vignette HSL design tokens, ~260px :

```text
┌──────────────────────────────────────┐
│ ●  ENTREPRISE NOM                    │
│    Bordeaux · NAF 7022Z              │
│ ─────────────────────────────────── │
│ 👤 Marie Dupont — Directrice RSE     │
│ 🥾 3 marches programmées             │
│ ─────────────────────────────────── │
│ [Relance 2]  [Plaquette] [Fiche]     │
└──────────────────────────────────────┘
```

### 5. Clic sur un pin → drawer entreprise
**Factorisation** : on réutilise tel quel `CompanyDetailSheet` (déjà utilisé dans l'Annuaire). Aucun fork — il évoluera côté annuaire, le pipeline en profite automatiquement.

```tsx
<CompanyDetailSheet
  companyId={selectedCompanyId}
  onOpenChange={(o) => !o && setSelectedCompanyId(null)}
/>
```

Deep-link : `?company=<id>` ouvre le drawer (cohérent avec le pattern `?opportunity=` existant).

## Architecture technique

### Nouveau hook `useCrmPipelineMapData`
Source unique : agrège opportunités + entreprises liées + contact principal + nb marches.

```ts
// Étapes :
// 1. SELECT crm_opportunities (filtre client par stages + actions)
// 2. SELECT crm_opportunity_companies WHERE opportunity_id IN (...)
//    JOIN crm_companies(latitude, longitude, denomination, ville, libelle_naf, code_naf)
// 3. SELECT crm_opportunity_contacts (role='primary' en priorité)
//    JOIN crm_contacts
// 4. SELECT crm_company_events count GROUP BY company_id
// 5. Renvoie MapPoint[] enrichi : { id, lat, lng, title, ville, naf,
//        contact:{nom,fonction}, marchesCount, opportunityStage, actions[] }
```

Cache react-query 30s. Dépend de `[stages, actionsFilter, actionsMode]`.

### Composant `PipelineMapView`
- Conteneur orchestrateur : filtres (chips étapes) + carte + drawer.
- Reçoit `opportunities` déjà fetchées par `CrmPipeline` (évite double fetch), filtre par stages + jalons, dérive `mapPoints` via le hook ci-dessus.
- État local : `selectedCompanyId`.

### Extension `CrmCompaniesMap` (rétro-compatible)
- Ajouter prop optionnelle `renderTooltip?: (point) => ReactNode` → si fournie, remplace le tooltip par défaut.
- Ajouter prop optionnelle `colorBy?: (point) => string` → override couleur du pin.
- Aucun changement pour l'usage existant Annuaire.

### Fichiers créés / édités
| Fichier | Action |
|---|---|
| `src/components/crm/pipeline/PipelineStagesFilter.tsx` | **Créer** — chips multi-select étapes |
| `src/components/crm/pipeline/PipelineMapView.tsx` | **Créer** — vue carte complète |
| `src/components/crm/pipeline/PipelineMapTooltip.tsx` | **Créer** — vignette riche |
| `src/hooks/useCrmPipelineMapData.ts` | **Créer** — agrège opp+company+contact+marches |
| `src/components/crm/CrmCompaniesMap.tsx` | **Éditer** — props `renderTooltip` + `colorBy` |
| `src/pages/CrmPipeline.tsx` | **Éditer** — 3ᵉ bouton Map, URL `?stages=`, rendu `PipelineMapView` |

### URL state
- `?view=map` (persistance vue)
- `?stages=relance_2,gagne` (filtre étapes)
- `?actions=plaquette_envoyee&actions_mode=or` (déjà géré)
- `?company=<uuid>` (drawer ouvert)

## Garde-fous
- Entreprises sans `latitude/longitude` → exclues de la carte, comptées dans "N sans géoloc" (lien vers Annuaire pour géocoder).
- Multi-entreprises sur 1 opportunité : chaque entreprise est un pin (rôle "primary" mis en avant, autres en pin plus petit / atténué).
- Aucun changement du Kanban / Liste existant.
- Tokens HSL uniquement (cohérent design system CRM).

## Vérification après build
1. `/admin/crm/pipeline?view=map` → carte rendue, pins colorés par étape.
2. Désélectionner toutes les étapes sauf "Relance 2" + "Gagné" → seules ces opp restent.
3. Hover un pin → vignette riche.
4. Clic pin → drawer entreprise s'ouvre (le même qu'Annuaire).
5. Recharger la page avec `?stages=…&actions=…` → état restauré.
