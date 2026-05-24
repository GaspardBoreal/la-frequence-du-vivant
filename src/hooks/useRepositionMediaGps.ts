import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RepositionInput {
  /** id de la ligne (préfixé `media-` ou `obs-` comme dans UnidentifiedPhotoCandidate) */
  candidateId: string;
  lat: number;
  lon: number;
  note?: string;
}

/**
 * Mutation de repositionnement GPS — appelle la bonne RPC selon le préfixe id.
 * Invalide le cache `marcheur-unidentified-photos`.
 */
export function useRepositionMediaGps(opts?: { explorationId?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ candidateId, lat, lon, note }: RepositionInput) => {
      const isMedia = candidateId.startsWith('media-');
      const isObs = candidateId.startsWith('obs-');
      const realId = candidateId.replace(/^(media-|obs-)/, '');
      if (!isMedia && !isObs) throw new Error('UNKNOWN_CANDIDATE');

      const fn = isMedia ? 'reposition_marcheur_media_gps' : 'reposition_marcheur_observation_gps';
      const params: any = isMedia
        ? { _media_id: realId, _lat: lat, _lon: lon, _note: note ?? null }
        : { _obs_id: realId, _lat: lat, _lon: lon, _note: note ?? null };
      const { data, error } = await supabase.rpc(fn as any, params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcheur-unidentified-photos'] });
      toast.success('Position GPS mise à jour');
    },
    onError: (err: any) => {
      const msg = String(err?.message || err);
      if (msg.includes('FORBIDDEN')) toast.error('Vous n\'avez pas les droits pour repositionner');
      else if (msg.includes('INVALID_COORDS')) toast.error('Coordonnées invalides');
      else toast.error('Échec du repositionnement');
    },
  });
}
