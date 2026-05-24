import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Indique si l'utilisateur courant peut repositionner les GPS des photos
 * d'autres marcheurs (admin / ambassadeur / sentinelle).
 *
 * Côté serveur, le contrôle final est imposé par la RPC SECURITY DEFINER
 * `reposition_marcheur_*_gps` qui appelle `is_gps_curator(auth.uid())`.
 */
export function useIsGpsCurator() {
  return useQuery({
    queryKey: ['is-gps-curator'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data: isAdmin } = await supabase.rpc('check_is_admin_user', { check_user_id: user.id });
      if (isAdmin) return true;
      const { data: profile } = await supabase
        .from('community_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      return profile?.role === 'ambassadeur' || profile?.role === 'sentinelle';
    },
    staleTime: 60_000,
  });
}
