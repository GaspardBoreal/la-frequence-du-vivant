import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFrenchSpeciesNames } from '@/hooks/useFrenchSpeciesNames';
import type { BiodiversitySpecies } from '@/types/biodiversity';

interface RpcSpecies {
  key: string;
  scientific_name: string | null;
  common_name: string | null;
  kingdom: string | null;
  family: string | null;
  iconic_taxon: string | null;
  observations: number;
  last_seen: string | null;
  photos: any;
  attributions: any;
  marcheur_attrs: any;
}

const toMediumInat = (url: string): string =>
  url ? url.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg') : url;

const normName = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const resolvePhotos = (sp: RpcSpecies): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u?: string | null) => {
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  // 1. Photos marcheurs (prioritaires), triées par date desc
  const mAttrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
  const sortedMarcheur = mAttrs
    .filter((a) => a?.photo_url)
    .sort((a, b) => (b.observation_date || '').localeCompare(a.observation_date || ''));
  for (const a of sortedMarcheur) push(a.photo_url);
  // 2. Fallback iNat
  const groups: any[] = Array.isArray(sp.photos) ? sp.photos : [];
  for (const g of groups) {
    if (Array.isArray(g)) for (const u of g) push(toMediumInat(u));
  }
  return out;
};

const mapKingdom = (k?: string | null): BiodiversitySpecies['kingdom'] => {
  const s = (k || '').toLowerCase();
  if (s.includes('plant')) return 'Plantae';
  if (s.includes('fungi')) return 'Fungi';
  if (s.includes('animal') || s.includes('aves') || s.includes('insect') || s.includes('mamm'))
    return 'Animalia';
  return 'Other';
};

/**
 * Agrège les espèces de toutes les Marches liées à une propriété via la même
 * RPC `get_exploration_species_pool` que l'app marcheurs. Fusion par nom
 * scientifique normalisé, cumul des counts, priorité photo marcheur.
 *
 * Retourne des `BiodiversitySpecies[]` prêts pour <SpeciesExplorer />.
 */
export function usePropertySpeciesPool(proprieteId: string | undefined) {
  // 1. exploration_ids liés à la propriété
  const idsQuery = useQuery({
    queryKey: ['propriete-exploration-ids', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_marche_events')
        .select('marche_events!inner(exploration_id)')
        .eq('propriete_id', proprieteId!);
      if (error) throw error;
      const ids = (data || [])
        .map((r: any) => r.marche_events?.exploration_id)
        .filter((v: any): v is string => !!v);
      return Array.from(new Set(ids));
    },
  });

  const explorationIds = idsQuery.data || [];

  // 2. Pool par exploration en parallèle
  const pools = useQueries({
    queries: explorationIds.map((id) => ({
      queryKey: ['exploration-species-pool-rpc', id, 'v5-unified'],
      staleTime: 60 * 1000,
      queryFn: async (): Promise<RpcSpecies[]> => {
        const { data, error } = await supabase.rpc('get_exploration_species_pool', {
          p_exploration_id: id,
        });
        if (error) throw error;
        return ((data as any)?.species || []) as RpcSpecies[];
      },
    })),
  });

  const poolsLoading = pools.some((q) => q.isLoading);
  const allRows = useMemo(() => pools.flatMap((q) => q.data || []), [pools]);

  // 3. Fusion multi-marches par clé scientifique normalisée
  const merged = useMemo(() => {
    const bucket = new Map<
      string,
      {
        scientific: string;
        common: string | null;
        kingdom: string | null;
        family: string | null;
        iconic: string | null;
        count: number;
        lastSeen: string | null;
        photo: string | null;
      }
    >();
    for (const sp of allRows) {
      const sci = sp.scientific_name || sp.common_name || sp.key || '';
      const key = normName(sci);
      if (!key) continue;
      const existing = bucket.get(key);
      const photo = resolvePhoto(sp);
      if (!existing) {
        bucket.set(key, {
          scientific: sci,
          common: sp.common_name,
          kingdom: sp.kingdom,
          family: sp.family,
          iconic: sp.iconic_taxon,
          count: sp.observations || 0,
          lastSeen: sp.last_seen,
          photo,
        });
      } else {
        existing.count += sp.observations || 0;
        if (!existing.common && sp.common_name) existing.common = sp.common_name;
        if (!existing.photo && photo) existing.photo = photo;
        if (!existing.family && sp.family) existing.family = sp.family;
        if (!existing.iconic && sp.iconic_taxon) existing.iconic = sp.iconic_taxon;
        if (!existing.kingdom && sp.kingdom) existing.kingdom = sp.kingdom;
        if ((sp.last_seen || '') > (existing.lastSeen || '')) existing.lastSeen = sp.last_seen;
      }
    }
    return Array.from(bucket.values());
  }, [allRows]);

  // 4. Noms français (batch unique)
  const { data: frMap } = useFrenchSpeciesNames(
    merged.map((s) => ({ scientificName: s.scientific, commonName: s.common })),
  );

  // 5. Adapter BiodiversitySpecies
  const species = useMemo<BiodiversitySpecies[]>(() => {
    return merged
      .map((s): BiodiversitySpecies => {
        const fr = s.scientific ? frMap?.get(s.scientific) : undefined;
        const display = fr?.displayName || s.common || s.scientific;
        return {
          id: s.scientific,
          scientificName: s.scientific,
          commonName: display,
          family: s.family || '',
          kingdom: mapKingdom(s.kingdom || s.iconic),
          iconicTaxon: s.iconic || undefined,
          observations: s.count,
          lastSeen: s.lastSeen || '',
          photos: s.photo ? [s.photo] : [],
          source: 'inaturalist',
          attributions: [],
        };
      })
      .sort((a, b) => b.observations - a.observations);
  }, [merged, frMap]);

  return {
    species,
    isLoading: idsQuery.isLoading || poolsLoading,
    explorationIds,
    /** Exploration la plus récente : bon candidat pour prioriser les photos terrain */
    latestExplorationId: explorationIds[0],
  };
}
