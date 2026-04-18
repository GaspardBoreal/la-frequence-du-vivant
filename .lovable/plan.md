

## Ajout d'un tri dans les filtres de /admin/marches

### Concept

Ajouter un sélecteur de tri dans le bloc "Filtres" (composant `AdminFilters`) permettant de classer la liste des marches selon 4 critères :

- **Date (décroissant)** — par défaut, comportement actuel
- **Date (croissant)**
- **Nom de la marche (A → Z)**
- **Nom de la marche (Z → A)**

### Emplacement visuel

Le sélecteur prendra place dans le bloc `AdminFilters`, sur une nouvelle ligne discrète intitulée **"Trier par"**, juste sous la grille principale Exploration / Organisateur / Ville / Région / Département, avant la section "Filtres de contenu". Un simple `<Select>` (shadcn) avec icône `ArrowUpDown` suffit.

```text
┌─────────────────────────────────────────────────┐
│ Exploration | Organisateur | Ville | Région ... │
│ Département                                     │
│                                                 │
│ Trier par : [↕ Date (plus récentes) ▾]          │
│                                                 │
│ Filtres de contenu                              │
│ ☐ Sans photo  ☐ Sans audio  ☐ Sans texte        │
└─────────────────────────────────────────────────┘
```

### Logique technique

1. Ajouter un `useState<SortOption>('date_desc')` dans `AdminFilters`.
2. Étendre la fonction de filtrage existante avec un `.sort()` final appliqué juste avant `onFilterChange(filtered)`.
3. Comparateurs :
   - `date_desc` / `date_asc` : `new Date(a.date).getTime()` (gestion des dates manquantes → poussées en fin)
   - `nom_asc` / `nom_desc` : `a.nomMarche.localeCompare(b.nomMarche, 'fr', { sensitivity: 'base' })`
4. Le tri se déclenche dans le même `useEffect` qui recalcule les marches filtrées.

### Impact

- **1 seul fichier modifié** : `src/components/admin/AdminFilters.tsx`
- Aucun changement dans `MarcheAdmin.tsx`, ni dans `MarcheList.tsx`, ni dans le hook `useSupabaseMarches` (le tri par date décroissante du hook reste, le composant ne fait que ré-ordonner ensuite).
- Aucune migration SQL, aucune modification d'autres composants.

### Fichier concerné

| Fichier | Action |
|---|---|
| `src/components/admin/AdminFilters.tsx` | Ajout d'un `Select` "Trier par" + logique de tri appliquée avant `onFilterChange` |

