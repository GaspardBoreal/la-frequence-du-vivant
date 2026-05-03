import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchLexiconParcelData } from '@/utils/lexiconApi';

export interface CadastrePoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

const STALE = 5 * 60 * 1000;

/** Charge en parallèle les parcelles LEXICON pour une liste de points. */
export function useLexiconParcels(points: CadastrePoint[], enabled: boolean) {
  return useQueries({
    queries: points.map(p => ({
      queryKey: ['lexicon-parcel', p.lat, p.lng],
      queryFn: () => fetchLexiconParcelData(p.lat, p.lng),
      enabled: enabled && Number.isFinite(p.lat) && Number.isFinite(p.lng),
      staleTime: STALE,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    })),
  });
}

/** Charge une parcelle ponctuellement (clic carte / repositionnement). */
export function useLexiconParcelAt(lat: number | null, lng: number | null, enabled = true) {
  return useQuery({
    queryKey: ['lexicon-parcel', lat, lng],
    queryFn: () => fetchLexiconParcelData(lat as number, lng as number),
    enabled: enabled && lat != null && lng != null,
    staleTime: STALE,
    retry: 1,
  });
}
