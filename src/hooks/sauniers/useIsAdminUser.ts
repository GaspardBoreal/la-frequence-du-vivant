import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** L'utilisateur courant est-il administrateur ? (les écritures restent gardées par la base) */
export function useIsAdminUser() {
  return useQuery({
    queryKey: ['sauniers-is-admin'],
    staleTime: 60_000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.rpc('check_is_admin_user', { check_user_id: user.id });
      return data === true;
    },
  });
}

export default useIsAdminUser;
