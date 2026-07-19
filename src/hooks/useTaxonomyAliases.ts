import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaxonomyAlias {
  id: string;
  marche_id: string | null;
  alias_key: string;
  canonical_scientific_name: string;
  canonical_common_name_fr: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const normalizeAliasKey = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Charge les alias pertinents pour une marche donnée :
 * - alias globaux (marche_id NULL)
 * - alias spécifiques à cette marche
 * Retourne une Map<alias_key normalisée, canonical>.
 */
export const useTaxonomyAliasesForMarches = (marcheIds: string[] | undefined | null) => {
  return useQuery({
    queryKey: ['taxonomy-aliases', (marcheIds || []).sort().join(',')],
    queryFn: async () => {
      const ids = (marcheIds || []).filter(Boolean);
      let query = (supabase as any).from('species_taxonomy_aliases').select('*');
      if (ids.length > 0) {
        query = query.or(`marche_id.is.null,marche_id.in.(${ids.join(',')})`);
      } else {
        query = query.is('marche_id', null);
      }
      const { data, error } = await query;
      if (error) throw error;
      const map = new Map<string, { scientificName: string; commonNameFr: string | null }>();
      // Priorité : alias spécifiques à une marche > alias globaux
      const rows = (data || []) as TaxonomyAlias[];
      rows
        .sort((a, b) => (a.marche_id ? 1 : 0) - (b.marche_id ? 1 : 0)) // globaux d'abord, spécifiques écrasent
        .forEach(r => {
          map.set(normalizeAliasKey(r.alias_key), {
            scientificName: r.canonical_scientific_name,
            commonNameFr: r.canonical_common_name_fr,
          });
        });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTaxonomyAliasesAdmin = (marcheId: string | null) => {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['taxonomy-aliases-admin', marcheId || 'global'],
    queryFn: async () => {
      let q = (supabase as any).from('species_taxonomy_aliases').select('*').order('updated_at', { ascending: false });
      if (marcheId) q = q.eq('marche_id', marcheId);
      else q = q.is('marche_id', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as TaxonomyAlias[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: {
      alias_key: string;
      canonical_scientific_name: string;
      canonical_common_name_fr?: string | null;
      reason?: string;
      notes?: string | null;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const row = {
        marche_id: marcheId,
        alias_key: normalizeAliasKey(payload.alias_key),
        canonical_scientific_name: payload.canonical_scientific_name.trim(),
        canonical_common_name_fr: payload.canonical_common_name_fr ?? null,
        reason: payload.reason || 'manual',
        notes: payload.notes ?? null,
        created_by: u.user?.id ?? null,
      };
      const { error } = await (supabase as any).rpc('upsert_species_taxonomy_alias', {
        p_marche_id: row.marche_id,
        p_alias_key: row.alias_key,
        p_canonical_scientific_name: row.canonical_scientific_name,
        p_canonical_common_name_fr: row.canonical_common_name_fr,
        p_reason: row.reason,
        p_notes: row.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taxonomy-aliases-admin'] });
      qc.invalidateQueries({ queryKey: ['taxonomy-aliases'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-pool-rpc'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-count'] });
      qc.invalidateQueries({ queryKey: ['species-observers-citizen'] });
      qc.invalidateQueries({ queryKey: ['exploration-biodiversity-summary'] });
      qc.invalidateQueries({ queryKey: ['marche-collected-data'] });
      qc.invalidateQueries({ queryKey: ['explorations-with-metrics'] });
      qc.invalidateQueries({ queryKey: ['garden-season-pool'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('species_taxonomy_aliases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taxonomy-aliases-admin'] });
      qc.invalidateQueries({ queryKey: ['taxonomy-aliases'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-pool-rpc'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-count'] });
      qc.invalidateQueries({ queryKey: ['species-observers-citizen'] });
      qc.invalidateQueries({ queryKey: ['exploration-biodiversity-summary'] });
      qc.invalidateQueries({ queryKey: ['marche-collected-data'] });
      qc.invalidateQueries({ queryKey: ['explorations-with-metrics'] });
      qc.invalidateQueries({ queryKey: ['garden-season-pool'] });
    },
  });

  return { list, upsert, remove };
};
