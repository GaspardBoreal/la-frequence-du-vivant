import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CurationMarcheurLink {
  id: string;
  curation_id: string;
  marcheur_id: string;
  role_label: string | null;
  display_order: number;
  marcheur?: {
    id: string;
    prenom: string;
    nom: string;
    avatar_url: string | null;
    couleur: string | null;
  };
}

export interface PratiqueForMarcheur {
  curation_id: string;
  exploration_id: string;
  title: string | null;
  description: string | null;
  media_ids: string[];
  role_label: string | null;
}

/** Liste les marcheurs associés à une pratique (curation 'main') */
export const useCurationMarcheurs = (curationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['curation-marcheurs', curationId],
    queryFn: async () => {
      if (!curationId) return [] as CurationMarcheurLink[];
      const { data, error } = await supabase
        .from('curation_marcheurs')
        .select('id, curation_id, marcheur_id, role_label, display_order, marcheur:exploration_marcheurs(id, prenom, nom, avatar_url, couleur)')
        .eq('curation_id', curationId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CurationMarcheurLink[];
    },
    enabled: !!curationId,
    staleTime: 60_000,
  });
};

/**
 * Liste les pratiques emblématiques portées par un marcheur.
 * @param crewId — exploration_marcheurs.id (jamais un ID UI type "community-…" ou "crew-…").
 */
const isSyntheticUiId = (id: string) => id.startsWith('community-') || id.startsWith('crew-');

export const useMarcheurPratiques = (crewId: string | null | undefined) => {
  return useQuery({
    queryKey: ['marcheur-pratiques', crewId],
    queryFn: async () => {
      if (!crewId || isSyntheticUiId(crewId)) return [] as PratiqueForMarcheur[];
      const { data, error } = await supabase
        .from('curation_marcheurs')
        .select('role_label, curation:exploration_curations(id, exploration_id, sense, title, description, media_ids)')
        .eq('marcheur_id', crewId);
      if (error) throw error;
      return ((data || []) as any[])
        .filter(row => row.curation?.sense === 'main')
        .map(row => ({
          curation_id: row.curation.id,
          exploration_id: row.curation.exploration_id,
          title: row.curation.title,
          description: row.curation.description,
          media_ids: row.curation.media_ids || [],
          role_label: row.role_label,
        })) as PratiqueForMarcheur[];
    },
    enabled: !!crewId && !isSyntheticUiId(crewId),
    staleTime: 60_000,
  });
};

/** Pour un set de marcheurs d'une exploration, renvoie une Map<marcheurId, count> de pratiques associées */
export const useMarcheursPratiquesCounts = (
  explorationId: string | null | undefined,
  marcheurIds: string[],
) => {
  const key = marcheurIds.slice().sort().join(',');
  return useQuery({
    queryKey: ['marcheurs-pratiques-counts', explorationId, key],
    queryFn: async () => {
      const map = new Map<string, number>();
      if (!explorationId || marcheurIds.length === 0) return map;
      const { data, error } = await supabase
        .from('curation_marcheurs')
        .select('marcheur_id, curation:exploration_curations!inner(sense, exploration_id)')
        .in('marcheur_id', marcheurIds);
      if (error) throw error;
      ((data || []) as any[]).forEach(row => {
        if (row.curation?.sense === 'main' && row.curation.exploration_id === explorationId) {
          map.set(row.marcheur_id, (map.get(row.marcheur_id) || 0) + 1);
        }
      });
      return map;
    },
    enabled: !!explorationId && marcheurIds.length > 0,
    staleTime: 60_000,
  });
};

export const useAttachPratique = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      curation_id: string;
      marcheur_id?: string | null;
      user_id?: string | null;
      role_label?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('attach_pratique_to_marcheur', {
        p_curation_id: vars.curation_id,
        p_marcheur_id: vars.marcheur_id ?? null,
        p_user_id: vars.user_id ?? null,
        p_role_label: vars.role_label ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['curation-marcheurs', vars.curation_id] });
      if (vars.marcheur_id) qc.invalidateQueries({ queryKey: ['marcheur-pratiques', vars.marcheur_id] });
      qc.invalidateQueries({ queryKey: ['marcheurs-pratiques-counts'] });
      qc.invalidateQueries({ queryKey: ['exploration-participants'] });
      qc.invalidateQueries({ queryKey: ['exploration-marcheurs'] });
      toast.success('Marcheur relié à la pratique');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur lors de l\'association'),
  });
};

export const useDetachPratique = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { curation_id: string; marcheur_id: string }) => {
      const { error } = await supabase.rpc('detach_pratique_from_marcheur', {
        p_curation_id: vars.curation_id,
        p_marcheur_id: vars.marcheur_id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['curation-marcheurs', vars.curation_id] });
      qc.invalidateQueries({ queryKey: ['marcheur-pratiques', vars.marcheur_id] });
      qc.invalidateQueries({ queryKey: ['marcheurs-pratiques-counts'] });
      toast.success('Association retirée');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur lors de la suppression'),
  });
};
