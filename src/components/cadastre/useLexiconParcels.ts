import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchLexiconParcelData } from '@/utils/lexiconApi';
import { supabase } from '@/integrations/supabase/client';

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
      gcTime: 60 * 60 * 1000,
      retry: 1,
    })),
  });
}

/** Récupère la géométrie réelle (Polygon GeoJSON) d'une parcelle via cadastre-proxy. */
async function fetchParcelGeometryById(parcelId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.functions.invoke('cadastre-proxy', {
      body: { parcelId },
    });
    if (error) {
      console.error('[useLexiconParcels] cadastre-proxy error', error);
      return null;
    }
    if (data?.success && data?.data) {
      // data.data est typiquement { geometry, properties } ou directement une feature/geometry
      return data.data.geometry || data.data;
    }
    return null;
  } catch (e) {
    console.error('[useLexiconParcels] cadastre-proxy invoke failed', e);
    return null;
  }
}

/** Hook composé : LEXICON puis géométrie cadastre-proxy en parallèle pour chaque point. */
export function useLexiconParcelsWithGeometry(points: CadastrePoint[], enabled: boolean) {
  const lexiconQueries = useLexiconParcels(points, enabled);

  const geometryQueries = useQueries({
    queries: points.map((p, i) => {
      const lex = lexiconQueries[i]?.data;
      const parcelId =
        (lex?.success && (lex.data?.parcel_id || lex.data?.identifiant_cadastral)) || null;
      return {
        queryKey: ['cadastre-geometry', parcelId],
        queryFn: async () => {
          const g = await fetchParcelGeometryById(parcelId as string);
          // Force retry si null (ne pas cacher d'échec en valeur stable)
          if (!g) throw new Error('cadastre-geometry-null');
          return g;
        },
        enabled: enabled && !!parcelId,
        staleTime: STALE,
        gcTime: 60 * 60 * 1000,
        retry: 2,
        retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 4000),
      };
    }),
  });

  return points.map((p, i) => ({
    point: p,
    lexicon: lexiconQueries[i]?.data?.success ? lexiconQueries[i].data.data : null,
    geometry: geometryQueries[i]?.data || null,
    isLoading: lexiconQueries[i]?.isLoading || geometryQueries[i]?.isLoading,
  }));
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
