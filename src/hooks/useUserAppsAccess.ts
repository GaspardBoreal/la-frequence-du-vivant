import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProprieteAccess {
  id: string;
  nom: string;
  slug: string;
  ville: string | null;
  photo_hero_url: string | null;
  role: string;
  is_main: boolean;
}

export interface UserAppsAccess {
  hasMarcheurAccess: boolean;
  proprietesAccessibles: ProprieteAccess[];
  proprietePrincipaleId: string | null;
}

export const useUserAppsAccess = (userId?: string) => {
  return useQuery<UserAppsAccess>({
    queryKey: ['user-apps-access', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_apps_access');
      if (error) throw error;
      return (data as unknown as UserAppsAccess) ?? {
        hasMarcheurAccess: false,
        proprietesAccessibles: [],
        proprietePrincipaleId: null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
