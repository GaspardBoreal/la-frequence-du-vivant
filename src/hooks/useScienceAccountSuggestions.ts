import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ScienceNetwork } from '@/types/scienceAccounts';
import { buildProfileUrl } from '@/types/scienceAccounts';
import { toast } from 'sonner';

export interface ScienceAccountSuggestion {
  profile_id: string;
  prenom: string;
  nom: string;
  ville: string | null;
  avatar_url: string | null;
  network: ScienceNetwork;
  observer_name: string;
  observer_count: number;
  species_count: number;
  last_observation_date: string | null;
  sample_url: string | null;
  confidence: 'exact' | 'fuzzy';
  homonym_count: number;
}

export function useScienceAccountSuggestions() {
  return useQuery({
    queryKey: ['science-account-suggestions'],
    queryFn: async (): Promise<ScienceAccountSuggestion[]> => {
      const { data, error } = await supabase.rpc('suggest_science_accounts');
      if (error) throw error;
      return (data || []) as unknown as ScienceAccountSuggestion[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface ResolvedInat {
  user_login?: string;
  user_id?: number | string;
  display_name?: string;
}

async function resolveInat(sampleUrl: string | null): Promise<ResolvedInat | null> {
  if (!sampleUrl) return null;
  try {
    const { data, error } = await supabase.functions.invoke('resolve-inaturalist-user', {
      body: { observation_url: sampleUrl },
    });
    if (error) return null;
    const d: any = data || {};
    // Be tolerant: edge function may return user object or flattened fields
    const user = d.user || d;
    return {
      user_login: user?.login || user?.user_login,
      user_id: user?.id || user?.user_id,
      display_name: user?.name || user?.display_name,
    };
  } catch {
    return null;
  }
}

export function useLinkSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: ScienceAccountSuggestion) => {
      let username = s.observer_name;
      let displayName: string | null = s.observer_name;
      let externalId: string | null = null;
      let profileUrl: string | null = null;

      if (s.network === 'inaturalist') {
        const r = await resolveInat(s.sample_url);
        if (r?.user_login) {
          username = r.user_login;
          displayName = r.display_name || s.observer_name;
          externalId = r.user_id ? String(r.user_id) : null;
          profileUrl = `https://www.inaturalist.org/people/${encodeURIComponent(r.user_login)}`;
        }
      }
      if (!profileUrl) profileUrl = buildProfileUrl(s.network, username, null);

      const { error } = await supabase
        .from('community_profile_science_accounts')
        .insert({
          profile_id: s.profile_id,
          network: s.network,
          username,
          display_name: displayName,
          external_id: externalId,
          profile_url: profileUrl,
          verified: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['science-accounts'] });
      qc.invalidateQueries({ queryKey: ['science-account-suggestions'] });
      toast.success('Compte lié');
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la liaison'),
  });
}

export function useIgnoreSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: ScienceAccountSuggestion) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('community_science_account_suggestions_ignored')
        .insert({
          profile_id: s.profile_id,
          network: s.network,
          observer_name: s.observer_name,
          ignored_by: auth.user?.id ?? null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['science-account-suggestions'] });
      toast.success('Suggestion ignorée');
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur'),
  });
}
