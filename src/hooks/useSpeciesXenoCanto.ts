import { useQuery } from '@tanstack/react-query';

export interface XenoCantoRecording {
  id: string;
  url: string;
  file: string;
  sono: {
    small: string;
    med: string;
    large: string;
    full: string;
  };
  recordist: string;
  country: string;
  locality: string;
  length: string;
  quality: string;
  type: string;
  date: string;
}

interface XenoCantoResponse {
  recordings: XenoCantoRecording[];
  numRecordings: number;
}

/**
 * Hook to fetch audio recordings from Xeno-Canto API
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
        // Query Xeno-Canto API - prefer quality A recordings
        const response = await fetch(
          `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}+q:A`
        );

        if (!response.ok) {
          // Try without quality filter
          const fallbackResponse = await fetch(
            `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}`
          );
          
          if (!fallbackResponse.ok) {
            console.warn('Xeno-Canto API error:', fallbackResponse.status);
            return null;
          }
          
          const fallbackData = await fallbackResponse.json();
          
          if (!fallbackData.recordings || fallbackData.recordings.length === 0) {
            return null;
          }

          return {
            recordings: fallbackData.recordings.slice(0, 3).map((rec: any) => ({
              id: rec.id,
              url: `https://xeno-canto.org/${rec.id}`,
              file: rec.file,
              sono: {
                small: rec.sono?.small || '',
                med: rec.sono?.med || '',
                large: rec.sono?.large || '',
                full: rec.sono?.full || '',
              },
              recordist: rec.rec,
              country: rec.cnt,
              locality: rec.loc,
              length: rec.length,
              quality: rec.q,
              type: rec.type,
              date: rec.date,
            })),
            numRecordings: parseInt(fallbackData.numRecordings) || 0,
          };
        }

        const data = await response.json();

        if (!data.recordings || data.recordings.length === 0) {
          // Try without quality filter if no quality A recordings
          const fallbackResponse = await fetch(
            `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.recordings?.length > 0) {
              return {
                recordings: fallbackData.recordings.slice(0, 3).map((rec: any) => ({
                  id: rec.id,
                  url: `https://xeno-canto.org/${rec.id}`,
                  file: rec.file,
                  sono: {
                    small: rec.sono?.small || '',
                    med: rec.sono?.med || '',
                    large: rec.sono?.large || '',
                    full: rec.sono?.full || '',
                  },
                  recordist: rec.rec,
                  country: rec.cnt,
                  locality: rec.loc,
                  length: rec.length,
                  quality: rec.q,
                  type: rec.type,
                  date: rec.date,
                })),
                numRecordings: parseInt(fallbackData.numRecordings) || 0,
              };
            }
          }
          return null;
        }

        return {
          recordings: data.recordings.slice(0, 3).map((rec: any) => ({
            id: rec.id,
            url: `https://xeno-canto.org/${rec.id}`,
            file: rec.file,
            sono: {
              small: rec.sono?.small || '',
              med: rec.sono?.med || '',
              large: rec.sono?.large || '',
              full: rec.sono?.full || '',
            },
            recordist: rec.rec,
            country: rec.cnt,
            locality: rec.loc,
            length: rec.length,
            quality: rec.q,
            type: rec.type,
            date: rec.date,
          })),
          numRecordings: parseInt(data.numRecordings) || 0,
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
