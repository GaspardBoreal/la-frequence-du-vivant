import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { getCountry, COUNTRIES, CountryInfo } from '@/lib/countriesGeoDictionary';

export interface BiogeographySourceRef {
  name: string;
  url: string;
  field: string;
  accessed_at: string;
}

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
  type_locality_country?: string | null;
  type_locality_label?: string | null;
  type_locality_source?: string | null;
  type_locality_confidence?: 'verified' | 'high' | 'medium' | 'low' | null;
  sources?: BiogeographySourceRef[] | null;
  native_countries_verified?: string[] | null;
  fetched_at?: string | null;
}

export interface OriginAggregate {
  country: CountryInfo;
  species: BiodiversitySpecies[];
  inferred?: boolean;
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
  origins: OriginAggregate[];          // 1 species = 1 country (type locality)
  describers: DescriberAggregate[];
  coverage: number;
  totalSpecies: number;
  enrichedSpecies: number;
}

const EVENT_LAT_FALLBACK = 45.0;
const EVENT_LNG_FALLBACK = 2.5;

/**
 * Strict origin derivation — no more guessing "first native country".
 * Returns null when no scientifically reliable origin is available.
 */
function deriveOriginIso(row: BiogeographyRow): { iso: string | null; inferred: boolean } {
  const confidence = row.type_locality_confidence;
  // Trust type_locality_country only when source pipeline has run (≥ medium)
  if (row.type_locality_country && getCountry(row.type_locality_country) && confidence && confidence !== 'low') {
    return { iso: row.type_locality_country, inferred: false };
  }
  // Strict verified natives only
  const natives = (row.native_countries_verified || []).filter((c) => getCountry(c));
  if (natives.length) return { iso: natives[0], inferred: false };
  // Low-confidence fallback to type_locality_country (describer-inferred)
  if (row.type_locality_country && getCountry(row.type_locality_country)) {
    return { iso: row.type_locality_country, inferred: true };
  }
  return { iso: null, inferred: false };
}


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
      const chunks: string[][] = [];
      for (let i = 0; i < scientificNames.length; i += 200) chunks.push(scientificNames.slice(i, i + 200));
      const rows: BiogeographyRow[] = [];
      for (const c of chunks) {
        const { data, error } = await supabase
          .from('species_biogeography_kb' as any)
          .select('scientific_name, native_countries, native_continents, introduced_countries, authorship, describer_name, describer_year, describer_country, describer_birth_year, type_locality_country, type_locality_label')
          .in('scientific_name', c);
        if (!error && data) rows.push(...(data as any));
      }
      const byName = new Map<string, BiogeographyRow>();
      rows.forEach((r) => byName.set(r.scientific_name, r));

      // Aggregate origins: ONE country per species (type locality cascade)
      const originMap = new Map<string, { species: BiodiversitySpecies[]; inferred: boolean }>();
      const describerMap = new Map<string, DescriberAggregate>();
      species.forEach((sp) => {
        if (!sp.scientificName) return;
        const row = byName.get(sp.scientificName);
        if (!row) return;
        const { iso, inferred } = deriveOriginIso(row);
        if (iso) {
          if (!originMap.has(iso)) originMap.set(iso, { species: [], inferred });
          const entry = originMap.get(iso)!;
          entry.species.push(sp);
          // if any species in this country is not inferred, mark whole country as not inferred
          if (!inferred) entry.inferred = false;
        }
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
        .map(([iso, v]) => ({ country: getCountry(iso)!, species: v.species, inferred: v.inferred }))
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
