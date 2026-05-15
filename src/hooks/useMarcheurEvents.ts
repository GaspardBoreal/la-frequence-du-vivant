import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheurEventRow {
  event_id: string;
  title: string;
  date_marche: string;
  lieu: string | null;
  exploration_name: string | null;
  relation: 'participant' | 'invite';
  invite_source?: 'manuel' | 'invitation';
  invited_by_prenom?: string | null;
  validated_at?: string | null;
  promoted_to_participant_at?: string | null;
}

export function useMarcheurEvents(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['marcheur-events', userId],
    enabled: !!userId && enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<MarcheurEventRow[]> => {
      const { data, error } = await supabase.functions.invoke('community-marcheur-events-list', {
        body: { user_id: userId },
      });
      if (error) throw error;
      return (data?.events ?? []) as MarcheurEventRow[];
    },
  });
}
