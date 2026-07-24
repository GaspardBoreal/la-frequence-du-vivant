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
      // 1. events attached to this property
      const { data: links } = await supabase
        .from('propriete_marche_events')
        .select('marche_event_id')
        .eq('propriete_id', proprieteId!);

      const eventIds = (links ?? []).map((l: any) => l.marche_event_id).filter(Boolean);

      let events: PropertyEventLite[] = [];
      if (eventIds.length) {
        const { data: evs } = await supabase
          .from('marche_events')
          .select('id, title, date_marche')
          .in('id', eventIds)
          .order('date_marche', { ascending: false });
        events = (evs ?? []) as PropertyEventLite[];
      }

      const lastEventDate = events.find((e) => !!e.date_marche)?.date_marche ?? null;
      const monthsSinceLastEvent = lastEventDate
        ? Math.floor((Date.now() - new Date(lastEventDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : null;

      // 2. biodiversity snapshots aggregated across events
      let speciesTotal = 0;
      const kingdoms: Record<string, number> = {};
      const speciesMap = new Map<string, { scientific: string; common: string | null; count: number; kingdom: string | null }>();

      if (eventIds.length) {
        const { data: snaps } = await (supabase as any)
          .from('biodiversity_snapshots')
          .select('species_data, kingdom, marche_event_id')
          .in('marche_event_id', eventIds)
          .limit(1000);

        ((snaps ?? []) as any[]).forEach((s: any) => {
          const list = Array.isArray(s.species_data) ? s.species_data : [];
          list.forEach((sp: any) => {
            const sci = sp?.scientificName || sp?.scientific_name;
            if (!sci) return;
            const key = sci.toLowerCase();
            const prev = speciesMap.get(key);
            const kingdom = sp?.kingdom || s.kingdom || null;
            if (prev) {
              prev.count += 1;
            } else {
              speciesMap.set(key, {
                scientific: sci,
                common: sp?.commonName || sp?.common_name || null,
                count: 1,
                kingdom,
              });
            }
            if (kingdom) kingdoms[kingdom] = (kingdoms[kingdom] ?? 0) + 1;
          });
        });
      }

      speciesTotal = speciesMap.size;
      const topSpecies = Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      return {
        events,
        lastEventDate,
        monthsSinceLastEvent,
        speciesTotal,
        kingdoms,
        topSpecies,
      };
    },
  });
}
