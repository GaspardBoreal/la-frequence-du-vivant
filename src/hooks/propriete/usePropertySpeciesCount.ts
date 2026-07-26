import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  normalizeKingdom,
  type KingdomKey,
} from '@/lib/kingdomLabels';
import { explorationSpeciesCountKey } from '@/hooks/useExplorationSpeciesCount';

/**
 * Compteur d'espèces d'une propriété — **même fonction de comptage** que
 * Mon espace › Biodiversité › Taxons observés.
 *
 * On appelle la RPC `get_exploration_species_count` pour chaque exploration
 * rattachée aux événements de la propriété, puis on fusionne côté client par
 * nom scientifique normalisé (aucun double comptage si deux explorations
 * partagent des espèces).
 */
export interface PropertySpeciesCount {
  total: number;
  byKingdom: Record<KingdomKey, number>;
  /** Nombre de règnes réellement représentés */
  kingdomsPresent: number;
  explorationIds: string[];
  isLoading: boolean;
}

const normSci = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function usePropertySpeciesCount(proprieteId?: string): PropertySpeciesCount {
  const idsQuery = useQuery({
    queryKey: ['propriete-exploration-ids', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_marche_events')
        .select('marche_events!inner(exploration_id)')
        .eq('propriete_id', proprieteId!);
      if (error) throw error;
      const ids = (data || [])
        .map((r: any) => r.marche_events?.exploration_id)
        .filter((v: any): v is string => !!v);
      return Array.from(new Set(ids));
    },
  });

  const explorationIds = useMemo(() => idsQuery.data || [], [idsQuery.data]);

  const counts = useQueries({
    queries: explorationIds.map((id) => ({
      // Même clé de cache que le hook marcheur → zéro appel réseau
      // supplémentaire si la vue Mon espace a déjà chargé la donnée.
      queryKey: explorationSpeciesCountKey(id),
      staleTime: 30_000,
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_exploration_species_count', {
          p_exploration_id: id,
        });
        if (error) throw error;
        return (data as any) || {};
      },
    })),
  });

  const isLoading = idsQuery.isLoading || counts.some((q) => q.isLoading);

  const { total, byKingdom } = useMemo(() => {
    const bucket = new Map<string, KingdomKey>();
    for (const q of counts) {
      const list: any[] = (q.data as any)?.species || [];
      for (const sp of list) {
        const key = normSci(sp?.sci);
        if (!key) continue;
        const k = normalizeKingdom(sp?.kingdom);
        const existing = bucket.get(key);
        // Un règne identifié l'emporte sur « autres »
        if (!existing || (existing === 'others' && k !== 'others')) bucket.set(key, k);
      }
    }
    const agg: Record<KingdomKey, number> = { plantae: 0, animalia: 0, fungi: 0, others: 0 };
    bucket.forEach((k) => {
      agg[k] += 1;
    });
    return { total: bucket.size, byKingdom: agg };
  }, [counts]);

  return {
    total,
    byKingdom,
    kingdomsPresent: (Object.values(byKingdom) as number[]).filter((v) => v > 0).length,
    explorationIds,
    isLoading,
  };
}
