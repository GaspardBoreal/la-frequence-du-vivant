import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FrenchNameResolution {
  /** Best French display name (FR translation if available, else original common name, else scientific name) */
  displayName: string;
  /** French translation when present in species_translations, else null */
  commonNameFr: string | null;
  /** Whether the FR name was just resolved from auto-translate (for swap UX) */
  freshlyResolved?: boolean;
}

/**
 * Centralised resolver for French species names with **auto-fill**.
 *
 * 1. Reads `species_translations` in batch (fast, RLS-public).
 * 2. For missing names, fires an opportunistic background call to the
 *    `translate-species` edge function (batch mode) which fills the shared DB
 *    cache so every user benefits going forward.
 * 3. Re-renders with the FR names as soon as they arrive (smooth EN→FR swap
 *    via `commonNameFr` in the returned map).
 *
 * Used by `<SpeciesName />` and the `useEnrichSpeciesList` helper to
 * guarantee French names appear consistently across the entire app.
 */
export const useFrenchSpeciesNamesAuto = (
  species: Array<{ scientificName: string | null | undefined; commonName?: string | null }>
) => {
  const queryClient = useQueryClient();

  // Stable, deduplicated, sorted list
  const sciNames = Array.from(
    new Set(
      species
        .map(s => (s.scientificName || '').trim())
        .filter(Boolean)
    )
  ).sort();

  // Fallback common-name lookup
  const originalByName = new Map<string, string | null>();
  species.forEach(s => {
    const sci = (s.scientificName || '').trim();
    if (!sci) return;
    if (!originalByName.has(sci)) {
      originalByName.set(sci, s.commonName?.toString().trim() || null);
    }
  });

  const queryKey = ['fr-species-names-auto', sciNames];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Map<string, FrenchNameResolution>> => {
      const map = new Map<string, FrenchNameResolution>();
      if (sciNames.length === 0) return map;

      const { data, error } = await supabase
        .from('species_translations')
        .select('scientific_name, common_name_fr')
        .in('scientific_name', sciNames);

      const frByName = new Map<string, string>();
      if (!error && data) {
        data.forEach((row: any) => {
          if (row.scientific_name && row.common_name_fr) {
            frByName.set(row.scientific_name, row.common_name_fr);
          }
        });
      }

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

  // Auto-fill missing translations in background (debounced per unique missing-set)
  const requestedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!query.data) return;
    const missing = sciNames.filter(sci => !query.data!.get(sci)?.commonNameFr);
    if (missing.length === 0) return;
    const key = missing.join('|');
    if (requestedRef.current.has(key)) return;
    requestedRef.current.add(key);

    const items = missing.map(sci => ({
      scientificName: sci,
      commonName: originalByName.get(sci) || undefined,
    }));

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('translate-species', {
          body: { items, targetLanguage: 'fr' },
        });
        if (error || !data?.translations) return;
        const newTranslations = data.translations as Record<string, string>;
        if (Object.keys(newTranslations).length === 0) return;

        // Patch the existing query cache → triggers smooth re-render
        queryClient.setQueryData<Map<string, FrenchNameResolution>>(queryKey, prev => {
          const next = new Map(prev || []);
          Object.entries(newTranslations).forEach(([sci, fr]) => {
            const existing = next.get(sci);
            if (existing && !existing.commonNameFr && fr) {
              next.set(sci, {
                displayName: fr,
                commonNameFr: fr,
                freshlyResolved: true,
              });
            }
          });
          return next;
        });
      } catch (e) {
        console.warn('[useFrenchSpeciesNamesAuto] auto-fill failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, sciNames.join('|')]);

  return query;
};
