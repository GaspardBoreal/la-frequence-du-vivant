import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyFloraState {
  skip_bioindication: boolean;
  observed_plants: string[];
  flora_conclusion?: string | null;
  concordance: Record<string, any>;
  icg_score?: number | null;
  notes?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

const EMPTY: PropertyFloraState = {
  skip_bioindication: false,
  observed_plants: [],
  flora_conclusion: '',
  concordance: {},
  icg_score: null,
  notes: '',
  completed_at: null,
  updated_at: null,
};

export function usePropertyFlora(proprieteId?: string) {
  const qc = useQueryClient();
  const query = useQuery<PropertyFloraState>({
    queryKey: ['propriete-flora', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_flora_diagnostics' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = (data as any) || {};
      return {
        skip_bioindication: !!row.skip_bioindication,
        observed_plants: row.observed_plants ?? [],
        flora_conclusion: row.flora_conclusion ?? '',
        concordance: row.concordance ?? {},
        icg_score: row.icg_score ?? null,
        notes: row.notes ?? '',
        completed_at: row.completed_at ?? null,
        updated_at: row.updated_at ?? null,
      };
    },
  });

  const [local, setLocal] = useState<PropertyFloraState>(EMPTY);
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
    async (state: PropertyFloraState, completed = false, targetId?: string) => {
      const id = targetId ?? proprieteId;
      if (!id || id !== proprieteId) return;
      setSaving(true);
      const { error } = await supabase.rpc('upsert_propriete_flora' as any, {
        p_propriete_id: id,
        p_skip_bioindication: state.skip_bioindication,
        p_observed_plants: state.observed_plants,
        p_flora_conclusion: state.flora_conclusion ?? null,
        p_concordance: state.concordance as any,
        p_icg_score: state.icg_score ?? null,
        p_notes: state.notes ?? null,
        p_completed: completed ? true : null,
      });
      setSaving(false);
      if (error) throw error;
      setSavedAt(new Date().toISOString());
      if (completed) {
        setLocal((s) => ({ ...s, completed_at: new Date().toISOString() }));
      }
      qc.invalidateQueries({ queryKey: ['propriete-flora', id] });
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
    setField: <K extends keyof PropertyFloraState>(k: K, v: PropertyFloraState[K]) =>
      setLocal((s) => ({ ...s, [k]: v })),
    togglePlant: (id: string) =>
      setLocal((s) => {
        const cur = new Set(s.observed_plants ?? []);
        cur.has(id) ? cur.delete(id) : cur.add(id);
        return { ...s, observed_plants: Array.from(cur) };
      }),
    markComplete: () => persist(local, true),
  };
}
