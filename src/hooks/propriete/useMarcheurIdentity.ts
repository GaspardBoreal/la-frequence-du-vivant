import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheurIdentity {
  name: string | null;
  avatarUrl: string | null;
  slug: string | null;
}

/**
 * Résout l'identité affichable d'un marcheur (nom, avatar, slug public) à
 * partir de son `exploration_marcheurs.id`, en privilégiant le profil
 * communauté quand le marcheur est rattaché à un compte.
 */
export function useMarcheurIdentity(marcheurId: string | null | undefined) {
  return useQuery({
    queryKey: ['marcheur-identity', marcheurId],
    enabled: !!marcheurId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MarcheurIdentity | null> => {
      const { data: m } = await supabase
        .from('exploration_marcheurs')
        .select('prenom, nom, avatar_url, user_id')
        .eq('id', marcheurId as string)
        .maybeSingle();
      if (!m) return null;

      let profile: any = null;
      if (m.user_id) {
        const { data } = await supabase
          .from('community_profiles')
          .select('prenom, nom, avatar_url, slug')
          .eq('user_id', m.user_id)
          .maybeSingle();
        profile = data;
      }

      const prenom = profile?.prenom ?? m.prenom ?? null;
      const nom = profile?.nom ?? m.nom ?? null;
      const name = [prenom, nom].filter(Boolean).join(' ').trim() || null;

      return {
        name,
        avatarUrl: profile?.avatar_url ?? m.avatar_url ?? null,
        slug: profile?.slug ?? null,
      };
    },
  });
}
