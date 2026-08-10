import { haversineM } from '@/utils/geoDistance';
import type { Consultation } from '@/hooks/propriete/useGardenClinique';

/**
 * Lecture spatiale de la Clinique du jardin.
 *
 * Un foyer n'est pas un point : c'est une menace qui rayonne. On estime ici
 * une distance de propagation plausible selon la nature du pathogène retenu
 * (spores, éclaboussure, vol d'insecte) et l'étendue observée, pour révéler
 * les chaînes de contagion et les voisins exposés.
 *
 * Ces rayons sont des ordres de grandeur de terrain, jamais une prédiction :
 * ils servent à décider où marcher en premier.
 */

export type PathogenKind = 'champignon' | 'bacterie' | 'insecte' | 'inconnu';

/** Rayon de base (m) par mode de dissémination dominant. */
const BASE_RADIUS_M: Record<PathogenKind, number> = {
  champignon: 12,
  bacterie: 6,
  insecte: 25,
  inconnu: 10,
};

export const KIND_LABEL: Record<PathogenKind, string> = {
  champignon: 'spores portées par la pluie et le vent',
  bacterie: 'contact, outils et blessures',
  insecte: 'déplacement actif du ravageur',
  inconnu: 'mode de propagation à préciser',
};

export const STATUS_COLOR: Record<Consultation['status'], string> = {
  observation: 'hsl(var(--ds-gold))',
  traitement: 'hsl(28 78% 48%)',
  gueri: 'hsl(var(--ds-forest))',
  perdu: 'hsl(0 0% 45%)',
};

export const STATUS_LABEL: Record<Consultation['status'], string> = {
  observation: 'Sous surveillance',
  traitement: 'En traitement',
  gueri: 'Rétabli',
  perdu: 'Perdu',
};

export const isActive = (c: Consultation) =>
  c.status === 'observation' || c.status === 'traitement';

export interface FocusPoint {
  consultation: Consultation;
  lat: number;
  lng: number;
  /** Nom courant de l'hypothèse retenue (ou première hypothèse). */
  pathogen: string | null;
  kind: PathogenKind;
  /** Rayon de vigilance, en mètres. */
  radiusM: number;
  actionsTotal: number;
  actionsDone: number;
}

export const spreadRadiusM = (kind: PathogenKind, severity: number): number => {
  const base = BASE_RADIUS_M[kind] ?? BASE_RADIUS_M.inconnu;
  const s = Math.min(5, Math.max(0, severity || 0));
  return Math.round(base * (0.6 + (s / 5) * 0.8));
};

export const normalizeKind = (k?: string | null): PathogenKind => {
  const v = (k || '').toLowerCase();
  if (v.startsWith('champ')) return 'champignon';
  if (v.startsWith('bact')) return 'bacterie';
  if (v.startsWith('insec') || v.startsWith('ravag')) return 'insecte';
  return 'inconnu';
};

/** Regroupe les foyers actifs qui se touchent et partagent le même pathogène. */
export interface ContagionChain {
  id: string;
  pathogen: string;
  members: FocusPoint[];
  links: Array<[FocusPoint, FocusPoint]>;
}

const sameName = (a: string | null, b: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export function buildContagionChains(points: FocusPoint[]): ContagionChain[] {
  const actives = points.filter((p) => isActive(p.consultation) && p.pathogen);
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x);
    if (!p || p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  actives.forEach((p) => parent.set(p.consultation.id, p.consultation.id));

  const links: Array<[FocusPoint, FocusPoint]> = [];
  for (let i = 0; i < actives.length; i++) {
    for (let j = i + 1; j < actives.length; j++) {
      const a = actives[i];
      const b = actives[j];
      if (!sameName(a.pathogen, b.pathogen)) continue;
      const d = haversineM(a.lat, a.lng, b.lat, b.lng);
      if (d <= a.radiusM + b.radiusM) {
        union(a.consultation.id, b.consultation.id);
        links.push([a, b]);
      }
    }
  }

  const groups = new Map<string, FocusPoint[]>();
  actives.forEach((p) => {
    const root = find(p.consultation.id);
    (groups.get(root) ?? groups.set(root, []).get(root)!).push(p);
  });

  return Array.from(groups.entries())
    .filter(([, members]) => members.length > 1)
    .map(([id, members]) => ({
      id,
      pathogen: members[0].pathogen || '—',
      members,
      links: links.filter(
        ([a, b]) =>
          members.includes(a) && members.includes(b),
      ),
    }))
    .sort((a, b) => b.members.length - a.members.length);
}

export interface NeighborPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface ExposedNeighbor extends NeighborPoint {
  distanceM: number;
}

/** Voisins situés dans le halo d'un foyer, du plus proche au plus lointain. */
export function exposedNeighbors(
  focus: FocusPoint,
  neighbors: NeighborPoint[],
  limit = 4,
): ExposedNeighbor[] {
  return neighbors
    .map((n) => ({ ...n, distanceM: Math.round(haversineM(focus.lat, focus.lng, n.lat, n.lng)) }))
    .filter((n) => n.distanceM <= focus.radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

/**
 * Tournée de soin : on part du foyer le plus urgent, puis on avance de proche
 * en proche (plus proche voisin). Marcher moins, soigner mieux.
 */
export interface CareRound {
  stops: FocusPoint[];
  distanceM: number;
  pendingActions: number;
}

export function buildCareRound(points: FocusPoint[]): CareRound {
  const todo = points.filter(
    (p) => isActive(p.consultation) && p.actionsTotal > p.actionsDone,
  );
  if (!todo.length) return { stops: [], distanceM: 0, pendingActions: 0 };

  const remaining = todo.slice().sort((a, b) => {
    const sev = (b.consultation.severity ?? 0) - (a.consultation.severity ?? 0);
    if (sev !== 0) return sev;
    return (b.actionsTotal - b.actionsDone) - (a.actionsTotal - a.actionsDone);
  });

  const stops: FocusPoint[] = [remaining.shift()!];
  let distance = 0;
  while (remaining.length) {
    const last = stops[stops.length - 1];
    let bestIdx = 0;
    let bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineM(last.lat, last.lng, p.lat, p.lng);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    distance += bestD;
    stops.push(remaining.splice(bestIdx, 1)[0]);
  }

  return {
    stops,
    distanceM: Math.round(distance),
    pendingActions: todo.reduce((a, p) => a + (p.actionsTotal - p.actionsDone), 0),
  };
}

export const fmtDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
