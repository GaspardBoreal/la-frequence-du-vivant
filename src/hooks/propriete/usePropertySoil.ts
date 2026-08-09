import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  MAX_SAMPLES,
  nextLabel,
  nextSampleId,
} from '@/components/propriete/analyze/sample/sampleRoster';


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
  /** Bloc 4 · test de texture réalisé : 'boudin' | 'sedimentation' */
  texture_test?: 'boudin' | 'sedimentation' | null;
  /** Bloc 4 · classe de texture observée */
  texture_result?: 'sable' | 'limon' | 'argile' | null;
  /** Bloc 4 · forme prise par le boudin (indice de teneur en argile) */
  boudin_form?: 'droit' | 'lune' | 'cercle' | null;
  /** Bloc 5 · test de pH réalisé sur ce prélèvement */
  ph_test?: 'bandelette' | 'phmetre' | null;
  /** Bloc 5 · valeur de pH mesurée (4 → 9) */
  ph_value?: number | null;
  /** Bloc 6 · test de vie du sol réalisé sur ce prélèvement */
  life_test?: 'beche_vivante' | 'vinaigre' | 'sachet' | null;
  /** Bloc 6 · indices de vie biologique cochés */
  life_signs?: string[];
  /** Bloc 6 · nombre de vers de terre comptés (bêchée 20 × 20 × 20 cm) */
  worm_count?: number | null;
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

/** Champs surveillés par le garde-fou serveur `guard_propriete_soil_samples`. */
const GUARDED_KEYS: (keyof SoilSample)[] = [
  'location', 'lat', 'lng', 'photo_url', 'structure_test', 'structure_result',
  'texture_test', 'texture_result', 'boudin_form', 'ph_test', 'ph_value',
  'life_test', 'life_signs', 'worm_count',
];

const isEmptyValue = (v: unknown) =>
  v == null || v === '' || (Array.isArray(v) && v.length === 0);

/** Vrai si le patch vide une valeur jusqu'ici renseignée (effacement volontaire). */
function isClearingPatch(current: SoilSample, patch: Partial<SoilSample>): boolean {
  return GUARDED_KEYS.some(
    (k) => k in patch && !isEmptyValue(current[k]) && isEmptyValue(patch[k]),
  );
}

export interface UsePropertySoilOptions {
  /**
   * Lecture seule : aucune sauvegarde automatique n'est émise par cette instance.
   * Indispensable pour les onglets qui ne font qu'afficher le registre
   * (J'identifie, La palette, La synthèse) — sans cela, plusieurs instances
   * concurrentes réécrivent le registre entier et s'écrasent mutuellement.
   */
  readOnly?: boolean;
}

