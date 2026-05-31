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
  /** Numeric iNat user id — captured from /v1/users/<login> for stable identity */
  external_id?: string | null;
  display_name?: string | null;
}

export function useUpsertScienceAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertPayload) => {
      const username = payload.username.trim();
      if (!username) throw new Error('Identifiant requis');
      const url = buildProfileUrl(payload.network, username, payload.profile_url);

      // For iNat, auto-resolve numeric id + canonical display name.
      // This makes the identity resistant to future iNat renames.
      let external_id = payload.external_id ?? null;
      let display_name = payload.display_name ?? null;
      if (payload.network === 'inaturalist' && !external_id) {
        try {
          const { data, error } = await supabase.functions.invoke(
            'resolve-inaturalist-user',
            { body: { login: username } },
          );
          if (!error && data && (data as any).id != null) {
            external_id = String((data as any).id);
            if (!display_name && (data as any).name) display_name = (data as any).name;
          }
        } catch (_) {
          // resolution best-effort — don't block save if iNat API is down
        }
      }

      const row = {
        profile_id: payload.profile_id,
        network: payload.network,
        username,
        profile_url: url,
        verified: payload.verified ?? false,
        external_id,
        display_name,
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
      qc.invalidateQueries({ queryKey: ['marcheur-aliases'] });
      qc.invalidateQueries({ queryKey: ['marcheurs-aliases-map'] });
      qc.invalidateQueries({ queryKey: ['exploration-citizen-contributors'] });
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
