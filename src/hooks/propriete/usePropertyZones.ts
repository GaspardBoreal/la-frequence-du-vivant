import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProprieteZone {
  id: string;
  propriete_id: string;
  nom: string;
  couleur: string | null;
  note: string | null;
  /** GeoJSON Polygon ([lng, lat]). */
  geometry: any;
  ordre: number;
}

export const ZONE_COLORS = ['#2f7d4f', '#b08d57', '#3b7ea1', '#8a6d3b', '#7a4b6b'];

export function useProprieteZones(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<ProprieteZone[]>({
    queryKey: ['propriete-zones', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_propriete_zones' as any, {
        _propriete_id: proprieteId!,
      });
      if (error) throw error;
      return ((data as any[]) || []).map((r) => ({
        id: r.id,
        propriete_id: r.propriete_id,
        nom: r.nom ?? 'Zone',
        couleur: r.couleur ?? null,
        note: r.note ?? null,
        geometry: r.geometry,
        ordre: r.ordre ?? 0,
      }));
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ['propriete-zones', proprieteId] }),
    [qc, proprieteId],
  );

  const upsertZone = useCallback(
    async (input: {
      id?: string;
      nom: string;
      geometry: any;
      couleur?: string | null;
      note?: string | null;
      ordre?: number;
    }) => {
      if (!proprieteId) return null;
      const { data, error } = await supabase.rpc('upsert_propriete_zone' as any, {
        _propriete_id: proprieteId,
        _nom: input.nom,
        _geometry: input.geometry,
        _couleur: input.couleur ?? null,
        _note: input.note ?? null,
        _ordre: input.ordre ?? 0,
        _zone_id: input.id ?? null,
      });
      if (error) throw error;
      await invalidate();
      return data as any;
    },
    [proprieteId, invalidate],
  );

  const deleteZone = useCallback(
    async (zoneId: string) => {
      const { error } = await supabase.rpc('delete_propriete_zone' as any, { _zone_id: zoneId });
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  return {
    zones: query.data ?? [],
    loading: query.isLoading,
    upsertZone,
    deleteZone,
    refetch: query.refetch,
  };
}
