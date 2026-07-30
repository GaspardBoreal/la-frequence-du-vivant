/**
 * Utilitaires purs de transformation d'anneaux GeoJSON ([lng, lat][]).
 * Aucune dépendance Leaflet : testables et réutilisables côté impression.
 */

export type Ring = Array<[number, number]>;

const eq = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];

/** Anneau sans le point de fermeture. */
export const openRing = (ring: Ring): Ring => {
  if (ring.length > 1 && eq(ring[0], ring[ring.length - 1])) return ring.slice(0, -1);
  return ring.slice();
};

/** Anneau refermé (dernier point = premier). */
export const closeRing = (ring: Ring): Ring => {
  if (!ring.length) return ring;
  if (eq(ring[0], ring[ring.length - 1])) return ring.slice();
  return [...ring, ring[0]];
};

export interface RingBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export const ringBounds = (ring: Ring): RingBounds | null => {
  if (!ring.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
};

/** Translation de tous les sommets. */
export const translateRing = (ring: Ring, dLng: number, dLat: number): Ring =>
  ring.map(([lng, lat]) => [lng + dLng, lat + dLat] as [number, number]);

/** Mise à l'échelle autour d'une ancre (homothétie si kx === ky). */
export const scaleRing = (
  ring: Ring,
  anchor: [number, number],
  kx: number,
  ky: number,
): Ring =>
  ring.map(([lng, lat]) => [
    anchor[0] + (lng - anchor[0]) * kx,
    anchor[1] + (lat - anchor[1]) * ky,
  ] as [number, number]);

/**
 * Lissage de Chaikin (corner cutting) sur un anneau fermé.
 * Chaque itération remplace un sommet par deux points à 1/4 et 3/4 de chaque arête.
 */
export const chaikinSmooth = (ring: Ring, iterations = 1): Ring => {
  let pts = openRing(ring);
  if (pts.length < 3) return ring.slice();
  for (let it = 0; it < iterations; it++) {
    const next: Ring = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      next.push([x1 + (x2 - x1) * 0.25, y1 + (y2 - y1) * 0.25]);
      next.push([x1 + (x2 - x1) * 0.75, y1 + (y2 - y1) * 0.75]);
    }
    pts = next;
  }
  return pts;
};

/* ── Douglas-Peucker (en degrés, avec correction de latitude) ─────────────── */

const perpDist = (
  p: [number, number],
  a: [number, number],
  b: [number, number],
  kx: number,
): number => {
  const ax = a[0] * kx;
  const bx = b[0] * kx;
  const px = p[0] * kx;
  const dx = bx - ax;
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, p[1] - a[1]);
  let t = ((px - ax) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), p[1] - (a[1] + t * dy));
};

const dp = (pts: Ring, tol: number, kx: number): Ring => {
  if (pts.length < 3) return pts;
  let maxD = -1;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1], kx);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= tol) return [pts[0], pts[pts.length - 1]];
  const left = dp(pts.slice(0, idx + 1), tol, kx);
  const right = dp(pts.slice(idx), tol, kx);
  return [...left.slice(0, -1), ...right];
};

/** Simplification légère d'un anneau, tolérance exprimée en mètres. */
export const simplifyRing = (ring: Ring, toleranceM = 0.6): Ring => {
  const pts = openRing(ring);
  if (pts.length < 8) return pts;
  const lat0 = (pts.reduce((s, c) => s + c[1], 0) / pts.length) * (Math.PI / 180);
  const kx = Math.cos(lat0) || 1;
  const tolDeg = toleranceM / 111320;
  const out = dp([...pts, pts[0]], tolDeg, kx);
  const open = openRing(out);
  return open.length >= 3 ? open : pts;
};

/**
 * Lissage « intelligent » d'un contour :
 * simplification préalable des tracés main levée très denses, puis Chaikin.
 */
export const smoothRing = (ring: Ring, iterations = 1): Ring => {
  const pts = openRing(ring);
  if (pts.length < 3) return pts;
  const base = pts.length > 60 ? simplifyRing(pts, 0.9) : pts;
  return chaikinSmooth(base, iterations);
};

/* ── Rotation (correction de latitude pour rester visuellement isotrope) ──── */

/**
 * Rotation des sommets autour d'une ancre [lng, lat].
 * L'axe des longitudes est corrigé par cos(lat) : un carré reste un carré.
 */
export const rotateRing = (ring: Ring, anchor: [number, number], angleRad: number): Ring => {
  const kx = Math.cos((anchor[1] * Math.PI) / 180) || 1;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return ring.map(([lng, lat]) => {
    const x = (lng - anchor[0]) * kx;
    const y = lat - anchor[1];
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return [anchor[0] + rx / kx, anchor[1] + ry] as [number, number];
  });
};

/* ── Ponts GeoJSON génériques (Point / LineString / Polygon) ──────────────── */

export type GeomKind = 'Point' | 'LineString' | 'Polygon';

/** Extrait la liste de sommets d'une géométrie supportée. */
export const geomCoords = (geom: any): Ring => {
  if (!geom) return [];
  if (geom.type === 'Point') return geom.coordinates ? [geom.coordinates as [number, number]] : [];
  if (geom.type === 'LineString') return (geom.coordinates ?? []) as Ring;
  if (geom.type === 'Polygon') return (geom.coordinates?.[0] ?? []) as Ring;
  return [];
};

/** Réinjecte une liste de sommets dans une géométrie du même type. */
export const withGeomCoords = (geom: any, coords: Ring): any => {
  if (!geom) return geom;
  if (geom.type === 'Point') return { ...geom, coordinates: coords[0] ?? geom.coordinates };
  if (geom.type === 'LineString') return { ...geom, coordinates: coords };
  if (geom.type === 'Polygon') return { ...geom, coordinates: [closeRing(coords)] };
  return geom;
};
