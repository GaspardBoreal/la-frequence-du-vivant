## Objectif

Enrichir les filtres de période du graphe "Pouls du vivant" (Synthèse → Taxons observés) avec des plages temporelles plus fines et une période personnalisée.

## Nouvelles options de période

Remplacer la barre de chips actuelle (`Tout`, `12 mois`, `6 mois`, `3 mois`, `30 jours`) par :

- Aujourd'hui
- 7 derniers jours
- 30 derniers jours
- Mois dernier (mois calendaire précédent complet)
- Trimestre dernier (trimestre calendaire précédent complet)
- Semestre (6 derniers mois glissants)
- Année (année calendaire en cours)
- 12 mois glissants
- Tout
- Période personnalisée (sélecteur début → fin)

Présentation : un `Select` compact (shadcn) listant les presets pour éviter une barre de chips surchargée, + un bouton "Période…" qui ouvre un `Popover` avec deux `Calendar` (début / fin) quand l'utilisateur choisit "Personnalisée". Le label actif s'affiche dans le trigger.

## Changements techniques

### `src/hooks/useBiodiversityEvolution.ts`
- Étendre le type :
  ```ts
  export type EvolutionPeriod =
    | 'all' | 'today' | '7d' | '30d' | 'last_month' | 'last_quarter'
    | '6m' | 'year' | '12m' | 'custom';
  ```
- Ajouter aux options : `customRange?: { from: string; to: string }` (ISO `YYYY-MM-DD`).
- Remplacer `periodToDays` par une fonction `resolvePeriodRange(period, customRange): { fromISO?: string; toISO?: string }` calculant les bornes calendaires correctes (mois dernier = 1er→dernier jour du mois N-1, trimestre dernier = bornes du trimestre N-1, année = 1er janvier → aujourd'hui).
- Filtrer `sortedDays` avec ces bornes (`>= fromISO && <= toISO`). Garder le cumul absolu inchangé pour la continuité narrative.

### `src/components/community/exploration/BiodiversityEvolutionChart.tsx`
- Remplacer la liste `periodLabels` + ligne de chips par un `Select` shadcn avec les 9 presets + "Personnalisée".
- Quand `period === 'custom'`, afficher à côté un `Popover` avec deux `Calendar` (locale `fr`) pour `from` / `to`, plus un résumé `du JJ/MM/AAAA au JJ/MM/AAAA`.
- État local : `period`, `customRange: { from?: Date; to?: Date }`. Passer `customRange` (sérialisé ISO) au hook.
- Conserver le toggle `Date terrain / Date collecte` et le toggle `Espèces / Observations` tels quels.

## Hors scope

- Aucun changement aux autres graphes ni à `EventBiodiversityTab`.
- Aucun changement back-end (filtrage purement client sur `snapshots` déjà chargés).
- Pas de persistance du choix de période entre sessions.