

# Fix: city names missing for high-observation zones (Choeur, Symphonie)

## Root cause

In `supabase/functions/detect-zones-blanches/index.ts` (lines 232-243), only **blank zones + the 5 weakest non-blank zones** are geocoded via Nominatim. All other zones (Souffle, Choeur, Symphonie) keep their label as an empty string `''`, which is why the tooltip shows raw coordinates like "46.629, 0.414" instead of a city name.

## Fix

**Geocode ALL zones**, not just blanks + weakest. To respect Nominatim's rate limit (1 req/sec), process geocoding in batches of 8 with a 1-second delay between batches.

### `supabase/functions/detect-zones-blanches/index.ts`

Replace the selective geocoding block (lines 232-243) with:
1. A helper function `batchGeocode(zones, batchSize=8)` that processes zones in batches with 1s delay between batches
2. Call `batchGeocode(results)` to geocode ALL zones
3. Keep species sampling only for blanks + 5 weakest (unchanged)

### `src/components/zones-blanches/DetecteurZonesBlanches.tsx`

No changes needed — the tooltip already displays `zone.label`, it just receives empty strings for non-geocoded zones.

### `src/hooks/useDetecteurZonesBlanches.ts`

No changes needed.

## Impact

- All zones will display their city/village name regardless of observation count
- Worst case: 81 zones = ~10 batches = ~10 seconds of geocoding (acceptable since scan itself takes 10-15s)
- Edge function deployment required

