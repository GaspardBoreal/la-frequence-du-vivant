## Objectif

Corriger définitivement le filtre **Activité (NAF/APE)** sur `/admin/crm/annuaire?tab=entreprises`, qui s’ouvre visuellement mais reste non interactif / figé, puis vérifier que la sélection applique bien le filtre sur la liste Entreprises.

## Diagnostic

Le correctif précédent a été appliqué au mauvais composant.

- `/admin/crm/annuaire` onglet **Annuaire** utilise `src/components/crm/CompanySearchFiltersDrawer.tsx`
- `/admin/crm/annuaire?tab=entreprises` onglet **Entreprises** utilise `src/components/crm/filters/ImportedCompanyFiltersDrawer.tsx`
- Le combobox NAF de ce second drawer possède encore sa propre implémentation, distincte, sans les ajustements nécessaires pour cohabiter correctement avec le `Sheet` Radix.

Le câblage du filtre est, lui, déjà correct :
- la sélection alimente `companyFilters.code_naf` dans `src/pages/CrmAnnuaire.tsx`
- puis `useCrmCompanies()` filtre bien avec `q.eq('code_naf', filters.code_naf)`

Le bug est donc **UI / interaction**, pas métier.

## Changements à faire

### 1. Corriger le bon composant
Fichier : `src/components/crm/filters/ImportedCompanyFiltersDrawer.tsx`

Mettre à jour le `NafCombobox` interne pour qu’il fonctionne correctement dans le contexte du `Sheet` :
- activer le mode adapté du `Popover`
- relever la couche (`z-index`) du `PopoverContent`
- conserver une largeur calée sur le trigger
- s’assurer que l’ouverture/fermeture reste pilotée proprement par l’état local

### 2. Éviter la duplication source du bug
Toujours dans `ImportedCompanyFiltersDrawer.tsx`, aligner cette implémentation avec le composant mutualisé déjà présent dans `src/components/crm/filters/NafCombobox.tsx`, afin d’éviter une divergence future.

Deux options valides pendant l’implémentation :
- soit réutiliser directement le composant mutualisé `NafCombobox`
- soit reproduire strictement la même configuration technique dans le composant local

Préférence d’implémentation : **réutiliser le composant mutualisé** pour supprimer la duplication.

### 3. Vérifier le fonctionnement du filtre
Confirmer après correction que :
- la liste déroulante s’ouvre et reste cliquable
- on peut taper dans la recherche NAF
- le choix d’un code ferme bien la liste
- la puce / valeur du filtre remonte dans l’UI
- la liste Entreprises est bien filtrée via `code_naf`

## Détails techniques

Fichiers concernés :
- `src/components/crm/filters/ImportedCompanyFiltersDrawer.tsx`
- possiblement `src/components/crm/filters/NafCombobox.tsx` si un petit ajustement partagé est nécessaire

Fichiers relus pour validation du flux :
- `src/pages/CrmAnnuaire.tsx`
- `src/hooks/useCrmCompanies.ts`
- `src/components/ui/popover.tsx`
- `src/components/ui/sheet.tsx`

## Hors scope

- Pas de changement de logique SQL / Supabase
- Pas de modification du filtre NAF de l’onglet Annuaire, sauf si un mini-ajustement partagé est requis pour la mutualisation
- Pas de refonte visuelle du drawer au-delà de ce qui est nécessaire pour rendre l’interaction fiable