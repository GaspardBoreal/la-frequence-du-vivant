import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ZoneAmbiance } from '@/lib/paletteEngine';

/** Choix éditoriaux d'une zone (rattachés à `propriete_zones.id`). */
export interface PaletteZoneChoice {
  zone_id: string;
  ambiance: ZoneAmbiance;
  /** Espèces retenues (ids de `plantPaletteKb`). */
  selected: string[];
  /** Espèces écartées manuellement de la proposition. */
  dismissed: string[];
  intention?: string | null;
}

export interface PaletteExclusion {
  fr: string;
  latin: string;
  why: string;
  kind?: string;
}

export interface PalettePlanStep {
  period: string;
  title: string;
  detail: string;
}

export interface PropertyPaletteState {
  site_rule?: string | null;
  zones: PaletteZoneChoice[];
  excluded: PaletteExclusion[];
  implementation: PalettePlanStep[];
  notes?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

const EMPTY: PropertyPaletteState = {
  site_rule: '',
  zones: [],
  excluded: [],
  implementation: [],
  notes: '',
  completed_at: null,
  updated_at: null,
};

const asArray = <T,>(raw: unknown): T[] => (Array.isArray(raw) ? (raw as T[]) : []);

export function usePropertyPalette(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<PropertyPaletteState>({
    queryKey: ['propriete-palette', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_palette' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = (data as any) || {};
      return {
        site_rule: row.site_rule ?? '',
        zones: asArray<PaletteZoneChoice>(row.zones).map((z) => ({
          zone_id: String((z as any).zone_id ?? ''),
          ambiance: ((z as any).ambiance ?? 'neutre') as ZoneAmbiance,
          selected: asArray<string>((z as any).selected),
          dismissed: asArray<string>((z as any).dismissed),
          intention: (z as any).intention ?? null,
        })),
        excluded: asArray<PaletteExclusion>(row.excluded),
        implementation: asArray<PalettePlanStep>(row.implementation),
        notes: row.notes ?? '',
        completed_at: row.completed_at ?? null,
        updated_at: row.updated_at ?? null,
      };
    },
  });

  const [local, setLocal] = useState<PropertyPaletteState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
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
    async (state: PropertyPaletteState, completed: boolean | null = null, targetId?: string) => {
      const id = targetId ?? proprieteId;
      if (!id || id !== proprieteId) return;
      setSaving(true);
      const { error } = await supabase.rpc('upsert_propriete_palette' as any, {
        p_propriete_id: id,
        p_site_rule: state.site_rule ?? null,
        p_zones: state.zones as any,
        p_excluded: state.excluded as any,
        p_implementation: state.implementation as any,
        p_notes: state.notes ?? null,
        p_completed_at:
          completed === true
            ? new Date().toISOString()
            : completed === false
              ? null
              : (state.completed_at ?? null),
      });
      setSaving(false);
      if (error) throw error;
      setSavedAt(new Date().toISOString());
      if (completed === true) setLocal((s) => ({ ...s, completed_at: new Date().toISOString() }));
      if (completed === false) setLocal((s) => ({ ...s, completed_at: null }));
      qc.invalidateQueries({ queryKey: ['propriete-palette', id] });
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

  const setZoneChoice = useCallback((zoneId: string, patch: Partial<PaletteZoneChoice>) => {
    setLocal((s) => {
      const existing = s.zones.find((z) => z.zone_id === zoneId);
      const next: PaletteZoneChoice = {
        zone_id: zoneId,
        ambiance: 'neutre',
        selected: [],
        dismissed: [],
        intention: null,
        ...(existing ?? {}),
        ...patch,
      };
      return {
        ...s,
        zones: existing
          ? s.zones.map((z) => (z.zone_id === zoneId ? next : z))
          : [...s.zones, next],
      };
    });
  }, []);

  return {
    state: local,
    setLocal,
    loading: query.isLoading,
    saving,
    savedAt,
    completedAt: local.completed_at ?? null,
    setField: <K extends keyof PropertyPaletteState>(k: K, v: PropertyPaletteState[K]) =>
      setLocal((s) => ({ ...s, [k]: v })),
    setZoneChoice,
    markComplete: () => persist(local, true),
    reopen: () => persist(local, false),
  };
}
