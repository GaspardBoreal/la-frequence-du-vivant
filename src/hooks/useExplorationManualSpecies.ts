import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ManualSpecies {
  id: string;
  exploration_id: string;
  marche_event_id: string | null;
  scientific_name: string | null;
  common_name: string;
  gbif_taxon_key: number | null;
  group_taxon: string | null;
  photo_url: string;
  photo_lat: number | null;
  photo_lng: number | null;
  observed_at: string;
  observer_name: string | null;
  comment: string | null;
  source_mode: 'gbif' | 'free';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useExplorationManualSpecies = (
  explorationId: string | null | undefined,
  marcheEventId?: string | null
) => {
  return useQuery({
    queryKey: ['exploration-manual-species', explorationId, marcheEventId ?? 'all'],
    queryFn: async (): Promise<ManualSpecies[]> => {
      if (!explorationId) return [];
      let q = supabase
        .from('exploration_manual_species')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('observed_at', { ascending: false });
      if (marcheEventId) q = q.eq('marche_event_id', marcheEventId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ManualSpecies[];
    },
    enabled: !!explorationId,
    staleTime: 30 * 1000,
  });
};

export interface CreateManualSpeciesPayload {
  exploration_id: string;
  marche_event_id?: string | null;
  scientific_name?: string | null;
  common_name: string;
  gbif_taxon_key?: number | null;
  group_taxon?: string | null;
  photo_file: File;
  photo_lat?: number | null;
  photo_lng?: number | null;
  observed_at?: string;
  observer_name?: string | null;
  comment?: string | null;
  source_mode: 'gbif' | 'free';
}

export const useCreateManualSpecies = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateManualSpeciesPayload) => {
      if (!user?.id) throw new Error('Authentification requise');

      // Upload photo
      const ext = payload.photo_file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${payload.exploration_id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('manual-species-photos')
        .upload(path, payload.photo_file, {
          contentType: payload.photo_file.type || 'image/jpeg',
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('manual-species-photos').getPublicUrl(path);

      const { data, error } = await supabase
        .from('exploration_manual_species')
        .insert({
          exploration_id: payload.exploration_id,
          marche_event_id: payload.marche_event_id || null,
          scientific_name: payload.scientific_name || null,
          common_name: payload.common_name,
          gbif_taxon_key: payload.gbif_taxon_key || null,
          group_taxon: payload.group_taxon || null,
          photo_url: pub.publicUrl,
          photo_lat: payload.photo_lat ?? null,
          photo_lng: payload.photo_lng ?? null,
          observed_at: payload.observed_at || new Date().toISOString(),
          observer_name: payload.observer_name || null,
          comment: payload.comment || null,
          source_mode: payload.source_mode,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ManualSpecies;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-manual-species', vars.exploration_id] });
      toast.success('Espèce terrain ajoutée');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de l’ajout'),
  });
};

export const useDeleteManualSpecies = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; exploration_id: string }) => {
      const { error } = await supabase.from('exploration_manual_species').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-manual-species', vars.exploration_id] });
      toast.success('Espèce supprimée');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });
};
