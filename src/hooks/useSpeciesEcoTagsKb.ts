import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EcoFunction } from '@/lib/ecologicalFunctions';

export interface SpeciesKbEntry {
  scientific_name: string;
  tags: EcoFunction[];
  confidence: number;
  source: 'curator' | 'ai' | 'expert' | 'seed';
  validations_count: number;
}

/** Lit la KB pour une liste de noms scientifiques (batch). */
export const useSpeciesEcoTagsKb = (scientificNames: string[]) => {
  // Stable key : on trie pour éviter de re-fetch sur réordonnancement
  const sortedKey = [...new Set(scientificNames.filter(Boolean))].sort();
  return useQuery({
    queryKey: ['species-eco-tags-kb', sortedKey],
    queryFn: async (): Promise<Map<string, SpeciesKbEntry>> => {
      if (sortedKey.length === 0) return new Map();
      const { data, error } = await supabase
        .from('species_eco_tags_kb' as any)
        .select('scientific_name, tags, confidence, source, validations_count')
        .in('scientific_name', sortedKey);
      if (error) throw error;
      const m = new Map<string, SpeciesKbEntry>();
      ((data as any[]) || []).forEach((r) => {
        m.set(r.scientific_name, r as SpeciesKbEntry);
      });
      return m;
    },
    enabled: sortedKey.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/** Bulk classify by AI : appelle l'edge function et upsert dans la KB. */
export const useClassifySpeciesAI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (species: Array<{
      scientific_name: string;
      common_name?: string | null;
      family?: string | null;
      iconic_taxon?: string | null;
    }>) => {
      const { data, error } = await supabase.functions.invoke('classify-species-eco-tags', {
        body: { species },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as {
        classified: Array<{ scientific_name: string; tags: EcoFunction[]; confidence: number }>;
        auto_validated: number;
        suggestions: Array<{ scientific_name: string; tags: EcoFunction[]; confidence: number }>;
        skipped_existing: number;
        total_processed: number;
      };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['species-eco-tags-kb'] });
      qc.invalidateQueries({ queryKey: ['exploration-curations'] });
      const msg = data.auto_validated > 0
        ? `✨ ${data.auto_validated} espèce${data.auto_validated > 1 ? 's' : ''} auto-classée${data.auto_validated > 1 ? 's' : ''} par l'IA`
        : 'Analyse IA terminée';
      const sub = data.suggestions.length > 0
        ? ` · ${data.suggestions.length} suggestion${data.suggestions.length > 1 ? 's' : ''} à confirmer`
        : '';
      toast.success(msg + sub);
    },
    onError: (e: any) => {
      toast.error(e.message || 'Erreur classification IA');
    },
  });
};

/** Valide manuellement les tags d'une espèce dans la KB globale (curateurs). */
export const useValidateSpeciesTagsKb = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { scientific_name: string; tags: EcoFunction[] }) => {
      const { data, error } = await supabase.rpc('validate_species_eco_tags' as any, {
        _scientific_name: params.scientific_name,
        _tags: params.tags,
        _source: 'curator',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['species-eco-tags-kb'] });
    },
  });
};
