import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BbchCrop, BbchStage } from '@/lib/bbchStages';

export interface BbchSuggestion {
  cached: boolean;
  macro: number | null;
  confidence: number;
  rationale: string;
  alternative_macro: number | null;
  unknown: boolean;
}

interface Args {
  crop: BbchCrop;
  stages: BbchStage[];
  scientificName: string;
  photoUrl?: string | null;
  enabled?: boolean;
}

/**
 * Suggère le stade BBCH le plus probable pour une photo + culture donnée.
 * Cache serveur (table pheno_ai_suggestions) + cache react-query côté client.
 */
export function useBbchStageSuggestion({
  crop,
  stages,
  scientificName,
  photoUrl,
  enabled = true,
}: Args) {
  return useQuery<BbchSuggestion>({
    queryKey: ['bbch-suggestion', crop.key, photoUrl],
    enabled: enabled && !!photoUrl,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 0,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('suggest-bbch-stage', {
        body: {
          crop_key: crop.key,
          crop_label_fr: crop.labelFr,
          scientific_name: scientificName,
          ontology_uri: crop.ontologyUri,
          photo_url: photoUrl,
          stages: stages.map((s) => ({
            macro: s.macro,
            emoji: s.emoji,
            labelFr: s.labelFr,
            uri: s.uri,
          })),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as BbchSuggestion;
    },
  });
}
