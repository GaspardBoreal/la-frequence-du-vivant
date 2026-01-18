import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface XenoCantoRecording {
  id: string;
  url: string;
  file: string;
  file_name: string;
  sono: {
    small: string;
    med: string;
    large: string;
    full: string;
  };
  rec: string;
  loc: string;
  length: string;
  q: string;
  type: string;
  date: string;
}

export interface XenoCantoResponse {
  recordings: XenoCantoRecording[];
  numRecordings: number;
}

/**
 * Hook to fetch audio recordings from Xeno-Canto API via Edge Function
 * Only works for birds and some other animals with vocalizations
 */
export const useSpeciesXenoCanto = (scientificName: string | undefined, kingdom: string = 'Unknown') => {
  return useQuery({
    queryKey: ['xeno-canto', scientificName],
    queryFn: async (): Promise<XenoCantoResponse | null> => {
      if (!scientificName) return null;

      // Xeno-Canto is primarily for birds, but also has some amphibians and insects
      // Skip if it's clearly a plant or fungus
      const lowerKingdom = kingdom.toLowerCase();
      if (lowerKingdom.includes('plant') || lowerKingdom === 'plantae' || lowerKingdom.includes('fung')) {
        return null;
      }

      try {
        // Call Edge Function to avoid CORS issues
        const { data, error } = await supabase.functions.invoke('xeno-canto', {
          body: { scientificName },
        });

        if (error) {
          console.warn('Xeno-Canto Edge Function error:', error);
          return null;
        }

        if (!data?.recordings?.length) {
          return null;
        }

        return {
          recordings: data.recordings,
          numRecordings: data.numRecordings || 0,
        };
      } catch (error) {
        console.warn('Error fetching Xeno-Canto data:', error);
        return null;
      }
    },
    enabled: !!scientificName,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: 1,
  });
};
