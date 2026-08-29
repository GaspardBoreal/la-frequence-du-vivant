import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { detectPersona, PERSONA_LABELS, type Persona } from '@/config/onboarding/personas';
import type { Answers, AnswerValue } from '@/config/onboarding/schema';

/**
 * Lecture / écriture du questionnaire d'accueil (« intention ») d'un jardin.
 * Source unique : `proprietes.onboarding_preferences` (jsonb).
 * L'écriture passe par la RPC `save_propriete_onboarding` (SECURITY DEFINER),
 * la table `proprietes` restant fermée en écriture aux non-admins.
 */

const META_KEYS = new Set([
  'answers', 'persona', 'version', 'completed_at', 'updated_at', 'source',
  'persona_label', 'flow_source', 'flow_version', 'garden_example', 'gestures', 'portrait',
]);

/** Jardin-exemple retenu à l'écran « Lequel vous ressemble le plus ? ». */
export interface StoredGardenExample {
  id: string | null;
  stableId: string | null;
  titre: string | null;
  sousTitre: string | null;
  intention: string | null;
  keywords: string[];
  vignette: string | null;
  chosenAt: string | null;
  aiProfile: Record<string, unknown> | null;
  /** L'utilisateur a explicitement répondu « Aucun ne me ressemble ». */
  refused: boolean;
}

export interface IntentionGesture {
  title: string;
  detail: string;
  sketch?: string | null;
}

export interface PropertyIntention {
  /** Réponses normalisées, quel que soit le format d'écriture d'origine. */
  answers: Answers;
  persona: Persona;
  /** Persona explicitement stockée par le parcours, si présente. */
  storedPersona: string | null;
  personaLabel: string | null;
  version: number | null;
  flowVersion: number | null;
  flowSource: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  /** Le jardin a-t-il été créé (ou complété) par le parcours d'accueil ? */
  hasOnboarding: boolean;
  gardenExample: StoredGardenExample | null;
  gestures: IntentionGesture[];
  portrait: string | null;
  raw: Record<string, unknown>;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

const normalizeGardenExample = (raw: unknown): StoredGardenExample | null => {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;
  const keywords = Array.isArray(g.keywords) ? g.keywords.filter((k): k is string => typeof k === 'string') : [];
  return {
    id: str(g.id),
    stableId: str(g.stableId) ?? str(g.stable_id),
    titre: str(g.titre) ?? str(g.title),
    sousTitre: str(g.sousTitre) ?? str(g.sous_titre),
    intention: str(g.intention) ?? str(g.user_intent),
    keywords,
    vignette: str(g.vignette) ?? str(g.thumbnail_url) ?? str(g.image_url),
    chosenAt: str(g.chosenAt) ?? str(g.chosen_at),
    aiProfile: g.aiProfile && typeof g.aiProfile === 'object' ? (g.aiProfile as Record<string, unknown>) : null,
    refused: g.refused === true,
  };
};

const normalizeGestures = (raw: unknown): IntentionGesture[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is Record<string, unknown> => Boolean(g) && typeof g === 'object')
    .map((g) => ({
      title: str(g.title) ?? '',
      detail: str(g.detail) ?? '',
      sketch: str(g.sketch),
    }))
    .filter((g) => g.title || g.detail);
};

