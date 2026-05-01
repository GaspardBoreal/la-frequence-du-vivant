import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FrenchNameResolution {
  /** Best French display name (FR translation if available, else original common name, else scientific name) */
  displayName: string;
  /** French translation when present in species_translations, else null */
  commonNameFr: string | null;
}

/**
 * Centralised resolver for French species names.
 *
 * Reads the public `species_translations` table (RLS allows anonymous SELECT)
 * once for the full list and returns a stable Map keyed by scientific name.
 *
 * Used by exploration views (L'œil, Empreinte → Taxons observés…) so that
 * every downstream component (cards, modals, exports) sees a `displayName`
 * already in French — mirroring what the Bioacoustique view delivers.
 */
export const useFrenchSpeciesNames = (
  species: Array<{ scientificName: string | null | undefined; commonName?: string | null }>
) => {
  const { language } = useLanguage();

  // Stable, deduplicated, sorted list of scientific names → stable queryKey
  const sciNames = Array.from(
    new Set(
      species
        .map(s => (s.scientificName || '').trim())
        .filter(Boolean)
    )
  ).sort();

  // Original commonName lookup, indexed by scientific name (used as fallback)
  const originalByName = new Map<string, string | null>();
  species.forEach(s => {
    const sci = (s.scientificName || '').trim();
    if (!sci) return;
    if (!originalByName.has(sci)) {
      originalByName.set(sci, s.commonName?.toString().trim() || null);
    }
  });

  return useQuery({
    queryKey: ['fr-species-names', language, sciNames],
    queryFn: async (): Promise<Map<string, FrenchNameResolution>> => {
      const map = new Map<string, FrenchNameResolution>();

      const buildFallback = (sci: string): FrenchNameResolution => {
        const original = originalByName.get(sci);
        return {
          displayName: original || sci,
          commonNameFr: null,
        };
      };

      if (sciNames.length === 0) return map;

      // English: skip DB lookup, return originals
      if (language === 'en') {
        sciNames.forEach(sci => map.set(sci, buildFallback(sci)));
        return map;
      }

      // Single batch query — RLS policy "Anyone can view species translations" is public
      const { data, error } = await supabase
        .from('species_translations')
        .select('scientific_name, common_name_fr')
        .in('scientific_name', sciNames);

      if (error) {
        console.warn('[useFrenchSpeciesNames] DB query failed, falling back to originals', error);
        sciNames.forEach(sci => map.set(sci, buildFallback(sci)));
        return map;
      }

      const frByName = new Map<string, string>();
      (data || []).forEach(row => {
        if (row.scientific_name && row.common_name_fr) {
          frByName.set(row.scientific_name, row.common_name_fr);
        }
      });

      sciNames.forEach(sci => {
        const fr = frByName.get(sci) || null;
        const original = originalByName.get(sci);
        map.set(sci, {
          displayName: fr || original || sci,
          commonNameFr: fr,
        });
      });

      return map;
    },
    enabled: sciNames.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
};
