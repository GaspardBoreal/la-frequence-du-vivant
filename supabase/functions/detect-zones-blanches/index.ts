import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 8 cardinal directions in radians
const DIRECTIONS = [
  0,              // N
  Math.PI / 4,    // NE
  Math.PI / 2,    // E
  3 * Math.PI / 4,// SE
  Math.PI,        // S
  5 * Math.PI / 4,// SW
  3 * Math.PI / 2,// W
  7 * Math.PI / 4,// NW
];

const DISTANCES_KM = [5, 10, 20];
const SCAN_RADIUS_KM = 2;
// ~0.018° per km of latitude
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

  return {
    lat: newLat * 180 / Math.PI,
    lng: newLng * 180 / Math.PI,
  };
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

// Phase 1: count only (limit=0)
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

// Phase 2: sample top species (limit=5, unique species names)
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
      samples.push({
        scientificName: name,
        commonName: r.vernacularName || undefined,
        date: r.eventDate || undefined,
      });
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
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
      { headers: { 'User-Agent': 'LaFrequenceDuVivant/1.0' } }
    );
    if (!resp.ok) return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    const data = await resp.json();
    const addr = data.address;
    return addr?.village || addr?.town || addr?.city || addr?.municipality || data.display_name?.split(',')[0] || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  } catch {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: 'latitude et longitude requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate 16 scan points
    const points: { lat: number; lng: number; distanceKm: number }[] = [];
    for (const dist of DISTANCES_KM) {
      for (const dir of DIRECTIONS) {
        const p = offsetCoord(latitude, longitude, dir, dist);
        points.push({ ...p, distanceKm: haversineKm(latitude, longitude, p.lat, p.lng) });
      }
    }

    // ═══ PHASE 1: Count observations for all 16 points (limit=0, ultra-frugal) ═══
    const results = await Promise.all(
      points.map(async (p) => {
        const observations = await getGbifCount(p.lat, p.lng, SCAN_RADIUS_KM);
        return {
          lat: Math.round(p.lat * 10000) / 10000,
          lng: Math.round(p.lng * 10000) / 10000,
          distance_km: Math.round(p.distanceKm * 10) / 10,
          observations,
          is_blank: observations === 0,
          label: '',
          sample_species: [] as SpeciesSample[],
        };
      })
    );

    // Sort by distance ascending
    results.sort((a, b) => a.distance_km - b.distance_km);

    // ═══ PHASE 2: Sample species for the 4 most interesting non-blank zones ═══
    // Priority: zones with fewest observations first (frontier zones near silence)
    const nonBlankZones = results
      .filter(z => z.observations > 0)
      .sort((a, b) => a.observations - b.observations)
      .slice(0, 8);

    // Reverse geocode ALL + sample species in parallel
    await Promise.all([
      // Geocode all 16 points
      ...results.map(async (z) => {
        z.label = await reverseGeocode(z.lat, z.lng);
      }),
      // Sample species for 4 frontier zones
      ...nonBlankZones.map(async (z) => {
        z.sample_species = await getGbifSample(z.lat, z.lng, SCAN_RADIUS_KM, 5);
      }),
    ]);

    const response = {
      center: { lat: latitude, lng: longitude },
      zones: results,
      blank_count: results.filter(z => z.is_blank).length,
      total_scanned: results.length,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
