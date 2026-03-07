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

const DISTANCES_KM = [5, 10];
const SCAN_RADIUS_KM = 2;

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

async function getGbifCount(lat: number, lng: number, radiusKm: number): Promise<number> {
  const url = `https://api.gbif.org/v1/occurrence/search?limit=0&decimalLatitude=${lat.toFixed(4)}&decimalLongitude=${lng.toFixed(4)}&geoDistance=${lat.toFixed(4)},${lng.toFixed(4)},${radiusKm}km`;
  try {
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return -1;
    const data = await resp.json();
    return data.count ?? -1;
  } catch {
    return -1;
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

    // Query GBIF for all points in parallel
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
        };
      })
    );

    // Sort by distance ascending
    results.sort((a, b) => a.distance_km - b.distance_km);

    // Reverse geocode ALL 16 points in parallel
    await Promise.all(
      results.map(async (z) => {
        z.label = await reverseGeocode(z.lat, z.lng);
      })
    );

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
