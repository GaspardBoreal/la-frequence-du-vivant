## Objectif
Ajouter une colonne « Inscription » (date de création du compte) entre les colonnes « Rôle » et « Marches » dans la table de l'onglet Communauté de `/admin/community`.

## Modification
**`src/pages/CommunityProfilesAdmin.tsx`** (table de l'onglet Communauté, lignes ~270-340)

1. Ajouter `<TableHead>Inscription</TableHead>` entre `Rôle` (l.273) et `Marches` (l.274).
2. Ajouter la cellule correspondante entre la cellule Rôle (l.295-300) et la cellule Marches (l.301) :
   - Affiche `profile.created_at` formaté en `toLocaleDateString('fr-FR')`
   - Fallback `—` si absent
   - Classe `text-xs text-muted-foreground` pour rester discret
3. Mettre à jour `colSpan={7}` → `colSpan={8}` sur la ligne vide (l.334).

Le champ `created_at` est déjà sélectionné par la requête existante (l.72 `.order('created_at', …)` et le `select` du profil), aucun changement de requête nécessaire.

## Hors-périmètre
- Pas de modification de la mosaïque (déjà traitée précédemment).
- Pas de tri ni de filtre supplémentaire.
- Pas de changement de schéma ni de requête.
