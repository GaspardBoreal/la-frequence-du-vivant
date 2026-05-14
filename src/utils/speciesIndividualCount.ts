/**
 * GPS-based individual counting for biodiversity observations.
 *
 * Two photos of the same plant taken from a few meters apart are still the
 * same individual. We cluster attributions by haversine distance and count
 * each cluster as one individual.
 *
 * Fallback: attributions without GPS coordinates each count as 1 individual.
 */

export interface AttributionLike {
  date?: string | null;
  observerName?: string | null;
  source?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  exactLatitude?: number | null;
  exactLongitude?: number | null;
  [key: string]: any;
}

export interface IndividualCountResult {
  totalObservations: number;
  individuals: number;
  clusters: Array<{
    centroid: { lat: number; lng: number } | null;
    count: number;
    attributions: AttributionLike[];
  }>;
}

const EARTH_R = 6371000; // meters

/**
 * Returns normalized GPS coords from an attribution.
 * iNaturalist snapshots use `exactLatitude`/`exactLongitude`, some other
 * sources use `latitude`/`longitude`. Accept both.
 */
export function getLatLng(a: AttributionLike | null | undefined): { lat: number; lng: number } | null {
  if (!a) return null;
  const lat = typeof a.latitude === 'number' ? a.latitude : a.exactLatitude;
  const lng = typeof a.longitude === 'number' ? a.longitude : a.exactLongitude;
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

export function countIndividuals(
  attributions: AttributionLike[] | null | undefined,
  options: { clusterRadiusMeters?: number } = {},
): IndividualCountResult {
  const radius = options.clusterRadiusMeters ?? 8;
  const list = Array.isArray(attributions) ? attributions : [];
  const total = list.length;

  if (!list.length) {
    return { totalObservations: 0, individuals: 0, clusters: [] };
  }

  const withGps = list
    .map((a) => ({ a, ll: getLatLng(a) }))
    .filter((x) => x.ll !== null) as Array<{ a: AttributionLike; ll: { lat: number; lng: number } }>;
  const noGps = list.length - withGps.length;

  // Sort by lat for greedy clustering
  const sorted = [...withGps].sort((a, b) => a.ll.lat - b.ll.lat);
  const clusters: IndividualCountResult['clusters'] = [];

  for (const { a: obs, ll } of sorted) {
    let merged = false;
    for (const c of clusters) {
      if (!c.centroid) continue;
      const d = haversine(c.centroid.lat, c.centroid.lng, ll.lat, ll.lng);
      if (d < radius) {
        c.attributions.push(obs);
        c.count += 1;
        c.centroid.lat = (c.centroid.lat * (c.count - 1) + ll.lat) / c.count;
        c.centroid.lng = (c.centroid.lng * (c.count - 1) + ll.lng) / c.count;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({
        centroid: { lat: ll.lat, lng: ll.lng },
        count: 1,
        attributions: [obs],
      });
    }
  }

  return {
    totalObservations: total,
    individuals: clusters.length + noGps,
    clusters,
  };
}
