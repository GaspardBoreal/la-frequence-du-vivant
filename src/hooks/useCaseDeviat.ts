import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PropertySoilState } from '@/hooks/propriete/usePropertySoil';

export interface CaseDeviatPhoto {
  id: string;
  url: string;
  testId: string;
  block: string;
  sampleLabel: string | null;
  sampleLocation: string | null;
}

export interface CaseDeviatPayload {
  soil: PropertySoilState | null;
  photos: CaseDeviatPhoto[];
  countsByTest: Record<string, number>;
  totalPhotos: number;
}

/**
 * Cas concret public — Jardin Monde DEVIAT.
 * Les photos vivent dans un bucket privé : l'edge function publique
 * `public-case-deviat` renvoie les agrégats et des URLs signées 1 h.
 */
export function useCaseDeviat() {
  return useQuery<CaseDeviatPayload>({
    queryKey: ['public-case-deviat'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('public-case-deviat');
      if (error) throw error;
      const payload = data as CaseDeviatPayload;
      return {
        soil: payload?.soil ?? null,
        photos: payload?.photos ?? [],
        countsByTest: payload?.countsByTest ?? {},
        totalPhotos: payload?.totalPhotos ?? 0,
      };
    },
  });
}

export default useCaseDeviat;
