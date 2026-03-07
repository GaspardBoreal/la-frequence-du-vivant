import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DIRECTIONS_4 = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];

// Phase 1: 5×5 grid, 3km spacing, 0.3km scan radius
const GRID_SIZE = 5;
const GRID_SPACING_KM = 3;
const MAILLAGE_RADIUS_KM = 0.3;

// Phase 2: 8 weakest → 4 sub-points at 0.8km, 0.1km scan radius
const ZOOM_OFFSET_KM = 0.8;
const ZOOM_RADIUS_KM = 0.1;
const ZOOM_WEAK_COUNT = 8;

// Phase 3: 6 weakest → 4 nano-points at 0.3km, 0.05km scan radius
const NANO_OFFSET_KM = 0.3;
const NANO_RADIUS_KM = 0.05;
const NANO_WEAK_COUNT = 6;

const KM_TO_DEG_LAT = 0.009;

function offsetCoord(lat: number, lng: number, bearingRad: number, distanceKm: number) {
  const R = 6371;
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const d = distanceKm / R;
  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(bearingRad)
  );
  const newLng = lngRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(d) * Math.cos(latRad),
    Math.cos(d) - Math.sin(latRad) * Math.sin(newLat)
  );
  return { lat: newLat * 180 / Math.PI, lng: newLng * 180 / Math.PI };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildBboxParams(lat: number, lng: number, radiusKm: number): string {
  const dLat = radiusKm * KM_TO_DEG_LAT;
  const dLng = dLat / Math.cos(lat * Math.PI / 180);
  return `decimalLatitude=${(lat - dLat).toFixed(4)},${(lat + dLat).toFixed(4)}&decimalLongitude=${(lng - dLng).toFixed(4)},${(lng + dLng).toFixed(4)}`;
}

async function getGbifCount(lat: number, lng: number, radiusKm: number): Promise<number> {
  const bbox = buildBboxParams(lat, lng, radiusKm);
  const url = `https://api.gbif.org/v1/occurrence/search?${bbox}&limit=0`;
  try {
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return -1;
    const data = await resp.json();
    return data.count ?? -1;
  } catch {
    return -1;
  }
}

interface SpeciesSample {
  scientificName: string;
  commonName?: string;
  date?: string;
}

async function getGbifSample(lat: number, lng: number, radiusKm: number, limit = 5): Promise<SpeciesSample[]> {
  const bbox = buildBboxParams(lat, lng, radiusKm);
  const url = `https://api.gbif.org/v1/occurrence/search?${bbox}&limit=${limit * 3}&hasCoordinate=true&fields=species,vernacularName,eventDate,genericName`;
  try {
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return [];
    const data = await resp.json();
    const seen = new Set<string>();
    const samples: SpeciesSample[] = [];
    for (const r of data.results ?? []) {
      const name = r.species || r.genericName;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      samples.push({ scientificName: name, commonName: r.vernacularName || undefined, date: r.eventDate || undefined });
      if (samples.length >= limit) break;
    }
    return samples;
  } catch {
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number, retry = true): Promise<string> {
  const fallback = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'User-Agent': 'LaFrequenceDuVivant/1.0' } }
    );
    if (!resp.ok) {
      if (retry) {
        await new Promise(r => setTimeout(r, 600));
        return reverseGeocode(lat, lng, false);
      }
      return fallback;
    }
    const data = await resp.json();
    const addr = data.address;
    return addr?.hamlet || addr?.village || addr?.town || addr?.city || addr?.municipality || data.display_name?.split(',')[0] || fallback;
  } catch {
    if (retry) {
      await new Promise(r => setTimeout(r, 600));
      return reverseGeocode(lat, lng, false);
    }
    return fallback;
  }
}

type Resolution = 'maillage' | 'zoom' | 'nano';

interface ZoneResult {
  lat: number;
  lng: number;
  distance_km: number;
  observations: number;
  is_blank: boolean;
  label: string;
  resolution: Resolution;
  scan_radius_km: number;
  sample_species: SpeciesSample[];
}

async function scanPoints(
  points: { lat: number; lng: number }[],
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  resolution: Resolution,
): Promise<ZoneResult[]> {
  return Promise.all(
    points.map(async (p) => {
      const observations = await getGbifCount(p.lat, p.lng, radiusKm);
      return {
        lat: Math.round(p.lat * 10000) / 10000,
        lng: Math.round(p.lng * 10000) / 10000,
        distance_km: Math.round(haversineKm(centerLat, centerLng, p.lat, p.lng) * 10) / 10,
        observations,
        is_blank: observations === 0,
        label: '',
        resolution,
        scan_radius_km: radiusKm,
        sample_species: [] as SpeciesSample[],
      };
    })
  );
}

