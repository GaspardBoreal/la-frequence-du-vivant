

# Fix: geocoding still failing for many zones — robust solution

## Root cause (confirmed from response data)

Looking at the actual API response, zones like `"label":"46.521, 0.297"`, `"label":"46.548, 0.258"` etc. show the fallback coordinate format. With 57 zones and `batchSize=3`, we send **3 concurrent requests** every 1.2s. Nominatim's policy is **strictly 1 request per second** — sending 3 in parallel still triggers rate limiting/blocking for 2 out of 3 requests.

## Solution: two-pronged approach

### 1. Edge function: sequential geocoding + spatial cache

**Process ONE zone at a time** (not 3 in parallel) with a 1.1s delay between each. To keep total time acceptable, use a **spatial cache**: if a previously geocoded point is within 2km, reuse its label instead of calling Nominatim again.

With 57 zones spread across ~12km, many points cluster near the same village. Estimated unique geocode calls: ~15-20 instead of 57. At 1.1s each = ~17-22s total — acceptable.

Changes in `supabase/functions/detect-zones-blanches/index.ts`:

1. Replace `batchGeocode` with `sequentialGeocodeWithCache`:
   - Maintain a cache array of `{lat, lng, label}` 
   - Before calling Nominatim, check if any cached point is within 2km (using `haversineKm`)
   - If cache hit → reuse label, no API call
   - If cache miss → call `reverseGeocode` ONE at a time, wait 1.1s, store in cache
2. Add a second retry with 1s delay in `reverseGeocode` (currently only 600ms)
3. Keep species sampling unchanged

### 2. Client-side fallback in the UI component

As a safety net, if the edge function still returns a coordinate-format label (matches pattern `XX.XXX, X.XXX`), the tooltip should display "Zone non identifiée" or attempt a client-side reverse geocode. This ensures the UI never shows raw GPS coordinates.

Changes in `src/components/zones-blanches/DetecteurZonesBlanches.tsx`:
- Add a helper `isCoordinateLabel(label)` that detects the fallback format
- In tooltip rendering, if coordinate label detected, show "Lieu-dit non référencé" instead

## Performance estimate

- ~20 unique Nominatim calls × 1.1s = ~22s geocoding
- GBIF scan phases: ~10-15s  
- Total: ~30-35s — acceptable for a deep scan

