import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 8 cardinal directions in radians
const DIRECTIONS_8 = [
  0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4,
  Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4,
];

// 4 cardinal directions for sub-scans
const DIRECTIONS_4 = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];

const RADAR_DISTANCES_KM = [5, 10, 20];
const RADAR_RADIUS_KM = 2;
const LOUPE_OFFSET_KM = 1.5;
const LOUPE_RADIUS_KM = 0.5;
const MICRO_OFFSET_KM = 0.5;
const MICRO_RADIUS_KM = 0.2;

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

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'User-Agent': 'LaFrequenceDuVivant/1.0' } }
    );
    if (!resp.ok) return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    const data = await resp.json();
    const addr = data.address;
    return addr?.hamlet || addr?.village || addr?.town || addr?.city || addr?.municipality || data.display_name?.split(',')[0] || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  } catch {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

type Resolution = 'radar' | 'loupe' | 'microscope';

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

    // ═══ PHASE 1 — RADAR (25 points: center + 24 around) ═══
    const radarPoints: { lat: number; lng: number }[] = [{ lat: latitude, lng: longitude }];
    for (const dist of RADAR_DISTANCES_KM) {
      for (const dir of DIRECTIONS_8) {
        radarPoints.push(offsetCoord(latitude, longitude, dir, dist));
      }
    }

    const results: ZoneResult[] = await scanPoints(radarPoints, latitude, longitude, RADAR_RADIUS_KM, 'radar');
    let currentPhase = 1;
    let totalPhases = 1;

    // ═══ PHASE 2 — LOUPE (zoom into 6 weakest radar zones) ═══
    const radarBlankCount = results.filter(z => z.is_blank).length;
    // Always run loupe to find finer detail
    const weakestRadar = [...results]
      .sort((a, b) => a.observations - b.observations)
      .slice(0, 6);

    const loupePoints: { lat: number; lng: number }[] = [];
    for (const zone of weakestRadar) {
      for (const dir of DIRECTIONS_4) {
        loupePoints.push(offsetCoord(zone.lat, zone.lng, dir, LOUPE_OFFSET_KM));
      }
    }

    totalPhases = 2;
    currentPhase = 2;
    const loupeResults = await scanPoints(loupePoints, latitude, longitude, LOUPE_RADIUS_KM, 'loupe');
    results.push(...loupeResults);

    // ═══ PHASE 3 — MICROSCOPE (if still no silence, zoom into 4 weakest loupe zones) ═══
    const totalBlankAfterLoupe = results.filter(z => z.is_blank).length;
    if (totalBlankAfterLoupe === 0) {
      const weakestLoupe = [...loupeResults]
        .sort((a, b) => a.observations - b.observations)
        .slice(0, 4);

      const microPoints: { lat: number; lng: number }[] = [];
      for (const zone of weakestLoupe) {
        for (const dir of DIRECTIONS_4) {
          microPoints.push(offsetCoord(zone.lat, zone.lng, dir, MICRO_OFFSET_KM));
        }
      }

      totalPhases = 3;
      currentPhase = 3;
      const microResults = await scanPoints(microPoints, latitude, longitude, MICRO_RADIUS_KM, 'microscope');
      results.push(...microResults);
    }

    // Sort by distance
    results.sort((a, b) => a.distance_km - b.distance_km);

    // ═══ ENRICHMENT: geocode + species sample for interesting zones ═══
    const nonBlankZones = results
      .filter(z => z.observations > 0)
      .sort((a, b) => a.observations - b.observations)
      .slice(0, 8);

    await Promise.all([
      ...results.map(async (z) => { z.label = await reverseGeocode(z.lat, z.lng); }),
      ...nonBlankZones.map(async (z) => { z.sample_species = await getGbifSample(z.lat, z.lng, z.scan_radius_km, 5); }),
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
