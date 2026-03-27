import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Participation {
  id: string;
  marche_event_id: string;
  validated_at: string | null;
  validation_method: string | null;
  created_at: string;
  marche_events: {
    title: string;
    date_marche: string;
    lieu: string | null;
    explorations: { name: string } | null;
  } | null;
}

export function useCommunityParticipations(userId: string | undefined) {
  return useQuery({
    queryKey: ['community-participations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('marche_participations')
        .select('id, marche_event_id, validated_at, validation_method, created_at, marche_events(title, date_marche, lieu)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Participation[];
    },
    enabled: !!userId,
  });
}

export const ROLE_CONFIG = {
  marcheur_en_devenir: {
    label: 'Marcheur en devenir',
    icon: 'Footprints' as const,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    nextRole: 'marcheur' as const,
    nextThreshold: 1,
    description: 'Inscrivez-vous à votre première marche pour devenir Marcheur',
  },
  marcheur: {
    label: 'Marcheur',
    icon: 'Footprints' as const,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    nextRole: 'eclaireur' as const,
    nextThreshold: 5,
    description: 'Participez à 5 marches pour devenir Éclaireur',
  },
  eclaireur: {
    label: 'Éclaireur',
    icon: 'Eye' as const,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    nextRole: 'ambassadeur' as const,
    nextThreshold: 10,
    description: 'Suivez une formation et participez à 10 marches pour devenir Ambassadeur',
  },
  ambassadeur: {
    label: 'Ambassadeur',
    icon: 'Heart' as const,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    nextRole: 'sentinelle' as const,
    nextThreshold: 20,
    description: 'Obtenez la certification et 20 marches pour devenir Sentinelle',
  },
  sentinelle: {
    label: 'Sentinelle',
    icon: 'Shield' as const,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    nextRole: null,
    nextThreshold: null,
    description: 'Vous êtes au sommet du parcours. Transmettez votre savoir !',
  },
} as const;

export type CommunityRoleKey = keyof typeof ROLE_CONFIG;
