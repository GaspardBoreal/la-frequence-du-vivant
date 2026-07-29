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
