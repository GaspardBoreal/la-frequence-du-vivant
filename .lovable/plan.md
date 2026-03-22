

# Ajouter le filtre par Organisateur dans AdminFilters

## Approche

Ajouter un filtre `Select` "Organisateur" dans la grille de filtres existante, entre le filtre Exploration et le filtre Ville.

## Modifications

### 1. `src/utils/supabaseDataTransformer.ts`

Ajouter `organisateur_id` au format legacy transforme (ligne ~66, apres `adresse`) :

```ts
organisateur_id: marche.organisateur_id || undefined,
```

Et ajouter le champ dans le type `MarcheTechnoSensible` (dans `googleSheetsApi.ts`).

### 2. `src/utils/googleSheetsApi.ts` — type `MarcheTechnoSensible`

Ajouter le champ optionnel `organisateur_id?: string`.

### 3. `src/components/admin/AdminFilters.tsx`

- Ajouter un state `organisateurFilter`
- Fetcher la liste des organisateurs depuis `marche_organisateurs` via `supabase.from('marche_organisateurs').select('id, nom')`
- Ajouter un `Select` "Organisateur" dans la grille (apres Exploration)
- Ajouter le filtre dans `applyFilters` : comparer `marche.organisateur_id === organisateurFilter`
- Ajouter handler `handleOrganisateurChange` et integrer dans `clearFilters` et `hasActiveFilters`

### 4. `src/utils/supabaseApi.ts`

Verifier que `fetchMarchesFromSupabase` inclut `organisateur_id` dans le select (il devrait deja etre inclus via `*`).

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/utils/googleSheetsApi.ts` | Ajouter champ `organisateur_id` au type |
| `src/utils/supabaseDataTransformer.ts` | Mapper `organisateur_id` |
| `src/components/admin/AdminFilters.tsx` | Ajouter filtre Select Organisateur |

