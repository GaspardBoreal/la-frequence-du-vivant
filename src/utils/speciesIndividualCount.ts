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

  const withGps = list.filter(
    (a) =>
      typeof a.latitude === 'number' &&
      typeof a.longitude === 'number' &&
      Number.isFinite(a.latitude) &&
      Number.isFinite(a.longitude),
  );
  const noGps = list.length - withGps.length;

  // Sort by lat for greedy clustering
  const sorted = [...withGps].sort((a, b) => (a.latitude! - b.latitude!));
  const clusters: IndividualCountResult['clusters'] = [];

  for (const obs of sorted) {
    let merged = false;
    for (const c of clusters) {
      if (!c.centroid) continue;
      const d = haversine(c.centroid.lat, c.centroid.lng, obs.latitude!, obs.longitude!);
      if (d < radius) {
        c.attributions.push(obs);
        c.count += 1;
        // Update centroid (running mean)
        c.centroid.lat = (c.centroid.lat * (c.count - 1) + obs.latitude!) / c.count;
        c.centroid.lng = (c.centroid.lng * (c.count - 1) + obs.longitude!) / c.count;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({
        centroid: { lat: obs.latitude!, lng: obs.longitude! },
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
