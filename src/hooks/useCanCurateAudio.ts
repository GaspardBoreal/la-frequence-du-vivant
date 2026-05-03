import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Indique si l'utilisateur courant peut éditer le descriptif de TOUS les sons
 * des marcheurs (admin / ambassadeur / sentinelle).
 *
 * Côté serveur, l'autorisation finale est imposée par la policy RLS
 * `Curators can update audio descriptions` + le trigger garde-fou
 * `guard_marcheur_audio_curator_update`. Ce hook sert uniquement à afficher
 * ou non le bouton d'édition.
 */
export function useCanCurateAudio() {
  return useQuery({
    queryKey: ['can-curate-audio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Admin ?
      const { data: isAdmin } = await supabase.rpc('check_is_admin_user', {
        check_user_id: user.id,
      });
      if (isAdmin) return true;

      // Rôle communauté ?
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
