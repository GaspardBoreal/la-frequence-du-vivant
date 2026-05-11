import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Indique si l'utilisateur courant peut corriger manuellement une traduction
 * d'espèce (admin / ambassadeur / sentinelle).
 *
 * L'autorisation finale est imposée côté serveur par la RPC
 * `update_species_translation_manual` (SECURITY DEFINER). Ce hook sert
 * uniquement à afficher ou non l'UI d'édition.
 */
export function useCanCurateTranslations() {
  return useQuery({
    queryKey: ['can-curate-translations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: isAdmin } = await supabase.rpc('check_is_admin_user', {
        check_user_id: user.id,
      });
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
