import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurationCandidate {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  slug: string | null;
}

export interface CurationMediaContext {
  media: {
    id: string;
    url: string | null;
    date_taken: string | null;
    gps: { lat: number | null; lng: number | null; altitude: string | null; source: string };
    ai_status: string;
    ai_kingdom_hint: string | null;
  };
  marche: null | {
    id: string;
    nom_marche: string;
    date: string | null;
    latitude: number;
    longitude: number;
    radius_m: number;
    distance_m: number | null;
    out_of_radius: boolean;
  };
  event_id: string | null;
  exploration_id: string | null;
  candidates: CurationCandidate[];
  attributed: { crew_id: string; user_id: string; display_name: string } | null;
  top_suggestion: null | {
    scientific_name: string;
    common_name_fr: string | null;
    kingdom: string | null;
    confidence: number;
    provider: string;
  };
  impact: { species_already_in_marche: boolean; current_obs_count_for_species: number };
}

export function useCurationMediaContext(mediaId: string | null) {
  return useQuery<CurationMediaContext | null>({
    queryKey: ['curation-media-context', mediaId],
    enabled: !!mediaId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_curation_media_context', { p_media_id: mediaId });
      if (error) throw error;
      return data as unknown as CurationMediaContext;
    },
  });
}