export function usePropertySoil(proprieteId?: string, options?: UsePropertySoilOptions) {
  const readOnly = options?.readOnly === true;
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

  const [local, setLocalRaw] = useState<PropertySoilState>(EMPTY);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Miroir synchrone du registre : permet de calculer id/lettre AVANT le setState. */
  const localRef = useRef<PropertySoilState>(EMPTY);
  localRef.current = local;
  /** Vrai uniquement après une modification réelle de l'utilisateur. */
  const dirtyRef = useRef(false);
  /** Vrai quand la prochaine écriture supprime volontairement un prélèvement. */
  const destructiveRef = useRef(false);
  /** Empreinte de la dernière version serveur absorbée. */
  const serverStampRef = useRef<string | null>(null);

  /** Tout changement passant par ce setter est considéré comme une saisie utilisateur. */
  const setLocal: typeof setLocalRaw = useCallback((value) => {
    dirtyRef.current = true;
    setLocalRaw(value);
  }, []);

  useEffect(() => {
    if (proprieteId !== loadedIdRef.current) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      dirtyRef.current = false;
      destructiveRef.current = false;
      serverStampRef.current = null;
      setLocalRaw(EMPTY);
      setSavedAt(null);
      loadedIdRef.current = null;
    }
  }, [proprieteId]);

  // Hydratation initiale, puis resynchronisation quand le serveur change
  // (tant qu'aucune saisie locale n'est en attente d'enregistrement).
  useEffect(() => {
    if (!proprieteId || !query.data) return;
    const stamp = query.data.updated_at ?? 'init';
    if (loadedIdRef.current === proprieteId) {
      if (dirtyRef.current) return;
      if (serverStampRef.current === stamp) return;
    }
    serverStampRef.current = stamp;
    setLocalRaw(query.data);
    setSavedAt(query.data.updated_at ?? null);
    loadedIdRef.current = proprieteId;
  }, [proprieteId, query.data]);

  const persist = useCallback(
    async (state: PropertySoilState, completed = false, targetId?: string) => {
      const id = targetId ?? proprieteId;
      if (!id || id !== proprieteId) return;
      if (readOnly) return;
      // Jamais d'écriture tant que la version serveur n'a pas été lue :
      // le registre par défaut A·B·C ne doit jamais partir en base.
      if (!query.isSuccess || loadedIdRef.current !== proprieteId) return;
      setSaving(true);

      const allowDestructive = destructiveRef.current;
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
        p_allow_destructive: allowDestructive,
      });
      setSaving(false);
      if (error) throw error;
      destructiveRef.current = false;
      dirtyRef.current = false;
      setSavedAt(new Date().toISOString());
      if (completed) {
        setLocalRaw((s) => ({ ...s, completed_at: new Date().toISOString() }));
      }
      qc.invalidateQueries({ queryKey: ['propriete-soil', id] });
    },
    [proprieteId, qc, readOnly, query.isSuccess]
  );

  useEffect(() => {
    if (readOnly) return;
    if (!proprieteId || loadedIdRef.current !== proprieteId) return;
    // Aucune saisie utilisateur : on n'écrit rien (protection anti-écrasement).
    if (!dirtyRef.current) return;
    const targetId = proprieteId;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persist(localRef.current, false, targetId).catch(() => {});
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, proprieteId, readOnly]);

  return {
    state: local,
    setLocal,
    readOnly,
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
    updateSample: (id: string, patch: Partial<SoilSample>) => {
      // Effacement volontaire d'une valeur (bouton « Effacer », décochage,
      // désélection d'une pastille) : on lève explicitement le garde-fou serveur,
      // sinon l'écriture est refusée et toute la session de saisie est perdue.
      const current = (localRef.current.samples ?? []).find((sm) => sm.id === id);
      if (current && isClearingPatch(current, patch)) destructiveRef.current = true;
      setLocal((s) => ({
        ...s,
        samples: s.samples.map((sm) => (sm.id === id ? { ...sm, ...patch } : sm)),
      }));
    },
    /**
     * Ajoute un prélèvement et renvoie son identifiant (null si le maximum est atteint).
     * L'id et la lettre sont calculés en amont du setState : la valeur retournée est
     * donc toujours fiable, y compris en StrictMode (double invocation des updaters).
     */
    addSample: (patch?: Partial<SoilSample>): string | null => {
      const current = localRef.current.samples ?? [];
      if (current.length >= MAX_SAMPLES) return null;
      const id = nextSampleId(current);
      const label = nextLabel(current);
      const created: SoilSample = { ...patch, id, label };
      // Miroir immédiat : deux ajouts rapprochés ne peuvent plus produire le même id.
      localRef.current = { ...localRef.current, samples: [...current, created] };
      setLocal((s) => {
        if (s.samples.some((sm) => sm.id === id)) return s;
        if (s.samples.length >= MAX_SAMPLES) return s;
        return { ...s, samples: [...s.samples, created] };
      });
      return id;
    },

    /** Réattribue la lettre affichée sans toucher à l'identifiant interne. */
    relabelSample: (id: string, label: string) =>
      setLocal((s) => ({
        ...s,
        samples: s.samples.map((sm) => (sm.id === id ? { ...sm, label } : sm)),
      })),
    removeSample: (id: string) => {
      // Suppression volontaire : on lève explicitement le garde-fou serveur.
      destructiveRef.current = true;
      setLocal((s) => ({ ...s, samples: s.samples.filter((sm) => sm.id !== id) }));
    },
    /** Réinsère un prélèvement supprimé à sa position d'origine (annulation). */
    restoreSample: (sample: SoilSample, at: number) =>
      setLocal((s) => {
        if (s.samples.some((sm) => sm.id === sample.id)) return s;
        const next = [...s.samples];
        next.splice(Math.max(0, Math.min(at, next.length)), 0, sample);
        return { ...s, samples: next };
      }),

    markComplete: () => persist(local, true),
  };
}
