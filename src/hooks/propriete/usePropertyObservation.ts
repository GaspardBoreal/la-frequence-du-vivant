import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyObservationState {
  answers: Record<string, string[]>;
  sensorial: Record<string, string> & { intensity?: number };
  notes?: string;
  completed_at?: string | null;
  updated_at?: string | null;
}

const EMPTY: PropertyObservationState = { answers: {}, sensorial: {}, notes: '' };

export function usePropertyObservation(proprieteId?: string) {
  const qc = useQueryClient();
  const query = useQuery<PropertyObservationState>({
    queryKey: ['propriete-observation', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_observations' as any)
        .select('answers, sensorial, notes, completed_at, updated_at')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = (data as any) || {};
      return {
        answers: row.answers ?? {},
        sensorial: row.sensorial ?? {},
        notes: row.notes ?? '',
        completed_at: row.completed_at ?? null,
        updated_at: row.updated_at ?? null,
      };
    },
  });

  const [local, setLocal] = useState<PropertyObservationState>(EMPTY);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state immediately when property changes
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

  // Hydrate once per property
  useEffect(() => {
    if (!proprieteId || !query.data) return;
    if (loadedIdRef.current === proprieteId) return;
    setLocal(query.data);
    setSavedAt(query.data.updated_at ?? null);
    loadedIdRef.current = proprieteId;
  }, [proprieteId, query.data]);

  const persist = useCallback(
    async (state: PropertyObservationState, completed = false, targetId?: string) => {
      const id = targetId ?? proprieteId;
      if (!id || id !== proprieteId) return; // anti-race: never write to a stale id
      setSaving(true);
      const { error } = await supabase.rpc('upsert_propriete_observation' as any, {
        p_propriete_id: id,
        p_answers: state.answers,
        p_sensorial: state.sensorial,
        p_notes: state.notes ?? null,
        p_completed: completed,
      });
      setSaving(false);
      if (error) throw error;
      setSavedAt(new Date().toISOString());
      if (completed) {
        setLocal((s) => ({ ...s, completed_at: new Date().toISOString() }));
      }
      qc.invalidateQueries({ queryKey: ['propriete-observation', id] });
    },
    [proprieteId, qc]
  );

  // Autosave debounced — only after hydration of the current property
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

  const toggleChoice = (blockId: string, value: string) => {
    setLocal((s) => {
      const cur = new Set(s.answers[blockId] ?? []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      return { ...s, answers: { ...s.answers, [blockId]: Array.from(cur) } };
    });
  };

  const setSensorial = (key: string, value: string | number) => {
    setLocal((s) => ({ ...s, sensorial: { ...s.sensorial, [key]: value as any } }));
  };

  const markComplete = () => persist(local, true);

  return {
    state: local,
    loading: query.isLoading,
    saving,
    savedAt,
    completedAt: local.completed_at ?? null,
    toggleChoice,
    setSensorial,
    setNotes: (n: string) => setLocal((s) => ({ ...s, notes: n })),
    markComplete,
  };
}
