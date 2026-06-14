## Objectif

Sur `/admin/crm` (Home) :
- Supprimer les deux tuiles **Commandes** et **Factures** (modules à venir, bruit visuel).
- Inclure les opportunités **gagnées** dans le calcul du **CA potentiel** (actuellement uniquement actives → 0 €). Avec la data actuelle, on doit obtenir `0 + 1 260 € = 1 260 €`.

Sur `/admin/crm/pipeline` :
- Appliquer la même règle pour la KPI "CA potentiel" (composant `DashboardKPIs`, alimenté par `useCrmOpportunities.stats.potentialRevenue`).

## Changements

### 1. `src/hooks/useCrmHomeStats.ts`
Élargir le filtre `caPotentiel` pour additionner :
- les opportunités aux statuts actifs (`a_contacter`, `relance_1/2/3`)
- **+ les opportunités `gagne`** (CA acquis = part du potentiel réalisé)

Exclus : `perdu`, `pas_interesse` (et `gagne` n'est plus exclu).

```ts
const REVENUE_STATUSES = [...ACTIVE_STATUSES, 'gagne'];
const caPotentiel = opps
  .filter((o) => REVENUE_STATUSES.includes(o.statut))
  .reduce((sum, o) => sum + (o.budget_estime || 0), 0);
```

### 2. `src/hooks/useCrmOpportunities.ts` (l. 156-158)
Même règle pour `stats.potentialRevenue` utilisé par `DashboardKPIs` sur la page Pipeline :
```ts
potentialRevenue: opportunities
  .filter(o => !['perdu', 'pas_interesse'].includes(o.statut))
  .reduce((sum, o) => sum + (o.budget_estime || 0), 0),
```

### 3. `src/pages/CrmHome.tsx`
- Retirer les deux `<BentoKpiTile>` **Commandes** et **Factures** (et les imports `ShoppingCart`, `FileText` devenus inutiles).
- Retirer `commandes` / `factures` du fallback `s = { ... }`.

### 4. UI — clarification du libellé
Renommer le hint de la tuile "CA potentiel" en **"Opportunités actives + gagnées"** (CrmHome) et garder le libellé "CA potentiel" tel quel sur Pipeline — la sémantique est désormais "pipeline valorisé hors perdu".

## Hors scope

- Pas de migration SQL.
- Pas de retrait du champ `commandes/factures` du type `CrmHomeStats` (laisse la porte ouverte aux futurs modules) — on les calcule toujours à 0 côté hook, simplement plus affichés.
