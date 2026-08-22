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
  /** Nombre total de sondes liées à la propriété. */
  capteurs_count?: number;
  /** Sondes en service et actives (hors maintenance). */
  capteurs_actifs?: number;
  /** Sondes déclarées en maintenance. */
  capteurs_maintenance?: number;
}

/** Fabricant de sondes dont l'utilisateur est partenaire habilité (ou admin). */
export interface PartenaireIotAccess {
  id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
  capteurs_count: number;
  /** Sondes en service (hors maintenance). */
  capteurs_actifs?: number;
  /** Sondes déclarées en maintenance. */
  capteurs_maintenance?: number;
}

export interface UserAppsAccess {
  hasMarcheurAccess: boolean;
  proprietesAccessibles: ProprieteAccess[];
  proprietePrincipaleId: string | null;
  partenairesIot: PartenaireIotAccess[];
}

export const useUserAppsAccess = (userId?: string) => {
  return useQuery<UserAppsAccess>({
    queryKey: ['user-apps-access', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_apps_access');
      if (error) throw error;
      const raw = (data as any) ?? {};
      return {
        hasMarcheurAccess: !!raw.hasMarcheurAccess,
        proprietesAccessibles: (raw.proprietesAccessibles ?? []) as ProprieteAccess[],
        proprietePrincipaleId: raw.proprietePrincipaleId ?? null,
        partenairesIot: (raw.partenairesIot ?? []) as PartenaireIotAccess[],
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
