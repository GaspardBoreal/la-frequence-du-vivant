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
  const initRef = useRef(false);

  useEffect(() => {
    if (query.data && !initRef.current) {
      setLocal(query.data);
      setSavedAt(query.data.updated_at ?? null);
      initRef.current = true;
    }
  }, [query.data]);

  const persist = useCallback(
    async (state: PropertyObservationState, completed = false) => {
      if (!proprieteId) return;
      setSaving(true);
      const { error } = await supabase.rpc('upsert_propriete_observation' as any, {
        p_propriete_id: proprieteId,
        p_answers: state.answers,
        p_sensorial: state.sensorial,
        p_notes: state.notes ?? null,
        p_completed: completed,
      });
      setSaving(false);
      if (!error) {
        setSavedAt(new Date().toISOString());
        qc.invalidateQueries({ queryKey: ['propriete-observation', proprieteId] });
      }
    },
    [proprieteId, qc]
  );

  // Autosave debounced
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!initRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(local, false), 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

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
    toggleChoice,
    setSensorial,
    setNotes: (n: string) => setLocal((s) => ({ ...s, notes: n })),
    markComplete,
  };
}
