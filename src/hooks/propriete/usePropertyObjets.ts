import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ObjetMeta {
  note?: string | null;
  quantite?: number | null;
  cout?: number | null;
  /** clé de la fiche d'inspiration source, le cas échéant */
  inspiration?: string | null;
}

export interface ProprieteObjet {
  id: string;
  propriete_id: string;
  calque_id: string | null;
  zone_id: string | null;
  outil_key: string;
  nom: string | null;
  /** GeoJSON Point / LineString / Polygon ([lng, lat]) */
  geometry: any;
  style: Record<string, any>;
  meta: ObjetMeta;
  ordre: number;
}

export function useProprieteObjets(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<ProprieteObjet[]>({
    queryKey: ['propriete-objets', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_propriete_objets' as any, {
        _propriete_id: proprieteId!,
      });
      if (error) throw error;
      return ((data as any[]) || []).map((r) => ({
        id: r.id,
        propriete_id: r.propriete_id,
        calque_id: r.calque_id ?? null,
        zone_id: r.zone_id ?? null,
        outil_key: r.outil_key,
        nom: r.nom ?? null,
        geometry: r.geometry,
        style: r.style ?? {},
        meta: (r.meta ?? {}) as ObjetMeta,
        ordre: r.ordre ?? 0,
      }));
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ['propriete-objets', proprieteId] }),
    [qc, proprieteId],
  );

  const upsertObjet = useCallback(
    async (input: {
      id?: string;
      outil_key: string;
      geometry: any;
      calque_id?: string | null;
      zone_id?: string | null;
      nom?: string | null;
      style?: Record<string, any>;
      meta?: ObjetMeta;
      ordre?: number;
    }) => {
      if (!proprieteId) return null;
      const { data, error } = await supabase.rpc('upsert_propriete_objet' as any, {
        _propriete_id: proprieteId,
        _outil_key: input.outil_key,
        _geometry: input.geometry,
        _calque_id: input.calque_id ?? null,
        _zone_id: input.zone_id ?? null,
        _nom: input.nom ?? null,
        _style: (input.style ?? {}) as any,
        _meta: (input.meta ?? {}) as any,
        _ordre: input.ordre ?? 0,
        _objet_id: input.id ?? null,
      });
      if (error) throw error;
      await invalidate();
      return data as any;
    },
    [proprieteId, invalidate],
  );

  const deleteObjet = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc('delete_propriete_objet' as any, { _objet_id: id });
      if (error) throw error;
      await invalidate();
    },
    [invalidate],
  );

  return {
    objets: query.data ?? [],
    loading: query.isLoading,
    upsertObjet,
    deleteObjet,
    refetch: query.refetch,
  };
}
