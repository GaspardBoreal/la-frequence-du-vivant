## Objectif

Permettre de tracer les actions réalisées sur chaque opportunité (jalons du process commercial) et filtrer le pipeline par ces jalons.

## Les 4 actions (dans l'ordre process)

1. Plaquette envoyée
2. Fiche préparation Marche
3. Point d'avancement
4. Pack du vivant complet

Chaque opportunité peut en avoir 0 à 4 (multi-sélection).

## 1. Base de données

Migration : ajouter sur `crm_opportunities`
- `actions_realisees text[] NOT NULL DEFAULT '{}'` — codes : `plaquette_envoyee`, `fiche_preparation_marche`, `point_avancement`, `pack_vivant_complet`
- Index GIN pour filtrage rapide

## 2. Catalogue partagé

Nouveau `src/lib/crmOpportunityActions.ts` :
- type `OpportunityActionCode`
- `OPPORTUNITY_ACTIONS` : array ordonné `{ code, label, shortLabel, icon (lucide), description, color }` avec une palette inspirée (chaque action a sa propre teinte du design system — primary / amber / sky / emerald, en HSL via tokens).

## 3. Formulaire opportunité (création / modification)

Dans `OpportunityForm.tsx` :
- Ajout champ `actions_realisees: string[]` au schéma Zod, defaults `[]`.
- Nouvelle section « Actions réalisées » entre les blocs existants : 4 cartes-pills cliquables, ordonnées, affichant numéro (1→4), icône, label, courte description.
- Sélection multiple : clic toggle. État sélectionné = fond teinté + ring + check animé + scale subtil. Hover = élévation douce.
- Mini-progress bar « 2/4 jalons » au-dessus du groupe pour donner un feedback inspirant.
- Sauvegarde via `updateOpportunity` / `createOpportunity` (déjà génériques).

## 4. Affichage sur les cartes Kanban + liste

`OpportunityCard.tsx` : rangée de 4 mini-pastilles numérotées (1-4) — saturées si action faite, sinon outline discret. Tooltip au survol. Compact, n'alourdit pas la carte.

Vue liste pipeline : nouvelle colonne « Actions » avec les mêmes 4 pastilles compactes.

## 5. Filtre sur /admin/crm/pipeline

Nouveau composant `PipelineActionsFilter.tsx` au-dessus du Kanban/Liste :
- Barre élégante alignée avec les KPIs : label « Filtrer par jalons » + les 4 chips toggle (mêmes visuels que dans le form, version compacte).
- Logique : multi-sélection. Mode « ET » (l'opportunité doit avoir TOUTES les actions cochées) — option de toggle « ET / OU » discret à droite si besoin (par défaut ET, plus utile pour "dossiers traités selon le process complet").
- Bouton « Réinitialiser » qui apparaît quand au moins un filtre est actif.
- Compteur « X opportunités correspondent ».
- État stocké dans l'URL (`?actions=plaquette_envoyee,point_avancement`) pour partage/persistance.

Câblage : `CrmPipeline.tsx` filtre `opportunities` avant de les passer au Kanban (via prop) et à la table liste. Le `KanbanBoard` accepte une prop optionnelle `filterPredicate` ou reçoit directement `opportunitiesByStatus` filtré (refacto léger du hook ou filtrage local dans la page).

## 6. UX / UI — soin particulier

- Tokens HSL existants (pas de couleurs hardcodées).
- Animations Motion : fade+scale 150ms à la sélection, stagger sur l'apparition initiale des 4 chips.
- Numérotation visible (cercle 1-4) qui rappelle que c'est un parcours ordonné, sans bloquer l'ordre de sélection.
- État « process complet » (4/4) : micro-célébration — ring doré + label « Process complet ✨ » sur la carte.
- Responsive : sur mobile les chips passent en grille 2×2 compacte.

## Détails techniques

- DB : `ALTER TABLE public.crm_opportunities ADD COLUMN actions_realisees text[] NOT NULL DEFAULT '{}'`. Pas de CHECK constraint (validation côté UI + catalogue). Index : `CREATE INDEX crm_opportunities_actions_realisees_idx ON public.crm_opportunities USING gin (actions_realisees)`.
- Types : ajout du champ dans `src/types/crm.ts` `CrmOpportunity` (regeneré auto pour `types.ts`).
- Hook `useCrmOpportunities` : aucun changement nécessaire (passe-plat).
- Filtre URL via `useSearchParams` (déjà importé dans la page).
- Aucune modification du backend/edge functions.
