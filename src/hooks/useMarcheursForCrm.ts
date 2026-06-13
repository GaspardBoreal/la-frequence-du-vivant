import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheurForCrm {
  id: string;
  user_id: string;
  prenom: string;
  nom: string;
  ville: string | null;
  avatar_url: string | null;
  role: string | null;
  telephone: string | null;
}

const ROLE_PRIORITY: Record<string, number> = {
  sentinelle: 0,
  ambassadeur: 1,
  eclaireur: 2,
  marcheur: 3,
};

export function useMarcheursForCrm() {
  return useQuery({
    queryKey: ['marcheurs-for-crm'],
    queryFn: async (): Promise<MarcheurForCrm[]> => {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('id, user_id, prenom, nom, ville, avatar_url, role, telephone')
        .not('user_id', 'is', null)
        .limit(1000);

      if (error) throw error;

      return (data as MarcheurForCrm[]).sort((a, b) => {
        const ra = ROLE_PRIORITY[a.role ?? 'marcheur'] ?? 9;
        const rb = ROLE_PRIORITY[b.role ?? 'marcheur'] ?? 9;
        if (ra !== rb) return ra - rb;
        return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr');
      });
    },
  });
}
