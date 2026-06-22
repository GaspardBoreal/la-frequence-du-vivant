import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpeciesThumbRow {
  scientific_name: string;
  photo_url: string | null;
  photo_attribution: string | null;
  iconic_taxon: string | null;
  kingdom: string | null;
  common_name_fr: string | null;
  common_name_en: string | null;
  source: 'inaturalist' | 'gbif' | 'manual' | 'none';
}

function normalize(name: string | null | undefined): string {
  return (name || '').trim().toLowerCase();
}

/**
 * Pile de résolutions à déclencher en arrière-plan.
 * Plusieurs composants peuvent demander des espèces différentes en parallèle :
 * on accumule, on débounce 350 ms, puis on appelle l'edge function en un seul lot
 * (max 50 noms par appel).
 */
const pendingResolve = new Set<string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeQueryClient: ReturnType<typeof useQueryClient> | null = null;

async function flushResolve() {
  debounceTimer = null;
  if (pendingResolve.size === 0) return;
  const names = Array.from(pendingResolve).slice(0, 50);
  for (const n of names) pendingResolve.delete(n);

  try {
    const { data, error } = await supabase.functions.invoke('resolve-species-thumb', {
      body: { scientific_names: names },
    });
    if (error) {
      console.warn('[useSpeciesThumb] resolve error:', error.message);
      return;
    }
    if (activeQueryClient && data?.resolved?.length) {
      // Invalide toutes les queries species-thumb dépendantes
      activeQueryClient.invalidateQueries({ queryKey: ['species-thumb-batch'] });
      activeQueryClient.invalidateQueries({ queryKey: ['species-thumb'] });
    }
  } catch (err) {
    console.warn('[useSpeciesThumb] invoke failed:', (err as Error).message);
  }

  // S'il reste des noms en file (au-delà de 50), on relance
  if (pendingResolve.size > 0) {
    debounceTimer = setTimeout(flushResolve, 500);
  }
}

function scheduleResolve(names: string[], qc: ReturnType<typeof useQueryClient>) {
  activeQueryClient = qc;
  for (const n of names) {
    const norm = normalize(n);
    if (norm.length >= 2) pendingResolve.add(norm);
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushResolve, 350);
}

/**
 * Hook batch : lit les vignettes d'un lot d'espèces depuis la cache serveur,
 * et déclenche en arrière-plan une résolution edge function pour les manquantes.
 */
export function useSpeciesThumbs(scientificNames: Array<string | null | undefined>) {
  const qc = useQueryClient();
  const normalized = useMemo(
    () => Array.from(new Set(scientificNames.map(normalize).filter(n => n.length >= 2))).sort(),
    [scientificNames],
  );
  const key = normalized.join('|');

  const query = useQuery({
    queryKey: ['species-thumb-batch', key],
    queryFn: async (): Promise<Map<string, SpeciesThumbRow>> => {
      if (normalized.length === 0) return new Map();
      const { data, error } = await supabase.rpc('get_species_thumbs', { _names: normalized });
      if (error) {
        console.warn('[useSpeciesThumbs] rpc error:', error.message);
        return new Map();
      }
      const map = new Map<string, SpeciesThumbRow>();
      for (const row of (data || []) as SpeciesThumbRow[]) {
        map.set(row.scientific_name, row);
      }
      return map;
    },
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24, // 24h
  });

  // Déclenche la résolution edge pour ce qui manque (ou source='none' ancien)
  const triggeredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!query.data || normalized.length === 0) return;
    const missing = normalized.filter(n => {
      if (triggeredRef.current.has(n)) return false;
      const row = query.data!.get(n);
      if (!row) return true; // jamais résolu
      if (!row.photo_url && row.source === 'none') return true; // miss à re-tenter
      return false;
    });
    if (missing.length > 0) {
      for (const n of missing) triggeredRef.current.add(n);
      scheduleResolve(missing, qc);
    }
  }, [query.data, key, qc, normalized]);

  return query;
}

/**
 * Hook single — wrapper pratique pour les composants qui n'ont qu'un nom.
 */
export function useSpeciesThumb(scientificName: string | null | undefined) {
  const batch = useSpeciesThumbs(scientificName ? [scientificName] : []);
  const norm = normalize(scientificName);
  const row = batch.data?.get(norm) || null;
  return {
    data: row,
    isLoading: batch.isLoading,
    isFetching: batch.isFetching,
  };
}
