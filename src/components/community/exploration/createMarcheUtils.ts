import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';

export interface MarcheLite {
  id: string;
  nom_marche: string | null;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  date?: string | null;
}

const ROLES_AUTHORIZED: CommunityRoleKey[] = ['ambassadeur', 'sentinelle'];

export function canCreateMarche(
  role: string | null | undefined,
  isAdmin?: boolean,
): boolean {
  if (isAdmin) return true;
  if (!role) return false;
  return ROLES_AUTHORIZED.includes(role as CommunityRoleKey);
}

/**
 * Picks the most frequent value in an array. Returns the first one in case of tie.
 */
function mostFrequent<T>(values: (T | null | undefined)[]): T | null {
  const counts = new Map<T, number>();
  values.forEach((v) => {
    if (v == null || v === '') return;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  if (counts.size === 0) return null;
  let best: T | null = null;
  let bestCount = -1;
  counts.forEach((c, v) => {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  });
  return best;
}

export interface MarcheDefaults {
  centerLat: number | null;
  centerLng: number | null;
  defaultVille: string;
  defaultDate: string; // YYYY-MM-DD
}

export function computeMarcheDefaults(
  marches: MarcheLite[],
  fallbackDateIso?: string | null,
  fallbackVille?: string | null,
): MarcheDefaults {
  const geo = marches.filter((m) => m.latitude != null && m.longitude != null);
  const centerLat = geo.length > 0
    ? geo.reduce((s, m) => s + (m.latitude as number), 0) / geo.length
    : null;
  const centerLng = geo.length > 0
    ? geo.reduce((s, m) => s + (m.longitude as number), 0) / geo.length
    : null;

  const ville = mostFrequent(marches.map((m) => m.ville)) || fallbackVille || '';

  // Normalize dates to YYYY-MM-DD before computing the mode
  const normalizedDates = marches
    .map((m) => (m.date ? String(m.date).slice(0, 10) : null))
    .filter((d): d is string => !!d);
  const dateMode = mostFrequent(normalizedDates);
  const defaultDate = dateMode
    || (fallbackDateIso ? String(fallbackDateIso).slice(0, 10) : new Date().toISOString().slice(0, 10));

  return {
    centerLat,
    centerLng,
    defaultVille: ville,
    defaultDate,
  };
}
