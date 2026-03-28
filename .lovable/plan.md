

# Fix Vivant tab: use same hook as web for consistent data

## Root cause

VivantTab has its own duplicated query logic (snapshot + realtime fallback) that diverges from the web's `useBiodiversityData` hook. When switching marches, the two-query chain can fail silently, and the data format normalization adds fragility.

## Solution

Replace the two custom queries (snapshot + realtime) in VivantTab with:
1. A small query to fetch lat/lng from the `marches` table (already exists)
2. The shared `useBiodiversityData` hook with `radius: 0.5, dateFilter: 'recent'` -- identical to the web

This guarantees the same cache, same parameters, same data format as the bioacoustic pages.

## File: `src/components/community/MarcheDetailModal.tsx`

| Change | Detail |
|---------|--------|
| Import `useBiodiversityData` | Add import from `@/hooks/useBiodiversityData` |
| VivantTab: remove snapshot query | Delete the `marche-detail-biodiv-by-marche` useQuery block (lines 545-558) |
| VivantTab: remove realtime query | Delete the `marche-detail-biodiv-realtime` useQuery block (lines 561-589) |
| VivantTab: add lat/lng query | Keep a small query fetching `latitude, longitude` from `marches` table by `marcheId` |
| VivantTab: add useBiodiversityData | Call `useBiodiversityData({ latitude, longitude, radius: 0.5, dateFilter: 'recent' })` |
| VivantTab: update display references | Change `territoryData.total_species` to `biodiversityData?.summary?.totalSpecies`, `birds_count` to `summary.birds`, `plants_count` to `summary.plants`, `species_data` to `species` |
| VivantTab: update processSpeciesData call | Pass `biodiversityData?.species` instead of `territoryData?.species_data` |

## Data flow after fix

```text
VivantTab
  │
  ├─ Query: fetch lat/lng from marches table (by marcheId)
  │
  └─ useBiodiversityData({ lat, lng, radius: 0.5, dateFilter: 'recent' })
      │
      ├─ Same queryKey as web pages → shared cache
      ├─ Same edge function call → identical results
      └─ Returns { summary: { totalSpecies, birds, plants... }, species: [...] }
```

## Fallback behavior

Since `useBiodiversityData` has `retry: 2` and `staleTime: 24h`, if the API temporarily returns 0, the cached value from a previous successful fetch (same coordinates) will be used. Both marches share GPS `(45.41382, 0.0089)` so a single successful fetch covers both.

