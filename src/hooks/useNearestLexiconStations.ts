import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchLexiconParcelData } from '@/utils/lexiconApi';
import {
  resolveStationCoordinates,
  type ResolvedStationCoords,
} from '@/utils/weatherStationResolver';

export interface MarchePointInput {
  id: string;
  latitude: number;
  longitude: number;
}

export interface ParsedStation {
  code: string;
  name: string;
  city?: string | null;
  postalCode?: string | null;
}

export interface PointStation {
  pointId: string;
  station: ParsedStation | null;
}

const parseStationFromLexicon = (raw: any): ParsedStation | null => {
  const value: string | undefined =
    raw?.['last-year-weather-reports']?.station?.value ??
    raw?._raw?.['last-year-weather-reports']?.station?.value;
  if (!value || typeof value !== 'string') return null;
  const m = value.match(/^(.+?)\s+(\d{8})$/);
  if (!m) return null;
  const city =
    raw?.information?.city?.value ?? raw?._raw?.information?.city?.value ?? null;
  const postalCode =
    raw?.information?.['postal-code']?.value ??
    raw?._raw?.information?.['postal-code']?.value ??
    null;
  return { name: m[1].trim(), code: m[2], city, postalCode };
};

export const useNearestLexiconStations = (points: MarchePointInput[]) => {
  const queries = useQueries({
    queries: points.map((p) => ({
      queryKey: ['lexicon-station', p.latitude, p.longitude],
      queryFn: async () => {
        const res = await fetchLexiconParcelData(p.latitude, p.longitude);
        // Return raw response so we can dig into _raw
        return res;
      },
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      retry: 1,
      enabled: Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
    })),
  });

  const pointStations: PointStation[] = points.map((p, i) => {
    const data = queries[i]?.data as any;
    const raw = data?.data ?? data;
    return { pointId: p.id, station: parseStationFromLexicon(raw) };
  });

  const isLoading = queries.some((q) => q.isLoading);

  // Resolve unique station coordinates
  const uniqueCodes = Array.from(
    new Map(
      pointStations
        .filter((ps) => ps.station)
        .map((ps) => [ps.station!.code, ps.station!])
    ).values()
  );

  const [resolved, setResolved] = useState<Record<string, ResolvedStationCoords>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const s of uniqueCodes) {
        if (resolved[s.code]) continue;
        const r = await resolveStationCoordinates(s);
        if (cancelled) return;
        if (r) setResolved((prev) => ({ ...prev, [s.code]: r }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueCodes.map((s) => s.code).join('|')]);

  return { pointStations, resolved, isLoading };
};
