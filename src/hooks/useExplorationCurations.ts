import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type CurationSense = 'oeil' | 'main' | 'coeur' | 'oreille' | 'palais';
export type CurationEntityType = 'species' | 'media' | 'text' | 'audio' | 'palais_entry';

export type ClassificationSource =
  | 'knowledge_base'
  | 'gbif'
  | 'inaturalist'
  | 'ai'
  | 'curator'
  | null;

export interface ClassificationEvidenceItem {
  source: string;
  quote?: string;
  url?: string;
  reference?: string;
}

export interface ExplorationCuration {
  id: string;
  exploration_id: string;
  sense: CurationSense;
  entity_type: CurationEntityType;
  entity_id: string | null;
  category: string | null;
  title: string | null;
  description: string | null;
  media_ids: string[];
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  source?: 'manual' | 'ai' | 'gbif_pool' | null;
  ai_score?: number | null;
  ai_reason?: string | null;
  ai_criteria?: Record<string, any> | null;
  // Phase 1+ — sources auditables
  secondary_categories?: string[];
  classification_evidence?: ClassificationEvidenceItem[];
  classification_source?: ClassificationSource;
  classification_confidence?: number | null;
  needs_review?: boolean;
}

/** Récupère toutes les curations d'une exploration (ou filtré par sens) */
export const useExplorationCurations = (
  explorationId: string | null | undefined,
  sense?: CurationSense
) => {
  return useQuery({
    queryKey: ['exploration-curations', explorationId, sense ?? 'all'],
    queryFn: async () => {
      if (!explorationId) return [] as ExplorationCuration[];
      let q = supabase
        .from('exploration_curations')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('display_order', { ascending: true });
      if (sense) q = q.eq('sense', sense);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ExplorationCuration[];
    },
    enabled: !!explorationId,
    staleTime: 60 * 1000,
  });
};

/** Détecte si l'utilisateur courant peut curater (ambassadeur, sentinelle, ou admin) */
export const useIsCurator = (explorationId: string | null | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-curator', user?.id, explorationId],
    queryFn: async () => {
      if (!user?.id || !explorationId) return false;
      // Récupère le rôle communauté
      const { data: profile } = await supabase
        .from('community_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      const role = profile?.role as string | undefined;
      if (role !== 'ambassadeur' && role !== 'sentinelle') return false;
      // Vérifie la participation à un évènement de cette exploration
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, marche_participations!inner(user_id)')
        .eq('exploration_id', explorationId)
        .eq('marche_participations.user_id', user.id)
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user?.id && !!explorationId,
    staleTime: 5 * 60 * 1000,
  });
};

interface UpsertPayload {
  id?: string;
  exploration_id: string;
  sense: CurationSense;
  entity_type: CurationEntityType;
  entity_id?: string | null;
  category?: string | null;
  title?: string | null;
  description?: string | null;
  media_ids?: string[];
}

export const useUpsertCuration = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: UpsertPayload) => {
      if (!user?.id) throw new Error('Authentification requise');
      if (payload.id) {
        const { data, error } = await supabase
          .from('exploration_curations')
          .update({
            category: payload.category ?? null,
            title: payload.title ?? null,
            description: payload.description ?? null,
            media_ids: payload.media_ids ?? [],
          })
          .eq('id', payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('exploration_curations')
          .insert({
            exploration_id: payload.exploration_id,
            sense: payload.sense,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id ?? null,
            category: payload.category ?? null,
            title: payload.title ?? null,
            description: payload.description ?? null,
            media_ids: payload.media_ids ?? [],
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-curations', vars.exploration_id] });
      toast.success(vars.id ? 'Curation mise à jour' : 'Élément épinglé');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });
};

export const useDeleteCuration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; exploration_id: string }) => {
      const { error } = await supabase.from('exploration_curations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-curations', vars.exploration_id] });
      toast.success('Élément retiré');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });
};
