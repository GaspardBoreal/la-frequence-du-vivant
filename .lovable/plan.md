## Objectif

Réorganiser l'ordre des blocs fonctionnels sur la page `/access-admin-gb2025` (fichier `src/pages/AdminAccess.tsx`) et renommer un bloc.

## Modification unique : `src/pages/AdminAccess.tsx`

Réorganiser l'ordre des `<Card>` dans la grille et renommer une carte. Aucun changement de logique, de routes, de styles ou de composants enfants.

### Nouvel ordre des cartes

```text
1. Gestion des Marches         → /admin/marches
2. Gestion des Explorations    → /admin/explorations
3. Événements Grand Public     → /admin/marche-events  (renommé)
4. Gestion des Marcheurs       → /admin/community
5. Organisateurs               → /admin/organisateurs
6. Outils                      → /admin/outils
7. Automations & Intégrations  → /admin/automations
8. CRM & Commercial            → /admin/crm (+ sous-boutons Pipeline / Équipe)
```

### Renommage

La carte **« Événements & Communauté »** devient **« Événements Grand Public »**.
- Titre `<h2>` mis à jour.
- Icône, couleurs (emerald), route et bouton inchangés.
- Description légèrement ajustée pour rester cohérente avec le nouveau nom.

### Cas de la carte « Exportations & Rapports »

Elle existe aujourd'hui mais n'apparaît pas dans la liste demandée. Par défaut, je la conserverai en fin de grille (après CRM) pour ne rien casser. Si vous préférez qu'elle soit supprimée ou déplacée ailleurs, dites-le moi avant l'implémentation.