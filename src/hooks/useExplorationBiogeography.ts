import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { getCountry, COUNTRIES, CountryInfo } from '@/lib/countriesGeoDictionary';

export interface BiogeographyRow {
  scientific_name: string;
  native_countries: string[] | null;
  native_continents: string[] | null;
  introduced_countries: string[] | null;
  authorship: string | null;
  describer_name: string | null;
  describer_year: number | null;
  describer_country: string | null;
  describer_birth_year: number | null;
}

export interface OriginAggregate {
  country: CountryInfo;
  species: BiodiversitySpecies[];
}

export interface DescriberAggregate {
  name: string;
  year?: number;
  country?: CountryInfo;
  birthYear?: number;
  species: BiodiversitySpecies[];
}

export interface BiogeographyAggregates {
  rows: BiogeographyRow[];
  byScientificName: Map<string, BiogeographyRow>;
  origins: OriginAggregate[];          // sorted desc by count
  describers: DescriberAggregate[];    // sorted desc by count
  coverage: number;                    // 0..1
  totalSpecies: number;
  enrichedSpecies: number;
}

const EVENT_LAT_FALLBACK = 45.0; // France central fallback
const EVENT_LNG_FALLBACK = 2.5;

export function useExplorationBiogeography(
  explorationId: string | null | undefined,
  species: BiodiversitySpecies[],
  eventCentroid?: { lat: number; lng: number },
) {
  const scientificNames = useMemo(
    () => Array.from(new Set(species.map((s) => s.scientificName).filter(Boolean) as string[])),
    [species],
  );

  const query = useQuery({
    queryKey: ['exploration-biogeography', explorationId, scientificNames.length],
    queryFn: async (): Promise<BiogeographyAggregates> => {
      if (!scientificNames.length) {
        return {
          rows: [], byScientificName: new Map(), origins: [], describers: [],
          coverage: 0, totalSpecies: 0, enrichedSpecies: 0,
        };
      }
      // chunked IN query to avoid URL limits
      const chunks: string[][] = [];
      for (let i = 0; i < scientificNames.length; i += 200) chunks.push(scientificNames.slice(i, i + 200));
      const rows: BiogeographyRow[] = [];
      for (const c of chunks) {
        const { data, error } = await supabase
          .from('species_biogeography_kb' as any)
          .select('scientific_name, native_countries, native_continents, introduced_countries, authorship, describer_name, describer_year, describer_country, describer_birth_year')
          .in('scientific_name', c);
        if (!error && data) rows.push(...(data as any));
      }
      const byName = new Map<string, BiogeographyRow>();
      rows.forEach((r) => byName.set(r.scientific_name, r));

      // Aggregate origins
      const originMap = new Map<string, BiodiversitySpecies[]>();
      const describerMap = new Map<string, DescriberAggregate>();
      species.forEach((sp) => {
        if (!sp.scientificName) return;
        const row = byName.get(sp.scientificName);
        if (!row) return;
        (row.native_countries || []).forEach((iso) => {
          if (!getCountry(iso)) return;
          if (!originMap.has(iso)) originMap.set(iso, []);
          originMap.get(iso)!.push(sp);
        });
        if (row.describer_name) {
          const key = row.describer_name;
          if (!describerMap.has(key)) {
            describerMap.set(key, {
              name: row.describer_name,
              year: row.describer_year ?? undefined,
              country: row.describer_country ? getCountry(row.describer_country) : undefined,
              birthYear: row.describer_birth_year ?? undefined,
              species: [],
            });
          }
          describerMap.get(key)!.species.push(sp);
        }
      });
      const origins: OriginAggregate[] = Array.from(originMap.entries())
        .map(([iso, sps]) => ({ country: getCountry(iso)!, species: sps }))
        .sort((a, b) => b.species.length - a.species.length);
      const describers = Array.from(describerMap.values()).sort((a, b) => b.species.length - a.species.length);
      const enrichedSpecies = species.filter((s) => s.scientificName && byName.has(s.scientificName)).length;
      return {
        rows, byScientificName: byName, origins, describers,
        coverage: species.length ? enrichedSpecies / species.length : 0,
        totalSpecies: species.length, enrichedSpecies,
      };
    },
    enabled: scientificNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Background enrichment when coverage is low
  useEffect(() => {
    if (!query.data || !explorationId) return;
    if (query.data.coverage >= 0.9) return;
    if (query.isFetching) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        await supabase.functions.invoke('enrich-species-biogeography', {
          body: { explorationId, limit: 60 },
        });
        if (!cancelled) query.refetch();
      } catch (_) { /* silent */ }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.coverage, explorationId]);

  const eventPoint = eventCentroid ?? { lat: EVENT_LAT_FALLBACK, lng: EVENT_LNG_FALLBACK };

  return { ...query, eventPoint };
}
