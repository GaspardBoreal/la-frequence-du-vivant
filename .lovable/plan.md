# Simplifier le bloc CRM & Commercial dans /admin

## Contexte
Dans `src/pages/AdminAccess.tsx` (lignes ~161-190), le bloc **CRM & Commercial** affiche aujourd'hui 3 boutons (Tableau de Bord, Pipeline, Équipe) qui pointent vers `/admin/crm`, `/admin/crm/pipeline` et `/admin/crm/equipe`.

Depuis l'introduction du shell CRM (`src/layouts/CrmShell.tsx` + `CrmSidebar`), toutes ces sections sont déjà accessibles via la sidebar latérale une fois entré dans le module. Les 3 boutons font donc doublon.

## Changement
Remplacer les 3 boutons par **un seul bouton principal « Accéder au CRM »** qui ouvre `/admin/crm` (point d'entrée du shell avec bandeau/sidebar).

### Détails UI
- Conserver l'en-tête du bloc (icône mallette verte + titre « CRM & Commercial » + description courte existante).
- Bouton unique pleine largeur, style identique à l'actuel « Tableau de Bord » (variant primaire vert), icône `ArrowRight` (ou conserver `LayoutDashboard`), libellé **« Accéder au CRM »**.
- Lien `<Link to="/admin/crm">`.
- Supprimer la ligne contenant les boutons Pipeline + Équipe.

## Fichier modifié
- `src/pages/AdminAccess.tsx` — bloc CRM uniquement (≈ lignes 161-190).

Aucun autre changement (routes, shell, sidebar) n'est nécessaire — la navigation interne au CRM reste assurée par la sidebar.
