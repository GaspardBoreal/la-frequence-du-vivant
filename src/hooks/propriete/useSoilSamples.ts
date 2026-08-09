import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PropertySoilState, SoilSample } from './usePropertySoil';

/**
 * Lecture partagée des prélèvements de sol (étape « J'analyse »).
 * Même clé de cache que `usePropertySoil` : une seule source de vérité,
 * aucun doublon d'écriture.
 */
export function useSoilSamples(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<PropertySoilState>({
    queryKey: ['propriete-soil', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_soil_diagnostics' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = (data as any) || {};
      return {
        terrain_status: row.terrain_status ?? null,
        samples: Array.isArray(row.samples) ? row.samples : [],
        structure: row.structure ?? null,
        texture: row.texture ?? null,
        boudin_shape: row.boudin_shape ?? null,
        ph: row.ph ?? null,
        life_signs: row.life_signs ?? [],
        synthesis: row.synthesis ?? '',
        completed_at: row.completed_at ?? null,
        updated_at: row.updated_at ?? null,
      } as PropertySoilState;
    },
  });

  const state = query.data;

  const moveMutation = useMutation({
    mutationFn: async (input: { id: string; lat: number; lng: number }) => {
      if (!proprieteId) return;
      // Écriture chirurgicale : la RPC ne peut modifier que lat/lng du prélèvement
      // visé. Aucun autre champ du registre n'est renvoyé, donc jamais écrasé.
      const { error } = await supabase.rpc('move_propriete_soil_sample' as any, {
        p_propriete_id: proprieteId,
        p_sample_id: input.id,
        p_lat: input.lat,
        p_lng: input.lng,
      });
      if (error) throw error;
    },


    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['propriete-soil', proprieteId] });
      const prev = qc.getQueryData<PropertySoilState>(['propriete-soil', proprieteId]);
      if (prev) {
        qc.setQueryData<PropertySoilState>(['propriete-soil', proprieteId], {
          ...prev,
          samples: (prev.samples ?? []).map((s) =>
            s.id === input.id ? { ...s, lat: input.lat, lng: input.lng } : s,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['propriete-soil', proprieteId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['propriete-soil', proprieteId] });
    },
  });

  const moveSample = useCallback(
    (id: string, lat: number, lng: number) => moveMutation.mutate({ id, lat, lng }),
    [moveMutation],
  );

  const samples: SoilSample[] = state?.samples ?? [];

  return {
    samples,
    placed: samples.filter((s) => s.lat != null && s.lng != null),
    loading: query.isLoading,
    moveSample,
    moving: moveMutation.isPending,
  };
}

export default useSoilSamples;
