## Ajouter un retour vers le hub Audit Frugale

**Problème** : depuis `/audit-frugal/:slug`, impossible de revenir à `/admin/outils/audit-frugal` (hub).

### Modifications

**`src/pages/PublicAuditFrugal.tsx`**
- Ajouter en haut de page un bandeau admin (visible uniquement si `isAdmin`) avec :
  - Bouton **« ← Retour Audit IA Frugale »** → lien vers `/admin/outils/audit-frugal`
  - Bouton **« Copier le lien public »** (bonus déjà proposé)
  - Badge statut public/privé de l'audit en cours
- Utiliser le hook `useAuth` / `useAdmin` existant pour conditionner l'affichage
- Pour les visiteurs non-admin : aucun changement (page publique reste épurée)

**`src/pages/AdminOutilsHub.tsx`** : déjà en place, RAS.

Aucune logique métier touchée — uniquement UI de navigation.