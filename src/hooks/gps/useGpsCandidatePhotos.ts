import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';

export interface CandidatePhoto {
  url: string;
  /** 'observation' = cliché exact du point ; 'species' = photo générique d'espèce */
  kind: 'observation' | 'species';
  inatUrl?: string | null;
}

interface PhotoInput {
  id: string;
  scientificName?: string | null;
  photoUrl?: string | null;
  originalUrl?: string | null;
  inatObservationId?: string | null;
}

/** Extrait l'id d'observation iNaturalist depuis une URL ou un id brut. */
export function inatObsId(c: PhotoInput): string | null {
  if (c.inatObservationId && /^\d+$/.test(String(c.inatObservationId))) {
    return String(c.inatObservationId);
  }
  const m = (c.originalUrl || '').match(/observations\/(\d+)/);
  return m ? m[1] : null;
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Résout une photo par point de curation GPS, en cascade :
 *   1. photo de l'observation marcheur (déjà en base)
 *   2. photo réelle de l'observation iNaturalist (API publique, batch + cache 1 h)
 *   3. photo générique de l'espèce (species_thumb_cache)
 *
 * Les snapshots iNat ne stockent pas de photo : sans l'étape 2, les points
 * citoyens resteraient sans visuel dans la console.
 */
export function useGpsCandidatePhotos(candidates: PhotoInput[]) {
  const ids = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) {
      if (c.photoUrl) continue;
      const id = inatObsId(c);
      if (id) set.add(id);
    }
    return Array.from(set).sort();
  }, [candidates]);

  const batches = useMemo(() => chunk(ids, 30), [ids]);

  const queries = useQueries({
    queries: batches.map((batch) => ({
      queryKey: ['inat-obs-photos', batch.join(',')],
      staleTime: 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      queryFn: async (): Promise<Record<string, string>> => {
        const res = await fetch(
          `https://api.inaturalist.org/v1/observations?id=${batch.join(',')}&per_page=200`,
        );
        if (!res.ok) return {};
        const json = await res.json();
        const out: Record<string, string> = {};
        for (const o of json?.results || []) {
          const raw: string | undefined = o?.photos?.[0]?.url;
          if (raw) out[String(o.id)] = raw.replace('square', 'medium');
        }
        return out;
      },
    })),
  });

  const obsPhotos = useMemo(() => {
    const m: Record<string, string> = {};
    for (const q of queries) Object.assign(m, q.data || {});
    return m;
  }, [queries]);

  const names = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.scientificName).filter(Boolean) as string[])),
    [candidates],
  );
  const thumbs = useSpeciesThumbs(names);

  const photoFor = useMemo(() => {
    const map = new Map<string, CandidatePhoto>();
    const thumbData = thumbs.data as Map<string, { photo_url: string | null }> | undefined;
    for (const c of candidates) {
      const inatUrl = c.originalUrl || null;
      if (c.photoUrl) {
        map.set(c.id, { url: c.photoUrl, kind: 'observation', inatUrl });
        continue;
      }
      const id = inatObsId(c);
      if (id && obsPhotos[id]) {
        map.set(c.id, { url: obsPhotos[id], kind: 'observation', inatUrl });
        continue;
      }
      const thumb = thumbData?.get((c.scientificName || '').trim().toLowerCase());
      if (thumb?.photo_url) {
        map.set(c.id, { url: thumb.photo_url, kind: 'species', inatUrl });
      }
    }
    return map;
  }, [candidates, obsPhotos, thumbs.data]);

  return { photoFor, isLoading: queries.some((q) => q.isLoading) || thumbs.isLoading };
}
