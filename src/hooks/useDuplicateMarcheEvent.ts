import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateInput {
  sourceId: string;
  title: string;
  dateMarche: string; // ISO string
}

export const useDuplicateMarcheEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, title, dateMarche }: DuplicateInput): Promise<string> => {
      const { data: source, error: fetchErr } = await supabase
        .from('marche_events')
        .select('description, event_type, lieu, latitude, longitude, max_participants, exploration_id')
        .eq('id', sourceId)
        .single();
      if (fetchErr) throw fetchErr;

      const { data: userData } = await supabase.auth.getUser();
      const createdBy = userData?.user?.id ?? null;

      const payload = {
        title: title.trim(),
        date_marche: dateMarche,
        description: source.description,
        event_type: source.event_type,
        lieu: source.lieu,
        latitude: source.latitude,
        longitude: source.longitude,
        max_participants: source.max_participants,
        exploration_id: source.exploration_id,
        created_by: createdBy,
        // id + qr_code + created_at + updated_at : DB defaults
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('marche_events')
        .insert(payload)
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      return inserted.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marche-events-paginated'] });
      qc.invalidateQueries({ queryKey: ['marche-events-stats'] });
      qc.invalidateQueries({ queryKey: ['marche-events-all'] });
      qc.invalidateQueries({ queryKey: ['marche-events-map'] });
    },
  });
};
