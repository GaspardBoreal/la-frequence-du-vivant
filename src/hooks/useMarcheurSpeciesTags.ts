import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MarcheurSpeciesTag {
  id: string;
  scientific_name: string;
  marche_id: string | null;
  label: string;
  color_hash: number;
  created_at: string;
}

const TAG_PALETTE = [
  'hsl(165 80% 24%)', // emerald deep
  'hsl(43 60% 55%)',  // gold
  'hsl(13 75% 56%)',  // ember
  'hsl(115 25% 51%)', // sage
  'hsl(265 50% 70%)', // lavender
  'hsl(190 75% 60%)', // sky
];

export function getTagColor(colorHash: number): string {
  return TAG_PALETTE[Math.max(0, Math.min(5, colorHash))] || TAG_PALETTE[0];
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Fetches all tags of the current user matching the provided species + marche scope.
 * Pass scientificNames to scope the query to the visible species.
 */
export function useMarcheurSpeciesTags(
  scientificNames: string[],
  marcheIds?: string[]
) {
  const queryKey = ['marcheur-species-tags', [...new Set(scientificNames)].sort(), [...(marcheIds || [])].sort()];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<MarcheurSpeciesTag[]> => {
      if (!scientificNames.length) return [];
      const { data, error } = await supabase.rpc('get_my_marcheur_tags_for_species', {
        _scientific_names: scientificNames,
        _marche_ids: marcheIds && marcheIds.length ? marcheIds : null,
      });
      if (error) throw error;
      return (data || []) as MarcheurSpeciesTag[];
    },
    staleTime: 60_000,
  });
}

/**
 * Indexed map: normalized scientific name -> array of tags.
 * Filters down to global tags + tags scoped to the optional marcheId.
 */
export function indexTagsBySpecies(
  tags: MarcheurSpeciesTag[] | undefined,
  marcheId?: string | null
): Map<string, MarcheurSpeciesTag[]> {
  const m = new Map<string, MarcheurSpeciesTag[]>();
  (tags || []).forEach((t) => {
    if (marcheId !== undefined && marcheId !== null) {
      // keep global + matching marche
      if (t.marche_id !== null && t.marche_id !== marcheId) return;
    }
    const k = norm(t.scientific_name);
    const arr = m.get(k) || [];
    arr.push(t);
    m.set(k, arr);
  });
  return m;
}

export function useUpsertMarcheurTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      scientificName: string;
      label: string;
      marcheId?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('upsert_marcheur_species_tag', {
        _scientific_name: params.scientificName,
        _label: params.label,
        _marche_id: params.marcheId ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcheur-species-tags'] });
      qc.invalidateQueries({ queryKey: ['marcheur-tag-suggestions'] });
    },
    onError: (e: any) => {
      toast({ title: 'Tag non enregistré', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMarcheurTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.rpc('delete_marcheur_species_tag', { _tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcheur-species-tags'] });
      qc.invalidateQueries({ queryKey: ['marcheur-tag-suggestions'] });
    },
  });
}

/**
 * Suggestions: top labels the marcheur has used most often.
 */
export function useMarcheurTagSuggestions(limit = 8) {
  return useQuery({
    queryKey: ['marcheur-tag-suggestions', limit],
    queryFn: async (): Promise<{ label: string; count: number; color_hash: number }[]> => {
      const { data, error } = await supabase
        .from('marcheur_species_tags')
        .select('label,color_hash')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const counts = new Map<string, { label: string; count: number; color_hash: number }>();
      (data || []).forEach((row: any) => {
        const k = norm(row.label);
        const ex = counts.get(k);
        if (ex) ex.count++;
        else counts.set(k, { label: row.label, count: 1, color_hash: row.color_hash });
      });
      return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    staleTime: 60_000,
  });
}

export { norm as normalizeTagKey };
