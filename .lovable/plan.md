

# Afficher le nombre de marches par organisateur dans le filtre

## Modification unique

### `src/components/admin/AdminFilters.tsx`

1. **Modifier le fetch** (ligne 93) : remplacer la requete par un fetch qui compte aussi les marches par organisateur. Deux approches possibles — la plus simple : fetcher separement les marches avec `organisateur_id` et compter cote client (comme deja fait dans `OrganisateursAdmin.tsx`).

Concretement, dans le `useEffect` (lignes 91-97) :

```ts
const fetchOrganisateurs = async () => {
  const [orgResult, marchesResult] = await Promise.all([
    supabase.from('marche_organisateurs').select('id, nom').order('nom'),
    supabase.from('marches').select('organisateur_id')
  ]);
  if (orgResult.data) {
    const counts: Record<string, number> = {};
    marchesResult.data?.forEach((m: any) => {
      if (m.organisateur_id) counts[m.organisateur_id] = (counts[m.organisateur_id] || 0) + 1;
    });
    setOrganisateurs(orgResult.data.map(o => ({ ...o, marches_count: counts[o.id] || 0 })));
  }
};
```

2. **Mettre a jour le type** du state `organisateurs` pour inclure `marches_count: number`.

3. **Afficher le compte** dans le `SelectItem` (ligne 457-458) :

```tsx
{org.nom} ({org.marches_count})
```

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/admin/AdminFilters.tsx` | Modifier (fetch + affichage) |

