import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SoilSample {
  id: string;
  label: string;      // "A" "B" "C" ...
  location?: string;  // description libre du prélèvement
  photo_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** Bloc 3 · test réalisé sur ce prélèvement : 'beche' | 'stabilite' */
  structure_test?: 'beche' | 'stabilite' | null;
  /** Bloc 3 · résultat observé : 'compacte' | 'grumeleuse' | 'particulaire' */
  structure_result?: 'compacte' | 'grumeleuse' | 'particulaire' | null;
}


export interface PropertySoilState {
  terrain_status?: string | null;
  samples: SoilSample[];
  structure?: string | null;
  texture?: string | null;
  boudin_shape?: string | null;
  ph?: number | null;
  life_signs: string[];
  synthesis?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

const EMPTY: PropertySoilState = {
  terrain_status: null,
  samples: [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
  ],
  structure: null,
  texture: null,
  boudin_shape: null,
  ph: null,
  life_signs: [],
  synthesis: '',
  completed_at: null,
  updated_at: null,
};

export function usePropertySoil(proprieteId?: string) {
  const qc = useQueryClient();
  const query = useQuery<PropertySoilState>({
    queryKey: ['propriete-soil', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_soil_diagnostics' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = (data as any) || {};
      const samples = Array.isArray(row.samples) && row.samples.length > 0
        ? row.samples
        : EMPTY.samples;
      return {
        terrain_status: row.terrain_status ?? null,
        samples,
        structure: row.structure ?? null,
        texture: row.texture ?? null,
        boudin_shape: row.boudin_shape ?? null,
        ph: row.ph ?? null,
        life_signs: row.life_signs ?? [],
        synthesis: row.synthesis ?? '',
        completed_at: row.completed_at ?? null,
        updated_at: row.updated_at ?? null,
      };
    },
  });

  const [local, setLocal] = useState<PropertySoilState>(EMPTY);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (proprieteId !== loadedIdRef.current) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setLocal(EMPTY);
      setSavedAt(null);
      loadedIdRef.current = null;
    }
  }, [proprieteId]);

  useEffect(() => {
    if (!proprieteId || !query.data) return;
    if (loadedIdRef.current === proprieteId) return;
    setLocal(query.data);
    setSavedAt(query.data.updated_at ?? null);
    loadedIdRef.current = proprieteId;
  }, [proprieteId, query.data]);

  const persist = useCallback(
    async (state: PropertySoilState, completed = false, targetId?: string) => {
      const id = targetId ?? proprieteId;
      if (!id || id !== proprieteId) return;
      setSaving(true);
      const { error } = await supabase.rpc('upsert_propriete_soil' as any, {
        p_propriete_id: id,
        p_terrain_status: state.terrain_status ?? null,
        p_samples: state.samples as any,
        p_structure: state.structure ?? null,
        p_texture: state.texture ?? null,
        p_boudin_shape: state.boudin_shape ?? null,
        p_ph: state.ph ?? null,
        p_life_signs: state.life_signs ?? [],
        p_synthesis: state.synthesis ?? null,
        p_completed: completed ? true : null,
      });
      setSaving(false);
      if (error) throw error;
      setSavedAt(new Date().toISOString());
      if (completed) {
        setLocal((s) => ({ ...s, completed_at: new Date().toISOString() }));
      }
      qc.invalidateQueries({ queryKey: ['propriete-soil', id] });
    },
    [proprieteId, qc]
  );

  useEffect(() => {
    if (!proprieteId || loadedIdRef.current !== proprieteId) return;
    const targetId = proprieteId;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persist(local, false, targetId).catch(() => {});
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, proprieteId]);

  return {
    state: local,
    setLocal,
    loading: query.isLoading,
    saving,
    savedAt,
    completedAt: local.completed_at ?? null,
    setField: <K extends keyof PropertySoilState>(k: K, v: PropertySoilState[K]) =>
      setLocal((s) => ({ ...s, [k]: v })),
    toggleLifeSign: (v: string) =>
      setLocal((s) => {
        const cur = new Set(s.life_signs ?? []);
        cur.has(v) ? cur.delete(v) : cur.add(v);
        return { ...s, life_signs: Array.from(cur) };
      }),
    updateSample: (id: string, patch: Partial<SoilSample>) =>
      setLocal((s) => ({
        ...s,
        samples: s.samples.map((sm) => (sm.id === id ? { ...sm, ...patch } : sm)),
      })),
    addSample: () =>
      setLocal((s) => {
        const nextLetter = String.fromCharCode(65 + s.samples.length);
        return {
          ...s,
          samples: [...s.samples, { id: nextLetter, label: nextLetter }],
        };
      }),
    removeSample: (id: string) =>
      setLocal((s) => ({ ...s, samples: s.samples.filter((sm) => sm.id !== id) })),
    markComplete: () => persist(local, true),
  };
}
