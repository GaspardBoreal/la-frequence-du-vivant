import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProprieteHeroPhoto {
  id: string;
  url: string;
}

/**
 * Hero photos for a Propriété espace.
 * Aggregates:
 *   1. propriete.photo_hero_url (fallback en premier)
 *   2. cover_image_url de chaque marche_event lié
 *   3. photos publiques Jardin (RPC get_garden_hero_photos) de chaque event lié
 * Dédupliqué par URL.
 */
export function useProprieteHeroPhotos(
  proprieteId: string | undefined,
  proprieteHeroUrl?: string | null,
) {
  return useQuery({
    queryKey: ['propriete-hero-photos', proprieteId, proprieteHeroUrl],
    enabled: !!proprieteId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ProprieteHeroPhoto[]> => {
      const seen = new Set<string>();
      const out: ProprieteHeroPhoto[] = [];

      if (proprieteHeroUrl) {
        seen.add(proprieteHeroUrl);
        out.push({ id: 'propriete-hero', url: proprieteHeroUrl });
      }

      // 1. Récupérer les marche_events liés
      const { data: links } = await supabase
        .from('propriete_marche_events')
        .select('marche_event_id')
        .eq('propriete_id', proprieteId!);

      const eventIds = (links ?? []).map((l: any) => l.marche_event_id).filter(Boolean);
      if (!eventIds.length) return out;

      // 2. Covers d'événement
      const { data: evs } = await supabase
        .from('marche_events')
        .select('id, cover_image_url')
        .in('id', eventIds);

      (evs ?? []).forEach((e: any) => {
        if (e.cover_image_url && !seen.has(e.cover_image_url)) {
          seen.add(e.cover_image_url);
          out.push({ id: `cover-${e.id}`, url: e.cover_image_url });
        }
      });

      // 3. Photos publiques Jardin via RPC — pour chaque event
      const results = await Promise.all(
        eventIds.map(async (eid) => {
          const { data } = await (supabase as any).rpc('get_garden_hero_photos', {
            _event_id: eid,
          });
          return (data ?? []) as Array<{ id: string; url: string }>;
        }),
      );

      results.flat().forEach((p) => {
        if (p?.url && !seen.has(p.url)) {
          seen.add(p.url);
          out.push({ id: p.id, url: p.url });
        }
      });

      return out;
    },
  });
}
