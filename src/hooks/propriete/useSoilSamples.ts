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
      // On relit la version serveur juste avant d'écrire : jamais depuis un cache
      // potentiellement périmé, sous peine d'écraser des saisies récentes.
      const { data: fresh, error: readError } = await supabase
        .from('propriete_soil_diagnostics' as any)
        .select('*')
        .eq('propriete_id', proprieteId)
        .maybeSingle();
      if (readError && (readError as any).code !== 'PGRST116') throw readError;
      const row = (fresh as any) || null;
      if (!row || !Array.isArray(row.samples) || row.samples.length === 0) return;
      // Patch strictement limité au point déplacé.
      const samples = row.samples.map((s: any) =>
        s.id === input.id ? { ...s, lat: input.lat, lng: input.lng } : s,
      );
      const { error } = await supabase.rpc('upsert_propriete_soil' as any, {
        p_propriete_id: proprieteId,
        p_terrain_status: row.terrain_status ?? null,
        p_samples: samples as any,
        p_structure: row.structure ?? null,
        p_texture: row.texture ?? null,
        p_boudin_shape: row.boudin_shape ?? null,
        p_ph: row.ph ?? null,
        p_life_signs: row.life_signs ?? [],
        p_synthesis: row.synthesis ?? null,
        p_completed: null,
        p_allow_destructive: false,
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
