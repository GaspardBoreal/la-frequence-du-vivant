## Objectif
Afficher la date de création du compte sur chaque carte marcheur de la liste `/admin/community` → onglet Communauté.

## Modification
**`src/components/admin/community/ProfilCard.tsx`**
- Dans le footer de la carte (où s'affiche déjà « N marche(s) » et le bouton Éditer), ajouter une mention discrète « Inscrit·e le JJ/MM/AAAA » utilisant `profile.created_at` (déjà disponible dans le type et déjà chargé par `ProfilsPanel`).
- Format français via `toLocaleDateString('fr-FR')`, avec icône `CalendarPlus` (lucide-react), classes `text-[11px] text-muted-foreground` pour rester sobre.

## Hors-périmètre
- Pas de changement de requête (le champ `created_at` est déjà sélectionné par `select('*')`).
- Pas de modification du tri ni du schéma.
- Aucune logique métier touchée.