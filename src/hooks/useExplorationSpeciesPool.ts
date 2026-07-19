import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFrenchSpeciesNames } from './useFrenchSpeciesNames';
import { mergeGenusIntoSpecies } from '@/utils/taxonomyMerge';
import { useTaxonomyAliasesForMarches, normalizeAliasKey } from './useTaxonomyAliases';

export interface ExplorationSpecies {
  /** Stable key used as curation entity_id (scientific name preferred, fallback common name) */
  key: string;
  scientificName: string | null;
  commonName: string | null;
  /** French translation if available in species_translations, else null */
  commonNameFr: string | null;
  /** Best display name: FR translation > original commonName > scientificName */
  displayName: string;
  group: string | null;
  family: string | null;
  count: number;
  imageUrl: string | null;
}

interface RpcSpecies {
  key: string;
  scientific_name: string | null;
  common_name: string | null;
  kingdom: string | null;
  family: string | null;
  iconic_taxon: string | null;
  observations: number;
  in_snapshot: boolean;
  in_marcheur: boolean;
  last_seen: string | null;
  photos: any; // jsonb array of arrays
  attributions: any; // jsonb array of arrays
  marcheur_attrs: any; // jsonb array
}

const toMediumInat = (url: string): string =>
  url ? url.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg') : url;

const normName = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Pool d'espèces unifié — source unique de vérité, alignée strictement
 * avec `get_exploration_species_count` (Carte / Synthèse).
 *
 * Appelle la RPC `get_exploration_species_pool` qui applique exactement
 * le même filtre rayon (50 m / override / 500 m) que le compteur officiel.
 * La résolution photo (priorité marcheur → iNat attribuée marcheur → 1re iNat
 * → fallback) est calculée ici à partir des attributions renvoyées par la RPC.
 */
export const useExplorationSpeciesPool = (explorationId: string | null | undefined) => {
  // Marcheurs éditoriaux — utilisés pour matcher les attributions iNat
  // (priorité photo n°2 dans la cascade).
  const { data: crewNames } = useQuery({
    queryKey: ['exploration-marcheurs-names', explorationId],
    queryFn: async () => {
      if (!explorationId) return new Set<string>();
      const { data } = await supabase
        .from('exploration_marcheurs')
        .select('prenom, nom')
        .eq('exploration_id', explorationId);
      const set = new Set<string>();
      (data || []).forEach((c: any) => {
        const full = normName(`${c.prenom || ''} ${c.nom || ''}`);
        if (full) set.add(full);
      });
      return set;
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
  });
  // Marches liées à cette exploration (pour scoper les alias taxonomiques)
  const { data: marcheIds } = useQuery({
    queryKey: ['exploration-marche-ids', explorationId],
    queryFn: async () => {
      if (!explorationId) return [] as string[];
      const { data } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      return (data || []).map((r: any) => r.marche_id).filter(Boolean) as string[];
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
  });

  // Alias taxonomiques persistants (globaux + spécifiques à ces marches)
  const { data: aliasMap } = useTaxonomyAliasesForMarches(marcheIds);


  const rawQuery = useQuery({
    queryKey: ['exploration-species-pool-rpc', explorationId, 'v5-unified'],
    queryFn: async (): Promise<RpcSpecies[]> => {
      if (!explorationId) return [];
      const { data, error } = await supabase.rpc('get_exploration_species_pool', {
        p_exploration_id: explorationId,
      });
      if (error) throw error;
      const r = (data as any) || {};
      // eslint-disable-next-line no-console
      console.log('[species-pool] exploration=%s total=%s source=rpc', explorationId, r.total);
      return (r.species as RpcSpecies[]) || [];
    },
    enabled: !!explorationId,
    staleTime: 60 * 1000,
  });

  const raw = rawQuery.data || [];

  // Résolution photo — même cascade que l'ancienne implémentation.
  const resolveImage = (sp: RpcSpecies): string | null => {
    const crew = crewNames || new Set<string>();

    // (1) Upload direct marcheur — photo_url la plus récente
    const mAttrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
    const directMarcheur = mAttrs
      .filter(a => a?.photo_url)
      .sort((a, b) => (b.observation_date || '').localeCompare(a.observation_date || ''))[0];
    if (directMarcheur?.photo_url) return directMarcheur.photo_url;

    // (2) Photo iNat attribuée à un marcheur éditorial (par observerName)
    // (3) 1re photo snapshot (toujours dans le rayon, garanti par la RPC)
    const allAttrGroups: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
    const allPhotoGroups: any[] = Array.isArray(sp.photos) ? sp.photos : [];

    let inatViaMarcheur: { url: string; date: string } | null = null;
    let firstSnapshot: string | null = null;

    allAttrGroups.forEach((attrs, gi) => {
      if (!Array.isArray(attrs)) return;
      const photos = Array.isArray(allPhotoGroups[gi]) ? allPhotoGroups[gi] : [];
      attrs.forEach((att: any, i: number) => {
        const url = photos[i];
        if (!url) return;
        const observer = normName(att?.observerName);
        if (observer && crew.has(observer)) {
          const d = att?.date || '';
          if (!inatViaMarcheur || d > inatViaMarcheur.date) {
            inatViaMarcheur = { url: toMediumInat(url), date: d };
          }
        }
        if (firstSnapshot === null) firstSnapshot = toMediumInat(url);
      });
    });

    if (inatViaMarcheur) return (inatViaMarcheur as { url: string }).url;
    if (firstSnapshot) return firstSnapshot;
    return null;
  };

  const intermediate = raw.map<Omit<ExplorationSpecies, 'commonNameFr' | 'displayName'>>(sp => ({
    key: sp.scientific_name || sp.common_name || sp.key,
    scientificName: sp.scientific_name,
    commonName: sp.common_name,
    group: sp.kingdom || sp.iconic_taxon || null,
    family: sp.family,
    count: sp.observations || 0,
    imageUrl: resolveImage(sp),
  }));

  // Fusion taxonomique automatique : absorbe les entrées « genre seul »
  // (ex. `Lantana`) dans l'unique binomiale du genre (ex. `Lantana camara`).
  // Idempotent, appliqué à chaque lecture donc résistant aux futures synchros iNat/Pl@ntNet.
  const merged = mergeGenusIntoSpecies(intermediate as any) as typeof intermediate;

  // Enrich with French names — single batched DB lookup, cached 24h
  const { data: frMap } = useFrenchSpeciesNames(
    merged.map(s => ({ scientificName: s.scientificName, commonName: s.commonName }))
  );

  const enriched: ExplorationSpecies[] = merged.map(s => {
    const fr = s.scientificName ? frMap?.get(s.scientificName) : undefined;
    const displayName = fr?.displayName || s.commonName || s.scientificName || '';
    return {
      ...s,
      commonNameFr: fr?.commonNameFr ?? null,
      displayName,
    };
  });

  return {
    ...rawQuery,
    data: enriched,
  };
};
