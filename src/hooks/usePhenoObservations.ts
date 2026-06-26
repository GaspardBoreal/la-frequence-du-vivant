import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  type BbchCrop,
  type BbchStage,
  findCropByScientificName,
  getCropByKey,
  getStagesForCrop,
} from '@/lib/bbchStages';

export interface PhenoObservation {
  id: string;
  marcheur_id: string;
  exploration_id: string | null;
  marche_id: string | null;
  species_scientific_name: string;
  crop_key: string;
  bbch_macro: number;
  bbch_label_fr: string;
  bbch_uri: string | null;
  observed_at: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePhenoObservationInput {
  exploration_id?: string | null;
  marche_id?: string | null;
  species_scientific_name: string;
  crop: BbchCrop;
  stage: BbchStage;
  observed_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  notes?: string | null;
}

/** Liste des observations phéno pour une exploration donnée. */
export function usePhenoObservations(explorationId?: string | null) {
  return useQuery({
    queryKey: ['pheno-observations', 'exploration', explorationId],
    enabled: !!explorationId,
    staleTime: 30_000,
    queryFn: async (): Promise<PhenoObservation[]> => {
      const { data, error } = await supabase
        .from('pheno_observations')
        .select('*')
        .eq('exploration_id', explorationId!)
        .order('observed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PhenoObservation[];
    },
  });
}

/** Observations phéno du marcheur courant. */
export function useMyPhenoObservations() {
  return useQuery({
    queryKey: ['pheno-observations', 'me'],
    staleTime: 30_000,
    queryFn: async (): Promise<PhenoObservation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('pheno_observations')
        .select('*')
        .eq('marcheur_id', user.id)
        .order('observed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PhenoObservation[];
    },
  });
}

/** Mutation : crée une observation phéno. */
export function useCreatePhenoObservation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreatePhenoObservationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté pour noter un stade phénologique.');
      const payload = {
        marcheur_id: user.id,
        exploration_id: input.exploration_id ?? null,
        marche_id: input.marche_id ?? null,
        species_scientific_name: input.species_scientific_name,
        crop_key: input.crop.key,
        bbch_macro: input.stage.macro,
        bbch_label_fr: input.stage.labelFr,
        bbch_uri: input.stage.uri,
        observed_at: input.observed_at ?? new Date().toISOString().slice(0, 10),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        photo_url: input.photo_url ?? null,
        notes: input.notes ?? null,
        source: 'manual',
      };
      const { data, error } = await supabase
        .from('pheno_observations')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as PhenoObservation;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['pheno-observations'] });
      toast({
        title: `${data.bbch_label_fr} noté ✨`,
        description: '+10 Fréquences · Carnet Phéno enrichi',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Impossible d\'enregistrer le stade',
        description: err?.message ?? 'Erreur inconnue',
        variant: 'destructive',
      });
    },
  });
}

/** Helpers re-exportés pour l'UI. */
export { findCropByScientificName, getCropByKey, getStagesForCrop };
