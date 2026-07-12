import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConvivialitePhotos, type ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';

export interface GardenEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  lieu: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  event_type: string | null;
  category: string | null;
  exploration_id: string | null;
  public_slug: string | null;
  is_public: boolean | null;
}

export interface StrataMetrics {
  trees: number;
  plants: number;
  insects: number;
  birds: number;
  fungi: number;
  others: number;
  total: number;
  // qualitative derivations
  mycorhization: number;   // 0-100 %
  pollinators: number;     // 0-100 %
  microfauna: number;      // 0-100 %
  carbon: 'Faible' | 'Moyen' | 'Élevé';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useGardenEvent(slugOrId: string | undefined) {
  return useQuery({
    queryKey: ['garden-event', slugOrId],
    enabled: !!slugOrId,
    queryFn: async (): Promise<GardenEvent | null> => {
      if (!slugOrId) return null;
      const isUuid = UUID_RE.test(slugOrId);
      const q = (supabase as any)
        .from('marche_events')
        .select('id,title,description,date_marche,lieu,latitude,longitude,cover_image_url,event_type,category,exploration_id,public_slug,is_public');
      const { data, error } = await (isUuid ? q.eq('id', slugOrId) : q.eq('public_slug', slugOrId)).maybeSingle();
      if (error) throw error;
      return (data ?? null) as GardenEvent | null;
    },
  });
}

function useStrataMetrics(eventId: string | undefined) {
  return useQuery({
    queryKey: ['garden-strata-metrics', eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<StrataMetrics> => {
      const empty: StrataMetrics = {
        trees: 0, plants: 0, insects: 0, birds: 0, fungi: 0, others: 0, total: 0,
        mycorhization: 0, pollinators: 0, microfauna: 0, carbon: 'Faible',
      };
      if (!eventId) return empty;
      const { data } = await (supabase as any)
        .from('biodiversity_snapshots')
        .select('birds_count,plants_count,fungi_count,others_count,total_species')
        .eq('marche_id', eventId);
      if (!data || data.length === 0) return empty;
      const agg = data.reduce((acc: any, row: any) => {
        acc.birds += row.birds_count ?? 0;
        acc.plants += row.plants_count ?? 0;
        acc.fungi += row.fungi_count ?? 0;
        acc.others += row.others_count ?? 0;
        acc.total = Math.max(acc.total, row.total_species ?? 0);
        return acc;
      }, { birds: 0, plants: 0, fungi: 0, others: 0, total: 0 });

      const trees = Math.round(agg.plants * 0.35);           // proxy strate arborée
      const insects = Math.round(agg.others * 0.6);          // majoritairement insectes dans "others"
      const pollinators = Math.min(100, Math.round((insects / Math.max(15, insects)) * 100 * (insects > 0 ? 1 : 0)));
      const mycorhization = Math.min(100, agg.fungi * 12);
      const microfauna = Math.min(100, agg.others * 6);
      const carbon: StrataMetrics['carbon'] =
        trees >= 8 ? 'Élevé' : trees >= 3 ? 'Moyen' : 'Faible';

      return {
        trees,
        plants: agg.plants,
        insects,
        birds: agg.birds,
        fungi: agg.fungi,
        others: agg.others,
        total: agg.total,
        mycorhization,
        pollinators: insects > 0 ? Math.min(100, 30 + insects * 4) : 0,
        microfauna,
        carbon,
      };
    },
  });
}

export function useGardenFiche(slug: string | undefined) {
  const eventQ = useGardenEvent(slug);
  const event = eventQ.data;
  const photosQ = useConvivialitePhotos(event?.exploration_id ?? undefined);
  const metricsQ = useStrataMetrics(event?.id);

  const heroPhotos: ConvivialitePhoto[] = (photosQ.data ?? []).filter((p) => !p.is_hidden);

  return {
    event,
    heroPhotos,
    metrics: metricsQ.data,
    isLoading: eventQ.isLoading || photosQ.isLoading || metricsQ.isLoading,
    notFound: !eventQ.isLoading && !event,
  };
}
