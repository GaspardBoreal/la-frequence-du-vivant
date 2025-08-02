
import { useQuery } from '@tanstack/react-query';
import { fetchLexiconParcelData } from '../utils/lexiconApi';
import { LexiconApiResponse } from '../types/lexicon';

export const useLexiconData = (latitude: number, longitude: number) => {
  return useQuery<LexiconApiResponse>({
    queryKey: ['lexicon-parcel', latitude, longitude],
    queryFn: () => fetchLexiconParcelData(latitude, longitude),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: Boolean(latitude && longitude),
  });
};
