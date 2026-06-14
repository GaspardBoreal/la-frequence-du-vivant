## Ajouter un nom (titre) aux opportunités

### 1. Base de données
Migration : ajouter `titre text` à `crm_opportunities` avec `CHECK (char_length(titre) <= 250)`. Le champ `nom` existant est conservé (c'est le nom de famille du contact, distinct).

### 2. Types
- `src/types/crm.ts` : ajouter `titre: string | null` sur `CrmOpportunity`.

### 3. Formulaire de création / modification
- `src/components/crm/OpportunityForm.tsx` : ajouter un champ `<Input>` "Nom de l'opportunité" en tout début du formulaire (avant "Entreprises liées"), `maxLength={250}`, avec compteur de caractères discret (ex. `123 / 250`). Inclure `titre` dans le state initial et le payload soumis.

### 4. Vignette Kanban (carte d'opportunité)
- Repérer le composant de carte (probablement `src/components/crm/KanbanCard.tsx` ou équivalent utilisé par `KanbanColumn`).
- Ajouter une première ligne affichant `opp.titre` au-dessus de l'`experience_souhaitee` actuelle.
- Taille de police : légèrement supérieure à la ligne "experience_souhaitee" (ex. si actuel `text-sm font-semibold`, le titre passe en `text-base font-semibold` ; experience devient `text-sm`). Conserver le reste du design (bandeau coloré, badge statut, avatar, footer participants/date) strictement à l'identique.
- Si `titre` est vide, fallback sur l'affichage actuel (pas de ligne vide).

### 5. Mini-carte côté entreprise
- `src/components/crm/company-tabs/CompanyOpportunitiesTab.tsx` (`OpportunityMiniCard`) : même règle — `title = opp.titre || experience || nom/prenom || entreprise`. La hiérarchie typographique de la mini-carte reste inchangée.

### Notes techniques
- Migration SQL : `ALTER TABLE public.crm_opportunities ADD COLUMN titre text; ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_titre_length CHECK (titre IS NULL OR char_length(titre) <= 250);`
- Pas de modification des hooks `useCrmOpportunities` ni `useCompanyOpportunities` (le `select *` propage automatiquement le nouveau champ).
- Validation côté client via `maxLength` sur l'input + garde-fou serveur via le CHECK.
