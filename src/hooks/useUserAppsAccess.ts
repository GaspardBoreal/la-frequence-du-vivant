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

/**
 * Filet de rattrapage Fréquence Jardin : si le compte porte les métadonnées OFJ
 * mais qu'aucune propriété n'est accessible (confirmation ouverte ailleurs que
 * sur /jardin/bienvenue), on matérialise le jardin une seule fois.
 */
const claimFrequenceJardinIfNeeded = async (): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  const meta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.app !== 'frequence-jardin') return false;

  const { data, error } = await supabase.rpc('onboard_claim_from_metadata');
  if (error) {
    console.warn('[useUserAppsAccess] claim OFJ échoué', error.message);
    return false;
  }
  const result = (data ?? {}) as { slug?: string; created?: boolean };
  return !!result.slug;
};

export const useUserAppsAccess = (userId?: string) => {
  return useQuery<UserAppsAccess>({
    queryKey: ['user-apps-access', userId],
    queryFn: async () => {
      const fetchAccess = async () => await supabase.rpc('get_user_apps_access');

      let { data, error } = await fetchAccess();
      if (error) {
        // Résilience : ne jamais bloquer l'écran de connexion si l'agrégat échoue
        console.error('[useUserAppsAccess] RPC error', error);
        return {
          hasMarcheurAccess: true,
          proprietesAccessibles: [],
          proprietePrincipaleId: null,
          partenairesIot: [],
        };
      }

      let raw = (data as any) ?? {};
      if (((raw.proprietesAccessibles ?? []) as unknown[]).length === 0) {
        const claimed = await claimFrequenceJardinIfNeeded();
        if (claimed) {
          const retry = await fetchAccess();
          if (!retry.error) raw = (retry.data as any) ?? raw;
        }
      }

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

