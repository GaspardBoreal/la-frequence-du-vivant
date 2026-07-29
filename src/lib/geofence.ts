/**
 * Géofence propriété — appartenance d'un point aux parcelles cadastrales.
 *
 * Les géométries cadastrales sont des GeoJSON `Polygon` / `MultiPolygon`
 * (coordonnées [lng, lat]). On calcule :
 *   - l'appartenance stricte (ray casting)
 *   - la distance en mètres au bord le plus proche (pour le tampon « en limite »)
 */

export type GeofenceStatus = 'inside' | 'edge' | 'outside' | 'unknown';

type Ring = Array<[number, number]>; // [lng, lat]

const ringsOf = (geometry: any): Ring[] => {
  if (!geometry) return [];
  const t = geometry.type;
  if (t === 'Polygon') return (geometry.coordinates || []) as Ring[];
  if (t === 'MultiPolygon') {
    const out: Ring[] = [];
    for (const poly of geometry.coordinates || []) for (const r of poly || []) out.push(r as Ring);
    return out;
  }
  if (t === 'Feature') return ringsOf(geometry.geometry);
  if (t === 'FeatureCollection') {
    const out: Ring[] = [];
    for (const f of geometry.features || []) out.push(...ringsOf(f));
    return out;
  }
  return [];
};

const pointInRing = (lat: number, lng: number, ring: Ring): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/** Distance point→segment, en mètres (projection locale équirectangulaire). */
const segDistanceM = (
  lat: number,
  lng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number => {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const px = (lng - aLng) * mPerDegLng;
  const py = (lat - aLat) * mPerDegLat;
  const vx = (bLng - aLng) * mPerDegLng;
  const vy = (bLat - aLat) * mPerDegLat;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
  const dx = px - t * vx;
  const dy = py - t * vy;
  return Math.sqrt(dx * dx + dy * dy);
};

export interface Geofence {
  rings: Ring[];
  /** true quand aucune parcelle n'est renseignée : tout est « unknown » */
  empty: boolean;
}

export const buildGeofence = (parcelles: Array<{ geometry: any | null }>): Geofence => {
  const rings: Ring[] = [];
  for (const p of parcelles) rings.push(...ringsOf(p.geometry));
  return { rings, empty: rings.length === 0 };
};

/** Distance (m) au bord le plus proche des parcelles. `Infinity` si aucune. */
export const distanceToGeofenceM = (fence: Geofence, lat: number, lng: number): number => {
  let best = Infinity;
  for (const ring of fence.rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const d = segDistanceM(lat, lng, ring[i][1], ring[i][0], ring[j][1], ring[j][0]);
      if (d < best) best = d;
    }
  }
  return best;
};

export const isInsideGeofence = (fence: Geofence, lat: number, lng: number): boolean =>
  fence.rings.some((ring) => pointInRing(lat, lng, ring));

/**
 * Point le plus proche sur le bord des parcelles, très légèrement rentré vers
 * l'intérieur (aimantation de curation). `null` si aucune parcelle.
 */
export const nearestPointOnGeofence = (
  fence: Geofence,
  lat: number,
  lng: number,
): { lat: number; lng: number; distanceM: number } | null => {
  let best: { lat: number; lng: number; distanceM: number } | null = null;
  for (const ring of fence.rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const aLng = ring[i][0];
      const aLat = ring[i][1];
      const bLng = ring[j][0];
      const bLat = ring[j][1];
      const mPerDegLat = 111320;
      const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
      const px = (lng - aLng) * mPerDegLng;
      const py = (lat - aLat) * mPerDegLat;
      const vx = (bLng - aLng) * mPerDegLng;
      const vy = (bLat - aLat) * mPerDegLat;
      const len2 = vx * vx + vy * vy;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
      const projLng = aLng + ((bLng - aLng) * t);
      const projLat = aLat + ((bLat - aLat) * t);
      const d = segDistanceM(lat, lng, aLat, aLng, bLat, bLng);
      if (!best || d < best.distanceM) best = { lat: projLat, lng: projLng, distanceM: d };
    }
  }
  return best;
};


export interface GeofenceEvaluation {
  status: GeofenceStatus;
  /** Distance signée au périmètre : 0 si à l'intérieur, sinon mètres à l'extérieur. */
  distanceM: number | null;
}

/**
 * Classe un point : dans le périmètre, en limite (dans le tampon), ou dehors.
 * Sans parcelle renseignée, on ne juge pas (`unknown`) pour ne rien écarter.
 */
export const evaluateGeofence = (
  fence: Geofence,
  lat: number,
  lng: number,
  bufferM = 25,
): GeofenceEvaluation => {
  if (fence.empty) return { status: 'unknown', distanceM: null };
  if (isInsideGeofence(fence, lat, lng)) return { status: 'inside', distanceM: 0 };
  const d = distanceToGeofenceM(fence, lat, lng);
  return { status: d <= bufferM ? 'edge' : 'outside', distanceM: Math.round(d) };
};

export const GEOFENCE_LABELS: Record<GeofenceStatus, string> = {
  inside: 'Dans le périmètre',
  edge: 'En limite',
  outside: 'Hors périmètre',
  unknown: 'Périmètre non défini',
};
