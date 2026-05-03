import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReattributeSource = 'media' | 'audio' | 'conv';

interface Args {
  source: ReattributeSource;
  /** UUID of the underlying row (marcheur_medias.id, marcheur_audio.id, exploration_convivialite_photos.id). */
  mediaId: string;
  /** New marcheur attribution, or null to clear and fall back to uploader. */
  marcheurId: string | null;
  /** Used for query-cache invalidation (TanStack queries keyed by exploration). */
  explorationId?: string;
  /** For UI: name shown in the success toast. */
  marcheurName?: string | null;
}

/**
 * Reattributes a photo / video / audio to its real author (the person who took
 * the picture, not the one who uploaded it). Allowed for admins, ambassadeurs
 * and sentinelles only — enforced server-side by the `reattribute_media` RPC.
 */
export function useReattributeMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ source, mediaId, marcheurId }: Args) => {
      const { data, error } = await (supabase as any).rpc('reattribute_media', {
        _source: source,
        _media_id: mediaId,
        _marcheur_id: marcheurId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-all-media', vars.explorationId] });
      qc.invalidateQueries({ queryKey: ['convivialite-photos', vars.explorationId] });
      // Legacy fiche view (MarcheDetailModal / VoirTab)
      qc.invalidateQueries({ queryKey: ['marcheur-medias'] });
      if (vars.marcheurId) {
        toast.success(
          vars.marcheurName
            ? `Photo créditée à ${vars.marcheurName}`
            : 'Crédit mis à jour',
        );
      } else {
        toast.success('Crédit retiré (uploader par défaut)');
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Réattribution impossible');
    },
  });
}
