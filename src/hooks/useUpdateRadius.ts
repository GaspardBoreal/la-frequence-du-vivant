import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RADIUS_BOUNDS_M } from '@/utils/marcheRadius';

const clamp = (v: number) =>
  Math.max(RADIUS_BOUNDS_M.min, Math.min(RADIUS_BOUNDS_M.max, Math.round(v)));

/**
 * Met à jour le rayon par défaut d'une exploration.
 * `radiusM = null` revient au défaut système (500 m).
 */
export function useUpdateExplorationDefaultRadius() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ explorationId, radiusM }: { explorationId: string; radiusM: number | null }) => {
      const value = radiusM == null ? null : clamp(radiusM);
      const { error } = await supabase
        .from('explorations')
        .update({ default_radius_m: value })
        .eq('id', explorationId);
      if (error) throw error;
      return value;
    },
    onSuccess: (_value, { explorationId }) => {
      qc.invalidateQueries({ queryKey: ['exploration', explorationId] });
      qc.invalidateQueries({ queryKey: ['explorations'] });
      qc.invalidateQueries({ queryKey: ['exploration-radius', explorationId] });
      toast.success('Rayon par défaut enregistré');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Impossible d'enregistrer le rayon par défaut");
    },
  });
}

/**
 * Met à jour le rayon spécifique d'une marche (override).
 * `radiusM = null` retire l'override : la marche reprend le défaut exploration.
 */
export function useUpdateMarcheRadius() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ marcheId, radiusM }: { marcheId: string; radiusM: number | null }) => {
      const value = radiusM == null ? null : clamp(radiusM);
      const { error } = await supabase
        .from('marches')
        .update({ radius_m: value })
        .eq('id', marcheId);
      if (error) throw error;
      return value;
    },
    onSuccess: (_value, { marcheId }) => {
      qc.invalidateQueries({ queryKey: ['marche', marcheId] });
      qc.invalidateQueries({ queryKey: ['marche-radius', marcheId] });
      qc.invalidateQueries({ queryKey: ['marche-coords', marcheId] });
      qc.invalidateQueries({ queryKey: ['exploration-all-marches'] });
      qc.invalidateQueries({ queryKey: ['event-all-marches'] });
      toast.success('Rayon de la marche enregistré');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Impossible d'enregistrer le rayon de la marche");
    },
  });
}

/**
 * Met à jour le rayon de plusieurs marches d'un coup (action « appliquer à toutes »).
 * `radiusM = null` retire les overrides : les marches reprennent le défaut exploration.
 */
export function useBulkUpdateMarchesRadius() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      marcheIds,
      radiusM,
    }: { marcheIds: string[]; radiusM: number | null }) => {
      if (!marcheIds.length) return { count: 0, value: null };
      const value = radiusM == null ? null : clamp(radiusM);
      const { error } = await supabase
        .from('marches')
        .update({ radius_m: value })
        .in('id', marcheIds);
      if (error) throw error;
      return { count: marcheIds.length, value };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exploration-marches-radius'] });
      qc.invalidateQueries({ queryKey: ['marche-radius'] });
      qc.invalidateQueries({ queryKey: ['exploration-all-marches'] });
      qc.invalidateQueries({ queryKey: ['event-all-marches'] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Impossible d'appliquer le rayon en lot");
    },
  });
}

/**
 * Hook léger pour lire le rayon résolu d'une marche.
 * Renvoie marche.radius_m et exploration.default_radius_m bruts en plus du résolu.
 */
export async function fetchRadiusContext(marcheId: string, explorationId?: string | null) {
  const { data: marche } = await supabase
    .from('marches')
    .select('id, radius_m, latitude, longitude')
    .eq('id', marcheId)
    .maybeSingle();
  let exploration: { id: string; default_radius_m: number | null } | null = null;
  if (explorationId) {
    const { data } = await supabase
      .from('explorations')
      .select('id, default_radius_m')
      .eq('id', explorationId)
      .maybeSingle();
    exploration = data as any;
  }
  return { marche, exploration };
}
