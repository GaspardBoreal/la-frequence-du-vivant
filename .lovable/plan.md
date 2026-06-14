## Objectif

Permettre de modifier le **Nom complet** (`nom_complet`) d'une fiche entreprise existante depuis `/admin/crm`, tout en gardant la **Dénomination** (`denomination`, issue de l'API INSEE/Sirene) **non modifiable**.

## Diagnostic

- Aujourd'hui, dans `src/components/crm/CompanyDetailContent.tsx`, l'en-tête affiche `company.denomination ?? company.nom_complet` mais aucun de ces champs n'est éditable.
- À la création manuelle (`CompanyManualCreateDialog.tsx`), les deux champs existent déjà.
- Le hook `useUpdateCompany` est déjà câblé (`patch: Partial<CrmCompany>`) et utilisé pour `site_web` via le pattern `WebsiteField` (édition inline avec crayon + Check/X + Enter/Escape).

## Changements

### 1. Nouveau composant `NomCompletField` (édition inline)
Fichier : `src/components/crm/company-tabs/NomCompletField.tsx`

- Inspiré de `WebsiteField` : label "Nom complet", icône crayon au survol, Enter pour valider, Escape pour annuler, toast de confirmation.
- Validation simple : trim, longueur max raisonnable (255), peut être vidé (revient à `null`).
- Pas d'effet sur la dénomination.

### 2. Intégration dans la fiche
Fichier : `src/components/crm/CompanyDetailContent.tsx`

- Dans l'onglet **Identité**, juste sous le bloc en-tête (ou en première ligne de l'onglet), ajouter :
  - Une ligne **Dénomination** (lecture seule, badge "API INSEE" pour expliquer pourquoi non modifiable).
  - Le champ éditable **Nom complet** via `<NomCompletField />` câblé à `updateCompany.mutate({ id, patch: { nom_complet: v } })`.
- Aucune modification du fallback d'affichage en-tête (`denomination ?? nom_complet`) — il reste cohérent.

### 3. Hors scope
- Pas de migration SQL (les colonnes existent déjà).
- Pas de modification du flow de création manuelle.
- Pas d'édition de la dénomination, par design (source officielle).

## Détails techniques

Fichiers touchés :
- création : `src/components/crm/company-tabs/NomCompletField.tsx`
- édition : `src/components/crm/CompanyDetailContent.tsx`

Hook réutilisé : `useUpdateCompany` (déjà existant dans `src/hooks/useCrmCompanies.ts`).