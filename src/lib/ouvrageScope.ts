/**
 * Périmètre d'écoute d'un ouvrage de l'Atelier.
 *
 * Le cadrage de l'IA ne doit JAMAIS se réduire à un disque autour du centroïde :
 * un massif allongé perd alors ses extrémités et ratisse largement hors du tracé.
 * On classe donc chaque observation par rapport à la géométrie réelle :
 *
 *   - `dedans`    → point à l'intérieur du polygone (ou sur le tracé d'une ligne/point)
 *   - `lisiere`   → hors tracé mais à ≤ EDGE_TOLERANCE_M du bord (imprécision GPS)
 *   - `voisinage` → hors tracé, dans le rayon d'écoute mesuré **depuis le bord**
 *
 * Réutilise les primitives éprouvées du geofence cadastral (ray casting +
 * distance point/segment en projection équirectangulaire locale).
 */
import { buildGeofence, isInsideGeofence, distanceToGeofenceM } from '@/lib/geofence';
import { haversineM } from '@/utils/geoDistance';

/** Tolérance d'imprécision GPS autour du bord d'un ouvrage. */
export const EDGE_TOLERANCE_M = 3;
/** Épaisseur considérée « sur le tracé » pour une ligne ou un point. */
export const LINE_TOLERANCE_M = 2;

export type ScopeZone = 'dedans' | 'lisiere' | 'voisinage';

export interface ScopedObservation<T> {
  item: T;
  zone: ScopeZone;
  /** Distance en mètres au bord de l'ouvrage (0 si dedans). */
  distanceM: number;
}

export interface ScopeResult<T> {
  dedans: ScopedObservation<T>[];
  lisiere: ScopedObservation<T>[];
  voisinage: ScopedObservation<T>[];
  /** Vrai quand l'ouvrage a une surface (polygone) : le « dedans » a un sens. */
  hasSurface: boolean;
}

type LatLng = { lat: number; lng: number };

const coordsOf = (geometry: any): Array<[number, number]> => {
  if (!geometry) return [];
  if (geometry.type === 'Point') return geometry.coordinates ? [geometry.coordinates] : [];
  if (geometry.type === 'LineString') return geometry.coordinates ?? [];
  if (geometry.type === 'Polygon') return geometry.coordinates?.[0] ?? [];
  return [];
};

/** Distance (m) au tracé d'une ligne / d'un point (pas de notion d'intérieur). */
const distanceToPathM = (geometry: any, lat: number, lng: number): number => {
  const cs = coordsOf(geometry);
  if (!cs.length) return Infinity;
  if (cs.length === 1) return haversineM(lat, lng, cs[0][1], cs[0][0]);
  let best = Infinity;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  for (let i = 1; i < cs.length; i++) {
    const [aLng, aLat] = cs[i - 1];
    const [bLng, bLat] = cs[i];
    const px = (lng - aLng) * mPerDegLng;
    const py = (lat - aLat) * mPerDegLat;
    const vx = (bLng - aLng) * mPerDegLng;
    const vy = (bLat - aLat) * mPerDegLat;
    const len2 = vx * vx + vy * vy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
    const dx = px - t * vx;
    const dy = py - t * vy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < best) best = d;
  }
  return best;
};

/**
 * Classe une liste d'observations géolocalisées par rapport à un ouvrage.
 * `radiusM` = rayon d'écoute mesuré **depuis le bord** de l'ouvrage.
 * `edgeToleranceM` = épaisseur du collier de lisière (imprécision GPS) ;
 * la passer à 0 rend le cadrage strictement géométrique.
 */
export function classifyObservations<T extends LatLng>(
  geometry: any,
  items: T[],
  radiusM: number,
  edgeToleranceM: number = EDGE_TOLERANCE_M,
): ScopeResult<T> {
  const hasSurface = geometry?.type === 'Polygon';
  const out: ScopeResult<T> = { dedans: [], lisiere: [], voisinage: [], hasSurface };
  if (!geometry) return out;


  const fence = hasSurface ? buildGeofence([{ geometry }]) : null;

  for (const it of items) {
    if (!Number.isFinite(it.lat) || !Number.isFinite(it.lng)) continue;

    if (fence && !fence.empty) {
      const inside = isInsideGeofence(fence, it.lat, it.lng);
      if (inside) {
        out.dedans.push({ item: it, zone: 'dedans', distanceM: 0 });
        continue;
      }
      const d = distanceToGeofenceM(fence, it.lat, it.lng);
      if (d <= EDGE_TOLERANCE_M) out.lisiere.push({ item: it, zone: 'lisiere', distanceM: d });
      else if (d <= radiusM) out.voisinage.push({ item: it, zone: 'voisinage', distanceM: d });
      continue;
    }

    // Point ou ligne : pas d'intérieur, on écoute autour du tracé.
    const d = distanceToPathM(geometry, it.lat, it.lng);
    if (d <= LINE_TOLERANCE_M) out.dedans.push({ item: it, zone: 'dedans', distanceM: d });
    else if (d <= radiusM) out.voisinage.push({ item: it, zone: 'voisinage', distanceM: d });
  }

  out.voisinage.sort((a, b) => a.distanceM - b.distanceM);
  return out;
}

export interface SpeciesRow {
  n: string;
  c: string | null;
  k: string | null;
  obs: number;
  vu: string | null;
}

/** Agrège des observations en lignes d'espèces (dédupliquées par nom scientifique). */
export function rollupSpecies<
  T extends { scientificName: string; commonName: string | null; kingdom: string | null; observationDate?: string | null },
>(items: T[]): SpeciesRow[] {
  const by = new Map<string, SpeciesRow>();
  for (const w of items) {
    if (!w.scientificName) continue;
    const prev = by.get(w.scientificName);
    if (prev) {
      prev.obs += 1;
      if (w.observationDate && (!prev.vu || w.observationDate > prev.vu)) prev.vu = w.observationDate;
    } else {
      by.set(w.scientificName, {
        n: w.scientificName,
        c: w.commonName ?? null,
        k: w.kingdom ?? null,
        obs: 1,
        vu: w.observationDate ?? null,
      });
    }
  }
  return [...by.values()].sort((a, b) => b.obs - a.obs || a.n.localeCompare(b.n));
}
