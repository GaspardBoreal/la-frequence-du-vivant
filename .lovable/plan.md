

# Fix Carte tab — empty state despite valid GPS data

## Diagnostic

The `marches` table contains valid GPS coordinates for all 9 steps of "La transhumance de Mouton Village" (verified via DB query — lat/lng values like 46.64042/0.15991 etc.). Yet the Carte tab likely shows "Aucune coordonnee GPS" instead of the map.

**Root cause identified**: The filtering at line 214-217 in `ExplorationCarteTab.tsx` checks `m.latitude != null && m.longitude != null`. However, the Supabase query result passes through `(m as any).latitude ?? null` at line 348-349 of `ExplorationMarcheurPage.tsx`. If there's any issue with Supabase's type inference stripping `latitude`/`longitude` from the select result (because the TypeScript generated types might not include them in the narrow select), the spread `...m` might not carry them, and `(m as any).latitude` could return `undefined` which `?? null` converts to `null`.

**The real fix**: Remove the defensive `(m as any)` casting and ensure the query return type includes latitude/longitude explicitly. Also add console logging to debug.

## Plan

### File: `src/components/community/ExplorationMarcheurPage.tsx`

1. In the marches query (line 138-141), ensure the select explicitly returns latitude and longitude — already done, but verify the TypeScript inference is correct by adding type annotation to the query result.

2. In the carte tab props (lines 346-351), simplify the mapping — remove the `(m as any)` defensive casting since the select already includes these fields. Cast the entire query result to the proper type.

3. Add a type assertion on the Supabase query to ensure `latitude` and `longitude` are in the returned shape:
```typescript
const { data: marches } = await supabase
  .from('marches')
  .select('id, nom_marche, ville, latitude, longitude')
  .in('id', links.map(l => l.marche_id))
  .returns<{ id: string; nom_marche: string | null; ville: string; latitude: number | null; longitude: number | null }[]>();
```

### File: `src/components/community/exploration/ExplorationCarteTab.tsx`

4. Add a `console.log` in development to trace incoming marches data, making future debugging easier. Also make the empty state message more informative (show how many marches were received vs how many had coordinates).

## Files impacted

| File | Action |
|---|---|
| `src/components/community/ExplorationMarcheurPage.tsx` | Add `.returns<>()` type assertion on marches query + simplify carte props |
| `src/components/community/exploration/ExplorationCarteTab.tsx` | Add debug logging + improve empty state info |