const normalize = (raw: unknown): PropertyIntention => {
  const prefs = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const nested = prefs.answers && typeof prefs.answers === 'object'
    ? (prefs.answers as Record<string, unknown>)
    : null;

  const source = nested ?? prefs;
  const answers: Answers = {};
  Object.entries(source).forEach(([k, v]) => {
    if (!nested && META_KEYS.has(k)) return;
    if (typeof v === 'string' || typeof v === 'number') answers[k] = v;
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) answers[k] = v as string[];
  });

  const storedPersona = typeof prefs.persona === 'string' ? prefs.persona : null;
  const gardenExample = normalizeGardenExample(prefs.garden_example);
  const gestures = normalizeGestures(prefs.gestures);
  const portrait = str(prefs.portrait);

  return {
    answers,
    persona: (storedPersona && PERSONA_LABELS[storedPersona as Persona] ? (storedPersona as Persona) : detectPersona(answers)),
    storedPersona,
    personaLabel: str(prefs.persona_label),
    version: typeof prefs.version === 'number' ? prefs.version : null,
    flowVersion: typeof prefs.flow_version === 'number' ? prefs.flow_version : null,
    flowSource: str(prefs.flow_source),
    completedAt: typeof prefs.completed_at === 'string' ? prefs.completed_at : null,
    updatedAt: typeof prefs.updated_at === 'string' ? prefs.updated_at : null,
    hasOnboarding: Object.keys(answers).length > 0,
    gardenExample,
    gestures,
    portrait,
    raw: prefs,
  };
};

export const usePropertyIntention = (proprieteId?: string) =>
  useQuery({
    queryKey: ['propriete-intention', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<PropertyIntention> => {
      const { data, error } = await supabase
        .from('proprietes')
        .select('onboarding_preferences')
        .eq('id', proprieteId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return normalize((data as { onboarding_preferences?: unknown } | null)?.onboarding_preferences);
    },
  });

/** L'utilisateur courant peut-il modifier l'intention (propriétaire ou admin) ? */
export const useCanEditIntention = (proprieteId?: string) =>
  useQuery({
    queryKey: ['propriete-intention-can-edit', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
      }).rpc('can_edit_propriete_onboarding', { _propriete_id: proprieteId });
      if (error) return false;
      return data === true;
    },
  });

export interface SaveIntentionInput {
  /** Réponses à fusionner (les clés absentes sont conservées). */
  answers: Record<string, AnswerValue | null>;
  persona?: Persona;
  version?: number;
}

export const useSaveIntention = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, SaveIntentionInput>({
    mutationFn: async ({ answers, persona, version }) => {
      if (!proprieteId) throw new Error('Jardin inconnu');

      const current = qc.getQueryData<PropertyIntention>(['propriete-intention', proprieteId]);
      const merged: Record<string, AnswerValue> = { ...(current?.answers ?? {}) };
      Object.entries(answers).forEach(([k, v]) => {
        if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete merged[k];
        else merged[k] = v;
      });

      const patch: Record<string, unknown> = {
        answers: merged,
        // La persona déclarée par le parcours d'accueil prime : ne jamais l'écraser.
        persona: persona ?? current?.storedPersona ?? detectPersona(merged),
        updated_at: new Date().toISOString(),
      };
      if (version != null) patch.version = version;
      if (!current?.completedAt) patch.completed_at = new Date().toISOString();

      const { error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      }).rpc('save_propriete_onboarding', { _propriete_id: proprieteId, _patch: patch });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propriete-intention', proprieteId] });
    },
  });
};

/** Jardin-exemple choisi (ou refusé) depuis le Portrait, côté LFDV. */
export interface SaveGardenExampleInput {
  example: {
    id: string;
    stableId: string | null;
    titre: string | null;
    sousTitre: string | null;
    intention: string | null;
    keywords: string[];
    vignette: string | null;
    aiProfile: Record<string, unknown> | null;
  } | null;
}

export const useSaveGardenExample = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, SaveGardenExampleInput>({
    mutationFn: async ({ example }) => {
      if (!proprieteId) throw new Error('Jardin inconnu');
      const now = new Date().toISOString();
      const garden_example = example
        ? { ...example, chosenAt: now, refused: false, source: 'lfdv_portrait' }
        : { refused: true, chosenAt: now, source: 'lfdv_portrait' };

      const { error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      }).rpc('save_propriete_onboarding', {
        _propriete_id: proprieteId,
        _patch: { garden_example, updated_at: now },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propriete-intention', proprieteId] });
      qc.invalidateQueries({ queryKey: ['onboarding-garden-example'] });
      qc.invalidateQueries({ queryKey: ['propriete-fiche', proprieteId] });
    },
  });
};
