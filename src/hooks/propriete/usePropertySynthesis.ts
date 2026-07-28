import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SynthesisItem {
  /** Texte affiché dans la colonne. */
  text: string;
  /** Justification courte : « pente + sécheresse relevée en étape 1 ». */
  because?: string | null;
  /** Origine : 'ai' | 'user' | 'rule' */
  source?: string;
}

export type ExposureId = 'soleil' | 'mi_ombre' | 'ombre';
export type WindId = 'faible' | 'moyen' | 'fort';
export type HumidityId = 'sec' | 'frais' | 'humide';

export interface PropertySynthesisState {
  exposure?: ExposureId | null;
  wind_level?: WindId | null;
  humidity?: HumidityId | null;
  atouts: SynthesisItem[];
  contraintes: SynthesisItem[];
  vigilances: SynthesisItem[];
  portrait?: string | null;
  notes?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

const EMPTY: PropertySynthesisState = {
  exposure: null,
  wind_level: null,
  humidity: null,
  atouts: [],
  contraintes: [],
  vigilances: [],
  portrait: '',
  notes: '',
  completed_at: null,
  updated_at: null,
};

const asItems = (raw: unknown): SynthesisItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) =>
      typeof v === 'string'
        ? { text: v, because: null, source: 'user' }
        : {
            text: String((v as any)?.text ?? '').trim(),
            because: (v as any)?.because ?? null,
            source: (v as any)?.source ?? 'user',
          },
    )
    .filter((i) => i.text.length > 0);
};

export function usePropertySynthesis(proprieteId?: string) {
  const qc = useQueryClient();
  const query = useQuery<PropertySynthesisState>({
    queryKey: ['propriete-synthesis', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_synthesis' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = (data as any) || {};
      return {
        exposure: row.exposure ?? null,
        wind_level: row.wind_level ?? null,
        humidity: row.humidity ?? null,
        atouts: asItems(row.atouts),
        contraintes: asItems(row.contraintes),
        vigilances: asItems(row.vigilances),
        portrait: row.portrait ?? '',
        notes: row.notes ?? '',
        completed_at: row.completed_at ?? null,
        updated_at: row.updated_at ?? null,
      };
    },
  });

  const [local, setLocal] = useState<PropertySynthesisState>(EMPTY);
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
    async (state: PropertySynthesisState, completed: boolean | null = null, targetId?: string) => {
      const id = targetId ?? proprieteId;
      if (!id || id !== proprieteId) return;
      setSaving(true);
      const { error } = await supabase.rpc('upsert_propriete_synthesis' as any, {
        p_propriete_id: id,
        p_exposure: state.exposure ?? null,
        p_wind_level: state.wind_level ?? null,
        p_humidity: state.humidity ?? null,
        p_atouts: state.atouts as any,
        p_contraintes: state.contraintes as any,
        p_vigilances: state.vigilances as any,
        p_portrait: state.portrait ?? null,
        p_notes: state.notes ?? null,
        p_completed: completed,
      });
      setSaving(false);
      if (error) throw error;
      setSavedAt(new Date().toISOString());
      if (completed === true) {
        setLocal((s) => ({ ...s, completed_at: new Date().toISOString() }));
      }
      if (completed === false) {
        setLocal((s) => ({ ...s, completed_at: null }));
      }
      qc.invalidateQueries({ queryKey: ['propriete-synthesis', id] });
    },
    [proprieteId, qc],
  );

  useEffect(() => {
    if (!proprieteId || loadedIdRef.current !== proprieteId) return;
    const targetId = proprieteId;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persist(local, null, targetId).catch(() => {});
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
    setField: <K extends keyof PropertySynthesisState>(k: K, v: PropertySynthesisState[K]) =>
      setLocal((s) => ({ ...s, [k]: v })),
    markComplete: () => persist(local, true),
    reopen: () => persist(local, false),
  };
}
