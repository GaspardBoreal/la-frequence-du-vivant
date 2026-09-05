import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Résout les emails auth.users pour une liste de user_ids.
 * Réservé aux administrateurs via la RPC `admin_get_profile_emails`.
 */
export function useAdminProfileEmails(userIds: string[] | undefined) {
  const deduped = userIds && userIds.length > 0 ? Array.from(new Set(userIds)) : undefined;

  return useQuery({
    queryKey: ['admin-profile-emails', deduped],
    enabled: !!deduped && deduped.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await (supabase as any).rpc('admin_get_profile_emails', {
        user_ids: deduped,
      });
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of data || []) {
        if (row.user_id && row.email) {
          map.set(row.user_id as string, (row.email as string).toLowerCase());
        }
      }
      return map;
    },
  });
}
