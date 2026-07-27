import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';

/**
 * Points géolocalisés d'une exploration (marches / événements), prêts pour la
 * console de contrôle GPS. Même source que la page Propriété :
 * `get_exploration_species_pool`, qui applique déjà les corrections éditoriales.
 */
const normName = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function useExplorationGpsCandidates(explorationId: string | undefined) {
  const query = useQuery({
    queryKey: ['exploration-species-pool-rpc', explorationId, 'v6-gps-overrides'],
    enabled: !!explorationId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_exploration_species_pool', {
        p_exploration_id: explorationId!,
      });
      if (error) throw error;
      return data as any;
    },
  });

  const waypoints = useMemo<PropertyWaypoint[]>(() => {
    const rows: any[] = query.data?.species || [];
    const out: PropertyWaypoint[] = [];
    const seen = new Set<string>();
    let n = 0;
    const dedupKey = (sci: string, lat: number, lng: number) =>
      `${normName(sci)}|${lat.toFixed(5)}|${lng.toFixed(5)}`;

    for (const sp of rows) {
      const sci = sp.scientific_name || sp.key || '';
      const attrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      for (const a of attrs) {
        const lat = Number(a?.latitude);
        const lng = Number(a?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const k = dedupKey(sci, lat, lng);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({
          id: `wp-${n++}`,
          lat,
          lng,
          scientificName: sci,
          commonName: sp.common_name ?? null,
          kingdom: sp.kingdom ?? null,
          photoUrl: a?.photo_url || null,
          observationDate: a?.observation_date || null,
          marcheurId: a?.marcheur_id || null,
          marcheId: a?.marche_id || null,
          source: 'marcheur',
          observerName: null,
          overrideKind: 'observation',
          overrideTargetKey: a?.obs_id || null,
          overrideStatus: a?.gps_override_status || null,
          overrideReason: a?.gps_override_reason || null,
          originalLat: a?.original_latitude ?? null,
          originalLng: a?.original_longitude ?? null,
          inatObservationId: a?.inaturalist_id ? String(a.inaturalist_id) : null,
          positionalAccuracy: a?.positional_accuracy != null ? Number(a.positional_accuracy) : null,
          obscured: a?.obscured ?? null,
          gpsSource: a?.gps_source || null,
        });
      }
    }

    for (const sp of rows) {
      const sci = sp.scientific_name || sp.key || '';
      const groups: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
      for (const g of groups) {
        const list: any[] = Array.isArray(g) ? g : [g];
        for (const a of list) {
          const lat = Number(a?.exactLatitude);
          const lng = Number(a?.exactLongitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          const k = dedupKey(sci, lat, lng);
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({
            id: `wp-${n++}`,
            lat,
            lng,
            scientificName: sci,
            commonName: sp.common_name ?? null,
            kingdom: sp.kingdom ?? null,
            photoUrl: a?.photoUrl || a?.photo_url || null,
            observationDate: a?.date || a?.observationDate || null,
            marcheurId: null,
            marcheId: null,
            source: 'inaturalist',
            observerName: a?.observerName || null,
            overrideKind: 'snapshot_attr',
            overrideTargetKey: a?.originalUrl || k,
            overrideStatus: a?.gpsOverrideStatus || null,
            overrideReason: a?.gpsOverrideReason || null,
            originalLat: a?.originalLatitude ?? null,
            originalLng: a?.originalLongitude ?? null,
            inatObservationId: null,
            positionalAccuracy: null,
            obscured: null,
            gpsSource: null,
            originalUrl: a?.originalUrl || null,
          });
        }
      }
    }
    return out;
  }, [query.data]);

  const curation = query.data?.curation || {};

  return { waypoints, curation, isLoading: query.isLoading };
}
