import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ScienceAccount, ScienceNetwork } from '@/types/scienceAccounts';
import { buildProfileUrl } from '@/types/scienceAccounts';
import { toast } from 'sonner';

export function useAllScienceAccounts() {
  return useQuery({
    queryKey: ['science-accounts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_profile_science_accounts')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ScienceAccount[];
    },
  });
}

export function useProfileScienceAccounts(profileId: string | undefined) {
  return useQuery({
    queryKey: ['science-accounts', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('community_profile_science_accounts')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ScienceAccount[];
    },
    enabled: !!profileId,
  });
}

interface UpsertPayload {
  id?: string;
  profile_id: string;
  network: ScienceNetwork;
  username: string;
  profile_url?: string | null;
  verified?: boolean;
}

export function useUpsertScienceAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertPayload) => {
      const username = payload.username.trim();
      if (!username) throw new Error('Identifiant requis');
      const url = buildProfileUrl(payload.network, username, payload.profile_url);
      const row = {
        profile_id: payload.profile_id,
        network: payload.network,
        username,
        profile_url: url,
        verified: payload.verified ?? false,
      };
      if (payload.id) {
        const { error } = await supabase
          .from('community_profile_science_accounts')
          .update(row)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_profile_science_accounts')
          .insert(row);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['science-accounts'] });
      toast.success(vars.id ? 'Compte mis à jour' : 'Compte ajouté');
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur'),
  });
}

export function useDeleteScienceAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('community_profile_science_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['science-accounts'] });
      toast.success('Compte supprimé');
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur'),
  });
}
