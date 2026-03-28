

# Fix: Vivant tab not refreshing when switching walk steps

## Root cause

The `realtimeData` query has this `enabled` condition:
```
enabled: !!marcheId && !snapshotLoading && !snapshot
```

This creates a sequential dependency: realtime waits for snapshot to finish. When switching steps via AnimatePresence, there's a timing window where React Query's state transitions (`isLoading` → `false`, `data` → `null`) don't trigger a re-evaluation of `enabled` in time, leaving the realtime query permanently disabled for the new step.

## Fix

Decouple the two queries. Always fetch realtime data independently (both queries run in parallel). The display logic picks the best source: snapshot if valid, otherwise realtime.

## File: `src/components/community/MarcheDetailModal.tsx`

| Change | Detail |
|--------|--------|
| Line 587 | Change `enabled` to `!!marcheId` — remove dependency on `snapshotLoading` and `snapshot` |
| Line 592 | Keep `const territoryData = snapshot \|\| realtimeData;` — snapshot still takes priority when available |

This is a one-line fix. The realtime query will always fire when `marcheId` is present. Since both marches share the same GPS coordinates, the edge function returns the same data. The snapshot is still preferred when it exists.

