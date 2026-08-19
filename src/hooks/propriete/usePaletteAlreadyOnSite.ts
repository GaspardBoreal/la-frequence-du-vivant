import React from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { speciesLatinBase } from '@/lib/speciesLatinBase';

const norm = (s: string | null | undefined) =>
  speciesLatinBase(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Ce qui pousse déjà sur la propriété, vu de la palette.
 *
 * Trois sources, toutes en lecture seule : les espèces déjà retenues dans la
 * palette végétale, la flore relevée à l'étape 3, et le pool d'observations des
 * marches liées (mêmes clés de cache que la fiche propriété, donc sans requête
 * supplémentaire quand la fiche a déjà été ouverte).
 */
export function usePaletteAlreadyOnSite(proprieteId: string | undefined) {
  const palette = useQuery({
    queryKey: ['propriete-palette', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('propriete_palette' as any)
        .select('zones')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      return (data as any) || null;
    },
  });

  const flora = useQuery({
    queryKey: ['propriete-flora', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('propriete_flora_diagnostics' as any)
        .select('observed_plants')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      return (data as any) || null;
    },
  });

  const ids = useQuery({
    queryKey: ['propriete-exploration-ids', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_marche_events')
        .select('marche_events!inner(exploration_id)')
        .eq('propriete_id', proprieteId!);
      if (error) throw error;
      return Array.from(
        new Set(((data as any[]) || []).map((r) => r.marche_events?.exploration_id).filter(Boolean)),
      ) as string[];
    },
  });

  const pools = useQueries({
    queries: (ids.data || []).slice(0, 6).map((id) => ({
      queryKey: ['exploration-species-pool-rpc', id, 'v6-gps-overrides'],
      staleTime: 60 * 1000,
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_exploration_species_pool', {
          p_exploration_id: id,
        });
        if (error) throw error;
        return { species: ((data as any)?.species || []) as Array<{ scientific_name: string | null }> };
      },
    })),
  });

  return React.useMemo(() => {
    const latins = new Set<string>();
    const paletteIds = new Set<string>();

    const zones = (palette.data?.zones as any[]) || [];
    zones.forEach((z) => (z?.selected || []).forEach((id: string) => paletteIds.add(id)));

    ((flora.data?.observed_plants as string[]) || []).forEach((n) => {
      const k = norm(n);
      if (k) latins.add(k);
    });

    pools.forEach((q) =>
      (q.data?.species || []).forEach((s) => {
        const k = norm(s.scientific_name);
        if (k) latins.add(k);
      }),
    );

    return {
      /** Vrai quand l'espèce est déjà observée ou déjà retenue au jardin. */
      isOnSite: (speciesId: string, latin: string) => paletteIds.has(speciesId) || latins.has(norm(latin)),
      count: latins.size + paletteIds.size,
      isLoading: palette.isLoading || flora.isLoading || ids.isLoading,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette.data, flora.data, ids.isLoading, palette.isLoading, flora.isLoading, pools.map((p) => p.dataUpdatedAt).join(',')]);
}
