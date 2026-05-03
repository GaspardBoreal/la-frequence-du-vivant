import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ReorderItem = {
  /** 'media' = marcheur_medias, 'conv' = exploration_convivialite_photos */
  kind: 'media' | 'conv';
  /** Underlying row id (sans préfixe). */
  id: string;
  /** Position 1-based. */
  ordre: number;
};

export interface ReorderObservationsArgs {
  ownerUserId?: string | null;
  ownerCrewId?: string | null;
  items: ReorderItem[];
  /** Used to invalidate the matching observations query. */
  invalidateKey?: unknown[];
}

export function useReorderMarcheurObservations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ownerUserId, ownerCrewId, items }: ReorderObservationsArgs) => {
      const { error } = await supabase.rpc('reorder_marcheur_observation_photos', {
        p_owner_user_id: ownerUserId ?? null,
        p_owner_crew_id: ownerCrewId ?? null,
        p_items: items as any,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      if (vars.invalidateKey) qc.invalidateQueries({ queryKey: vars.invalidateKey });
      qc.invalidateQueries({ queryKey: ['marcheur-observations-photos'] });
    },
  });
}
