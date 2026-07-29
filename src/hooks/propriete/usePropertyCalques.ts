import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProprieteCalque {
  id: string;
  propriete_id: string;
  nom: string;
  ordre: number;
  visible: boolean;
  verrouille: boolean;
  opacite: number;
}

export function useProprieteCalques(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<ProprieteCalque[]>({
    queryKey: ['propriete-calques', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_propriete_calques' as any, {
        _propriete_id: proprieteId!,
      });
      if (error) throw error;
      return ((data as any[]) || []).map((r) => ({
        id: r.id,
        propriete_id: r.propriete_id,
        nom: r.nom ?? 'Calque',
        ordre: r.ordre ?? 0,
        visible: r.visible !== false,
        verrouille: !!r.verrouille,
        opacite: Number(r.opacite ?? 1),
      }));
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ['propriete-calques', proprieteId] }),
    [qc, proprieteId],
  );

  const upsertCalque = useCallback(
    async (input: Partial<ProprieteCalque> & { nom: string; id?: string }) => {
      if (!proprieteId) return null;
      const { data, error } = await supabase.rpc('upsert_propriete_calque' as any, {
        _propriete_id: proprieteId,
        _nom: input.nom,
        _ordre: input.ordre ?? 0,
        _visible: input.visible ?? true,
        _verrouille: input.verrouille ?? false,
        _opacite: input.opacite ?? 1,
        _calque_id: input.id ?? null,
      });
      if (error) throw error;
      await invalidate();
      return data as any;
    },
    [proprieteId, invalidate],
  );

  const deleteCalque = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc('delete_propriete_calque' as any, { _calque_id: id });
      if (error) throw error;
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['propriete-objets', proprieteId] });
    },
    [invalidate, qc, proprieteId],
  );

  return {
    calques: query.data ?? [],
    loading: query.isLoading,
    upsertCalque,
    deleteCalque,
    refetch: query.refetch,
  };
}
