import { haversineM } from '@/utils/geoDistance';

/** Anneau GeoJSON [lng, lat][] → surface en m² (projection équirectangulaire locale). */
export const ringAreaM2 = (ring: Array<[number, number]>): number => {
  if (!ring || ring.length < 3) return 0;
  const lat0 = (ring.reduce((s, c) => s + c[1], 0) / ring.length) * (Math.PI / 180);
  const mPerDegLat = 111132.92 - 559.82 * Math.cos(2 * lat0) + 1.175 * Math.cos(4 * lat0);
  const mPerDegLng = 111412.84 * Math.cos(lat0) - 93.5 * Math.cos(3 * lat0);
  let acc = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    acc += x1 * mPerDegLng * (y2 * mPerDegLat) - x2 * mPerDegLng * (y1 * mPerDegLat);
  }
  return Math.abs(acc / 2);
};

/** Longueur d'une polyligne [lng, lat][] en mètres. */
export const lineLengthM = (coords: Array<[number, number]>): number => {
  if (!coords || coords.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < coords.length; i++) {
    d += haversineM(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  return d;
};

/** Surface d'une géométrie GeoJSON Polygon. */
export const geometryAreaM2 = (geom: any): number => {
  if (geom?.type !== 'Polygon') return 0;
  return ringAreaM2((geom.coordinates?.[0] ?? []) as Array<[number, number]>);
};

export const geometryLengthM = (geom: any): number => {
  if (geom?.type === 'LineString') return lineLengthM(geom.coordinates ?? []);
  if (geom?.type === 'Polygon') {
    const ring = (geom.coordinates?.[0] ?? []) as Array<[number, number]>;
    return lineLengthM([...ring, ring[0]].filter(Boolean));
  }
  return 0;
};

/** Centroïde approximatif [lat, lng] de n'importe quelle géométrie supportée. */
export const geometryCenter = (geom: any): [number, number] | null => {
  if (!geom) return null;
  if (geom.type === 'Point') {
    const c = geom.coordinates;
    return c ? [c[1], c[0]] : null;
  }
  const coords: Array<[number, number]> =
    geom.type === 'Polygon' ? geom.coordinates?.[0] ?? [] : geom.coordinates ?? [];
  if (!coords.length) return null;
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  return [lat, lng];
};

export const fmtArea = (m2: number): string =>
  m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} ha` : `${Math.round(m2).toLocaleString('fr-FR')} m²`;

export const fmtLength = (m: number): string =>
  m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} ml`;

export const fmtEuro = (v: number): string =>
  `${Math.round(v).toLocaleString('fr-FR')} €`;

/** Mesure d'un objet selon l'unité de son outil. */
export const measureFor = (unit: 'm2' | 'ml' | 'u', geom: any): number => {
  if (unit === 'm2') return geometryAreaM2(geom);
  if (unit === 'ml') return geometryLengthM(geom);
  return 1;
};

export const fmtMeasure = (unit: 'm2' | 'ml' | 'u', value: number): string =>
  unit === 'm2' ? fmtArea(value) : unit === 'ml' ? fmtLength(value) : `${value} u`;

/* ── Cotation « mètre du jardinier » ──────────────────────────────────────── */

export interface DimSegment {
  /** Index du segment dans l'anneau ouvert. */
  index: number;
  /** Longueur en mètres. */
  lengthM: number;
  /** Milieu [lat, lng] du segment. */
  mid: [number, number];
  /** Cap du segment en degrés (0 = est), pour l'orientation de l'étiquette. */
  angleDeg: number;
}

/** Format court : cm sous 1 m, m au-delà, km au-delà de 1000 m. */
export const fmtShort = (m: number): string => {
  if (!isFinite(m)) return '—';
  if (m < 1) return `${Math.round(m * 100)} cm`;
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(m < 10 ? 2 : 1).replace('.', ',')} m`;
};

/** Cotes de chaque côté d'un tracé [lng, lat][]. `closed` ferme l'anneau. */
export const segmentDims = (coords: Array<[number, number]>, closed: boolean): DimSegment[] => {
  if (!coords || coords.length < 2) return [];
  const pts = coords.slice();
  const first = pts[0];
  const last = pts[pts.length - 1];
  const alreadyClosed = first[0] === last[0] && first[1] === last[1];
  if (closed && !alreadyClosed) pts.push(first);
  const out: DimSegment[] = [];
  for (let i = 1; i < pts.length; i++) {
    const [lng1, lat1] = pts[i - 1];
    const [lng2, lat2] = pts[i];
    if (lng1 === lng2 && lat1 === lat2) continue;
    const lengthM = haversineM(lat1, lng1, lat2, lng2);
    const kx = Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180)) || 1;
    // Angle écran : y descend vers le sud → on inverse la latitude.
    let angleDeg = (Math.atan2(-(lat2 - lat1), (lng2 - lng1) * kx) * 180) / Math.PI;
    if (angleDeg > 90) angleDeg -= 180;
    if (angleDeg < -90) angleDeg += 180;
    out.push({
      index: i - 1,
      lengthM,
      mid: [(lat1 + lat2) / 2, (lng1 + lng2) / 2],
      angleDeg,
    });
  }
  return out;
};

export interface BBoxDims {
  widthM: number;
  depthM: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Encombrement (largeur E-O × profondeur N-S) en mètres. */
export const bboxDims = (coords: Array<[number, number]>): BBoxDims | null => {
  if (!coords?.length) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const midLat = (minLat + maxLat) / 2;
  return {
    widthM: haversineM(midLat, minLng, midLat, maxLng),
    depthM: haversineM(minLat, minLng, maxLat, minLng),
    minLat, maxLat, minLng, maxLng,
  };
};

export interface ObjetDimensions {
  segments: DimSegment[];
  bbox: BBoxDims | null;
  perimeterM: number;
  areaM2: number;
  vertices: number;
}

/** Cotation complète des sommets en cours d'édition. */
export const computeDimensions = (
  coords: Array<[number, number]>,
  kind: 'Point' | 'LineString' | 'Polygon' | null,
): ObjetDimensions => {
  const closed = kind === 'Polygon';
  const segments = kind && kind !== 'Point' ? segmentDims(coords, closed) : [];
  const uniq = coords.length > 1
    && coords[0][0] === coords[coords.length - 1][0]
    && coords[0][1] === coords[coords.length - 1][1]
    ? coords.length - 1
    : coords.length;
  return {
    segments,
    bbox: bboxDims(coords),
    perimeterM: segments.reduce((s, seg) => s + seg.lengthM, 0),
    areaM2: closed ? ringAreaM2(coords) : 0,
    vertices: uniq,
  };
};
