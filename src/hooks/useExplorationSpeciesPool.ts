import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExplorationSpecies {
  /** Stable key used as curation entity_id (scientific name preferred, fallback common name) */
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
 */
export const useExplorationSpeciesPool = (explorationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['exploration-species-pool', explorationId],
    queryFn: async (): Promise<ExplorationSpecies[]> => {
      if (!explorationId) return [];

      // 1. Get all marche ids for this exploration via exploration_marches → marches
      //    (source de vérité utilisée par collect-event-biodiversity)
      const { data: em, error: emErr } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      if (emErr) throw emErr;
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      // 2. Get biodiversity snapshots for these marches
      const { data: snaps, error: snapsErr } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', marcheIds);
      if (snapsErr) throw snapsErr;

      // 3. Aggregate species by normalized scientific name
      const map = new Map<string, ExplorationSpecies>();
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
};
