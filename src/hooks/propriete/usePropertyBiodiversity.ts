import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyEventLite {
  id: string;
  title: string | null;
  date_marche: string | null;
}

export interface PropertyBiodiversity {
  events: PropertyEventLite[];
  lastEventDate: string | null;
  lastObservationDate: string | null;
  monthsSinceLastEvent: number | null;
  speciesTotal: number;
  kingdoms: Record<string, number>;
  topSpecies: Array<{ scientific: string; common: string | null; count: number; kingdom: string | null }>;
}

export function usePropertyBiodiversity(proprieteId?: string) {
  return useQuery<PropertyBiodiversity>({
    queryKey: ['propriete-biodiversity', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_propriete_biodiversity' as any, {
        p_propriete_id: proprieteId!,
      });
      if (error) throw error;
      const r = (data as any) || {};

      const events: PropertyEventLite[] = (r.events ?? []).map((e: any) => ({
        id: e.id,
        title: e.title ?? null,
        date_marche: e.date_marche ?? null,
      }));

      const lastEventDate = r.lastEventDate ?? null;
      const lastObservationDate = r.lastObservationDate ?? null;
      const monthsSinceLastEvent = lastEventDate
        ? Math.floor((Date.now() - new Date(lastEventDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : null;

      const topSpecies = (r.topSpecies ?? []).map((sp: any) => ({
        scientific: sp.scientific,
        common: sp.common ?? null,
        count: sp.count ?? 0,
        kingdom: sp.kingdom ?? null,
      }));

      return {
        events,
        lastEventDate,
        lastObservationDate,
        monthsSinceLastEvent,
        speciesTotal: r.speciesTotal ?? 0,
        kingdoms: r.kingdoms ?? {},
        topSpecies,
      };
    },
  });
}
