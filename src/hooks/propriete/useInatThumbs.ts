import { useQueries, useQuery } from '@tanstack/react-query';

export interface InatTaxonThumb {
  scientificName: string;
  commonName: string | null;
  photoUrl: string | null;
  rank: string | null;
  taxonId: number | null;
}

const cleanUrl = (u?: string | null) =>
  u ? u.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg') : null;

async function fetchTaxon(name: string): Promise<InatTaxonThumb> {
  const empty: InatTaxonThumb = { scientificName: name, commonName: null, photoUrl: null, rank: null, taxonId: null };
  if (!name) return empty;
  try {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(name)}&per_page=1&locale=fr&all_names=false`,
    );
    if (!res.ok) return empty;
    const json = await res.json();
    const t = json?.results?.[0];
    if (!t) return empty;
    return {
      scientificName: t.name || name,
      commonName: t.preferred_common_name || null,
      photoUrl: cleanUrl(t.default_photo?.medium_url || t.default_photo?.square_url),
      rank: t.rank || null,
      taxonId: t.id ?? null,
    };
  } catch {
    return empty;
  }
}

/** Vignettes iNaturalist pour un lot de noms scientifiques (cache long). */
export function useInatThumbs(names: string[]) {
  const unique = Array.from(new Set(names.filter(Boolean))).slice(0, 60);
  const results = useQueries({
    queries: unique.map((n) => ({
      queryKey: ['inat-taxon-thumb', n],
      queryFn: () => fetchTaxon(n),
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24,
    })),
  });
  const map = new Map<string, InatTaxonThumb>();
  unique.forEach((n, i) => {
    const d = results[i]?.data;
    if (d) map.set(n, d);
  });
  return { map, loading: results.some((r) => r.isLoading) };
}

/** Recherche d'espèce à la volée (ajout libre dans l'herbier). */
export function useInatSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ['inat-taxa-search', q],
    enabled: q.length >= 3,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<InatTaxonThumb[]> => {
      const res = await fetch(
        `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&per_page=8&locale=fr`,
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json?.results || []).map((t: any) => ({
        scientificName: t.name,
        commonName: t.preferred_common_name || null,
        photoUrl: cleanUrl(t.default_photo?.medium_url || t.default_photo?.square_url),
        rank: t.rank || null,
        taxonId: t.id ?? null,
      }));
    },
  });
}