function generateGrid(centerLat: number, centerLng: number): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const half = Math.floor(GRID_SIZE / 2);
  for (let row = -half; row <= half; row++) {
    for (let col = -half; col <= half; col++) {
      const dLatKm = row * GRID_SPACING_KM;
      const dLngKm = col * GRID_SPACING_KM;
      const dLat = dLatKm * KM_TO_DEG_LAT;
      const dLng = dLat / Math.cos(centerLat * Math.PI / 180) * (dLngKm / (dLatKm || 1));
      // Use proper offset for non-zero
      if (row === 0 && col === 0) {
        points.push({ lat: centerLat, lng: centerLng });
      } else {
        const bearing = Math.atan2(dLngKm, dLatKm);
        const dist = Math.sqrt(dLatKm ** 2 + dLngKm ** 2);
        points.push(offsetCoord(centerLat, centerLng, bearing, dist));
      }
    }
  }
  return points;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();
    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: 'latitude et longitude requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ PHASE 1 — MAILLAGE (grille 5×5, rayon 0.3km) ═══
    const gridPoints = generateGrid(latitude, longitude);
    const results: ZoneResult[] = await scanPoints(gridPoints, latitude, longitude, MAILLAGE_RADIUS_KM, 'maillage');
    let totalPhases = 1;

    // ═══ PHASE 2 — ZOOM (8 weakest → 4 sub-points, rayon 0.1km) ═══
    const blankAfterPhase1 = results.filter(z => z.is_blank).length;
    if (blankAfterPhase1 === 0) {
      const weakest = [...results]
        .sort((a, b) => a.observations - b.observations)
        .slice(0, ZOOM_WEAK_COUNT);

      const zoomPoints: { lat: number; lng: number }[] = [];
      for (const zone of weakest) {
        for (const dir of DIRECTIONS_4) {
          zoomPoints.push(offsetCoord(zone.lat, zone.lng, dir, ZOOM_OFFSET_KM));
        }
      }

      totalPhases = 2;
      const zoomResults = await scanPoints(zoomPoints, latitude, longitude, ZOOM_RADIUS_KM, 'zoom');
      results.push(...zoomResults);

      // ═══ PHASE 3 — NANO (6 weakest zoom → 4 nano-points, rayon 0.05km) ═══
      const blankAfterPhase2 = results.filter(z => z.is_blank).length;
      if (blankAfterPhase2 === 0) {
        const weakestZoom = [...zoomResults]
          .sort((a, b) => a.observations - b.observations)
          .slice(0, NANO_WEAK_COUNT);

        const nanoPoints: { lat: number; lng: number }[] = [];
        for (const zone of weakestZoom) {
          for (const dir of DIRECTIONS_4) {
            nanoPoints.push(offsetCoord(zone.lat, zone.lng, dir, NANO_OFFSET_KM));
          }
        }

        totalPhases = 3;
        const nanoResults = await scanPoints(nanoPoints, latitude, longitude, NANO_RADIUS_KM, 'nano');
        results.push(...nanoResults);
      }
    }

    // Sort by distance
    results.sort((a, b) => a.distance_km - b.distance_km);

    // ═══ ENRICHMENT: geocode ALL zones (batched); species sample for blanks + 5 weakest ═══
    async function batchGeocode(zones: ZoneResult[], batchSize = 8) {
      for (let i = 0; i < zones.length; i += batchSize) {
        const batch = zones.slice(i, i + batchSize);
        await Promise.all(batch.map(async (z) => { z.label = await reverseGeocode(z.lat, z.lng); }));
        if (i + batchSize < zones.length) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    const blanks = results.filter(z => z.is_blank);
    const weakestNonBlank = results
      .filter(z => z.observations > 0)
      .sort((a, b) => a.observations - b.observations)
      .slice(0, 5);

    await Promise.all([
      batchGeocode(results),
      ...blanks.map(async (z) => { z.sample_species = await getGbifSample(z.lat, z.lng, z.scan_radius_km, 5); }),
      ...weakestNonBlank.map(async (z) => { z.sample_species = await getGbifSample(z.lat, z.lng, z.scan_radius_km, 5); }),
    ]);

    const response = {
      center: { lat: latitude, lng: longitude },
      zones: results,
      blank_count: results.filter(z => z.is_blank).length,
      total_scanned: results.length,
      phases_completed: totalPhases,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
