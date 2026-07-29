import { useMemo } from 'react';
import { useFrenchSpeciesNamesAuto } from '@/hooks/useFrenchSpeciesNamesAuto';

export interface NameableWaypoint {
  scientificName?: string | null;
  commonName?: string | null;
}

/**
 * Résolveur FR mutualisé pour toutes les cartes d'observations d'une propriété
 * (Carte des révélations, Atelier du jardin nourricier, espèces écartées).
 * Source unique → même nom affiché partout, même cache react-query.
 */
export function useWaypointFrenchNames(waypoints: NameableWaypoint[]) {
  const input = useMemo(() => {
    const seen = new Map<string, { scientificName: string; commonName: string | null }>();
    for (const w of waypoints) {
      const sci = (w.scientificName || '').trim();
      if (!sci || seen.has(sci)) continue;
      seen.set(sci, { scientificName: sci, commonName: w.commonName || null });
    }
    return Array.from(seen.values());
  }, [waypoints]);

  const { data: frNames } = useFrenchSpeciesNamesAuto(input);

  const displayNameFor = useMemo(
    () => (w: NameableWaypoint) => {
      const sci = (w.scientificName || '').trim();
      return frNames?.get(sci)?.displayName || w.commonName || sci || '—';
    },
    [frNames],
  );

  return { frNames, displayNameFor };
}

export default useWaypointFrenchNames;
