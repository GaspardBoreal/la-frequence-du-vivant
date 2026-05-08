import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventTestimony {
  id: string;
  event_id: string;
  user_id: string;
  author_name: string;
  quote: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  marche_event?: { id: string; title: string | null; date_marche: string | null } | null;
}

/**
 * Fetch testimonies for all events of an exploration (Synthèse view).
 */
export function useExplorationTestimonies(explorationId: string | undefined) {
  return useQuery({
    queryKey: ['exploration-testimonies', explorationId],
    enabled: !!explorationId,
    queryFn: async (): Promise<EventTestimony[]> => {
      const { data: events, error: evErr } = await supabase
        .from('marche_events')
        .select('id, title, date_marche')
        .eq('exploration_id', explorationId!);
      if (evErr) throw evErr;
      const ids = (events || []).map((e) => e.id);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('event_testimonies')
        .select('*')
        .in('event_id', ids)
        .order('display_order', { ascending: true });
      if (error) throw error;

      const evMap = new Map(events!.map((e) => [e.id, e]));
      return (data || []).map((t) => ({
        ...t,
        marche_event: evMap.get(t.event_id) || null,
      })) as EventTestimony[];
    },
  });
}

export function useUpdateTestimony() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; quote?: string; is_published?: boolean }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('event_testimonies').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exploration-testimonies'] }),
  });
}
