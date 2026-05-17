## Objectif

Action « Dupliquer » sur `/admin/explorations` qui clone une exploration **sans toucher aux marches elles-mêmes** : on recrée uniquement la coquille éditoriale (exploration + pages + liens vers les marches existantes).

## Périmètre exact

### Tables copiées

**`explorations`** (1 ligne) — whitelist :
- `name` → saisi dans le dialog
- `slug` → recalculé depuis le nouveau `name` (avec suffixe `-2`, `-3`… si collision)
- `description`, `exploration_type`, `cover_image_url`, `is_loop`, `language`
- `meta_title`, `meta_description`, `meta_keywords`
- `published` → **forcé à `false`** (sécurité publication)
- `id`, `created_at`, `updated_at` → defaults DB

**`exploration_pages`** (N lignes) — copie 1:1 avec nouvel `exploration_id` :
- `type`, `ordre`, `nom`, `description`, `config` (JSON copié tel quel)

**`exploration_marches`** (N lignes) — table de liaison, copie 1:1 avec nouvel `exploration_id` :
- `marche_id` → **identique** (pointe vers la même marche globale)
- `ordre` → conservé
- `publication_status` → **forcé à `draft`** (chaque marche doit être republiée manuellement dans la copie)
- `partie_id` → **forcé à `null`** (les parties ne sont pas copiées dans cette V1, voir ci-dessous)

### Tables **NON** copiées

- `marches` (jamais dupliquées — réutilisées telles quelles via `exploration_marches.marche_id`)
- `marche_textes`, `marche_audio`, médias, observations, snapshots biodiversité (attachés aux marches, donc partagés naturellement avec la copie)
- `exploration_parties` (mouvements littéraires) → non copiées en V1. Conséquence : les marches de la copie apparaissent dans la liste, mais sans regroupement en mouvements. L'admin peut les recréer ensuite via le gestionnaire de parties existant.
- `exploration_marcheurs`, `exploration_waypoints`, `marche_events`, logs, témoignages, curations, audios de l'exploration — jamais copiés.

## UX

### Mini-dialog « Dupliquer cette exploration »

Composant `DuplicateExplorationDialog.tsx` (shadcn `Dialog`) avec :
- Input **Titre de la copie** (défaut : `"{name} (copie)"`)
- Bloc d'information listant ce qui est copié / non copié :
  - Copié : infos de base, pages, liste des marches (en `draft`)
  - Non copié : mouvements littéraires, statut publié (forcé OFF), médias éditoriaux de l'exploration
- Boutons `Annuler` / `Dupliquer` (loading state)

### Points d'entrée

1. **Menu kebab `⋮`** sur chaque `PoeticExplorationCard` dans `/admin/explorations`
   - `DropdownMenu` shadcn avec actions « Ouvrir », « Éditer », « Dupliquer »
   - `stopPropagation` pour ne pas déclencher la navigation de la carte
2. **Bouton « Dupliquer »** dans le header de `ExplorationFormPage` à côté des actions existantes

### Après confirmation

1. Insert atomique des 3 tables (voir « Implémentation » — ordre : exploration → pages → liens marches)
2. Toast succès : « Exploration dupliquée »
3. Invalidate React Query : `['admin-explorations']`, `['explorations']`, `['exploration-pages']`, `['exploration-marches']`
4. Redirection vers `/admin/explorations/{newId}` (page d'édition) pour ajustement immédiat

### Gestion d'erreur

- Validation Zod : titre non vide (min 2, max 200)
- En cas d'échec après insertion partielle (ex. pages OK mais liens marches KO) → suppression cascade de la nouvelle exploration pour ne pas laisser de coquille corrompue
- Toast `destructive` avec message lisible

## Implémentation technique

```text
src/
├─ hooks/useDuplicateExploration.ts          # mutation react-query
├─ components/admin/
│   ├─ DuplicateExplorationDialog.tsx        # dialog réutilisable
│   └─ ExplorationActionsMenu.tsx            # kebab menu (réutilisable)
├─ pages/ExplorationsAdmin.tsx               # ajout kebab sur card + state dialog
└─ pages/ExplorationFormPage.tsx             # ajout bouton header + state dialog
```

### `useDuplicateExploration` (séquentiel, fail-safe)

```ts
async ({ sourceId, newName }) => {
  // 1. SELECT source exploration
  // 2. Calcul slug unique (boucle suffix -2, -3… via SELECT exists)
  // 3. INSERT new exploration (published=false) → newId
  try {
    // 4. SELECT exploration_pages WHERE exploration_id = sourceId
    // 5. INSERT pages avec exploration_id = newId
    // 6. SELECT exploration_marches WHERE exploration_id = sourceId
    // 7. INSERT liens avec exploration_id = newId, publication_status='draft', partie_id=null
    return newId;
  } catch (e) {
    // rollback : DELETE FROM explorations WHERE id = newId (CASCADE supprime pages + liens)
    throw e;
  }
}
```

### Slug

Réutilise `createSlug()` de `src/utils/slugGenerator.ts` à partir du nouveau `name`, puis vérifie l'unicité (`SELECT id FROM explorations WHERE slug = ?`) et incrémente `-2`, `-3`… en cas de collision.

### RLS

Aucune migration nécessaire — les policies INSERT admin existent déjà sur `explorations`, `exploration_pages`, `exploration_marches` (utilisées par la création standard et le gestionnaire de mouvements).

## Design system

- `Dialog`, `Input`, `Button`, `DropdownMenu`, `Alert` shadcn
- Icône `Copy` (lucide) pour les CTA
- Tokens sémantiques uniquement (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `gaspard-*` pour rester cohérent avec l'atelier poétique existant)
- Toast `sonner`

## Question ouverte

Les **mouvements littéraires** (`exploration_parties`) ne sont pas copiés dans cette V1 (les marches arrivent dans la copie sans regroupement). Confirmes-tu, ou veux-tu que je les copie aussi avec re-mapping des `partie_id` dans `exploration_marches` ? Je peux l'ajouter rapidement.
