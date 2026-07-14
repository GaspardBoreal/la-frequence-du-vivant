import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  mycorhization: number;
  pollinators: number;
  microfauna: number;
  carbon: 'Faible' | 'Moyen' | 'Élevé';
}

export interface HeroPhoto {
  id: string;
  url: string;
}

interface GardenHeroPhotoRow {
  id: string;
  url: string;
  source: string;
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

      const trees = Math.round(agg.plants * 0.35);
      const insects = Math.round(agg.others * 0.6);
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

/**
 * Photos publiques d'une fiche Jardin. On passe par une RPC SECURITY DEFINER
 * pour permettre l'affichage des médias publics d'un Jardin consulté par ID,
 * sans rendre tout l'évènement public ni ouvrir la table marcheur_medias.
 */
function useGardenHeroPhotos(eventId: string | undefined) {
  return useQuery({
    queryKey: ['garden-hero-photos', eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<HeroPhoto[]> => {
      if (!eventId) return [];
      const { data, error } = await (supabase as any).rpc('get_garden_hero_photos', {
        _event_id: eventId,
      });
      if (error) throw error;
      return ((data ?? []) as GardenHeroPhotoRow[])
        .filter((p) => p.url)
        .map((p) => ({ id: p.id, url: p.url }));
    },
  });
}

export function useGardenFiche(slug: string | undefined) {
  const eventQ = useGardenEvent(slug);
  const event = eventQ.data;
  const heroPhotosQ = useGardenHeroPhotos(event?.id);
  const metricsQ = useStrataMetrics(event?.id);

  // Merge & dedupe by URL. Ordre : cover event → RPC publique Jardin.
  const seen = new Set<string>();
  const heroPhotos: HeroPhoto[] = [];

  if (event?.cover_image_url && !seen.has(event.cover_image_url)) {
    seen.add(event.cover_image_url);
    heroPhotos.push({ id: `cover-${event.id}`, url: event.cover_image_url });
  }
  (heroPhotosQ.data ?? []).forEach((p) => {
    if (p.url && !seen.has(p.url)) {
      seen.add(p.url);
      heroPhotos.push(p);
    }
  });

  return {
    event,
    heroPhotos,
    metrics: metricsQ.data,
    isLoading: eventQ.isLoading || heroPhotosQ.isLoading || metricsQ.isLoading,
    notFound: !eventQ.isLoading && !event,
  };
}
