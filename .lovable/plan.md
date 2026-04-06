

## Nettoyage admin : suppression /admin/marcheurs et réorganisation des liens

### Analyse

| Route | Page | Table utilisée | Statut |
|-------|------|----------------|--------|
| `/admin/marcheurs` | `MarcheursAdmin` | `exploration_marcheurs` (équipages d'explorations) | A supprimer |
| `/admin/community` | `CommunityProfilesAdmin` | `community_profiles` (marcheurs avec rôles/progression) | Conservé — source de vérité |

**`MarcheursManager`** (composant) est aussi utilisé dans `ExplorationAnimatorRefactored` pour gérer les marcheurs par exploration. Ce composant est conservé.

**`AllMarcheursView`** n'est utilisé que par `MarcheursAdmin`. Il sera supprimé.

### Actions

**1. Supprimer la page et la route `/admin/marcheurs`**

- `src/pages/MarcheursAdmin.tsx` — supprimer le fichier
- `src/components/admin/AllMarcheursView.tsx` — supprimer le fichier (usage unique dans MarcheursAdmin)
- `src/App.tsx` — retirer l'import de `MarcheursAdmin` et la route `/admin/marcheurs`

**2. Rediriger "Accéder aux Marcheurs" vers `/admin/community`**

Dans `src/pages/AdminAccess.tsx` ligne 108 : changer le lien de `/admin/marcheurs` à `/admin/community`.

**3. Supprimer le bouton "Communauté" du widget Événements & Communauté**

Dans `src/pages/AdminAccess.tsx` lignes 133-138 : retirer le `<Link to="/admin/community">` et son bouton. Le widget ne garde que le bouton "Événements".

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Supprimer | `src/pages/MarcheursAdmin.tsx` |
| Supprimer | `src/components/admin/AllMarcheursView.tsx` |
| Modifier | `src/App.tsx` (retirer import + route) |
| Modifier | `src/pages/AdminAccess.tsx` (rediriger lien + supprimer bouton) |

### Sécurité

- `MarcheursManager` reste intacte (utilisé par `ExplorationAnimatorRefactored`)
- `MarcheurObservationsManager` reste intacte (utilisé par `MarcheursManager`)
- Aucune table n'est modifiée, aucune donnée supprimée

