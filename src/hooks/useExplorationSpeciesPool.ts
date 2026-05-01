import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFrenchSpeciesNames } from './useFrenchSpeciesNames';

export interface ExplorationSpecies {
  /** Stable key used as curation entity_id (scientific name preferred, fallback common name) */
  key: string;
  scientificName: string | null;
  commonName: string | null;
  /** French translation if available in species_translations, else null */
  commonNameFr: string | null;
  /** Best display name: FR translation > original commonName > scientificName */
  displayName: string;
  group: string | null;
  count: number;
  imageUrl: string | null;
}

interface RawExplorationSpecies {
  key: string;
  scientificName: string | null;
  commonName: string | null;
  group: string | null;
  count: number;
  imageUrl: string | null;
}

/**
 * Aggregates all species observed across the marche_events of an exploration,
 * deduplicated by scientific name (case-insensitive).
 *
 * Each species is enriched with `displayName` / `commonNameFr` so all
 * downstream consumers (cards, modals, exports) get the French name resolved
 * once at the source — same strategy as the Bioacoustique view.
 */
export const useExplorationSpeciesPool = (explorationId: string | null | undefined) => {
  const rawQuery = useQuery({
    queryKey: ['exploration-species-pool-raw', explorationId],
    queryFn: async (): Promise<RawExplorationSpecies[]> => {
      if (!explorationId) return [];

      const { data: em, error: emErr } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      if (emErr) throw emErr;
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      const { data: snaps, error: snapsErr } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', marcheIds);
      if (snapsErr) throw snapsErr;

      const map = new Map<string, RawExplorationSpecies>();
      (snaps || []).forEach((s: any) => {
        const arr: any[] = Array.isArray(s.species_data) ? s.species_data : [];
        arr.forEach(sp => {
          const sci = (sp.scientificName || sp.scientific_name || '').toString().trim();
          const com = (sp.commonName || sp.common_name || sp.vernacularName || '').toString().trim();
          const key = (sci || com).toLowerCase();
          if (!key) return;
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
            if (!existing.imageUrl && (sp.imageUrl || sp.image_url)) {
              existing.imageUrl = sp.imageUrl || sp.image_url;
            }
          } else {
            map.set(key, {
              key: sci || com,
              scientificName: sci || null,
              commonName: com || null,
              group: sp.group || sp.kingdom || sp.taxonGroup || null,
              count: 1,
              imageUrl: sp.imageUrl || sp.image_url || null,
            });
          }
        });
      });

      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
  });

  const raw = rawQuery.data || [];

  // Enrich with French names — single batched DB lookup, cached 24h
  const { data: frMap } = useFrenchSpeciesNames(
    raw.map(s => ({ scientificName: s.scientificName, commonName: s.commonName }))
  );

  const enriched: ExplorationSpecies[] = raw.map(s => {
    const fr = s.scientificName ? frMap?.get(s.scientificName) : undefined;
    const displayName = fr?.displayName || s.commonName || s.scientificName || '';
    return {
      ...s,
      commonNameFr: fr?.commonNameFr ?? null,
      displayName,
    };
  });

  return {
    ...rawQuery,
    data: enriched,
  };
};
