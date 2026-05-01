import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GbifTaxonResult {
  key: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  kingdom: string | null;
  family: string | null;
  commonName: string | null;
  imageUrl: string | null;
}

export const useGbifTaxonSearch = (query: string) => {
  return useQuery({
    queryKey: ['gbif-taxon-search', query],
    queryFn: async (): Promise<GbifTaxonResult[]> => {
      const q = query.trim();
      if (q.length < 2) return [];
      const { data, error } = await supabase.functions.invoke('gbif-taxon-search', {
        body: null,
      });
      // invoke ne supporte pas GET avec query params, on passe par fetch direct
      if (data || error) {
        // fallback: direct fetch
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gbif-taxon-search?q=${encodeURIComponent(q)}&limit=10`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      if (!r.ok) return [];
      const j = await r.json();
      return (j.results || []) as GbifTaxonResult[];
    },
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};
