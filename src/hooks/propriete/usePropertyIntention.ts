import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { detectPersona, type Persona } from '@/config/onboarding/personas';
import type { Answers, AnswerValue } from '@/config/onboarding/schema';

/**
 * Lecture / écriture du questionnaire d'accueil (« intention ») d'un jardin.
 * Source unique : `proprietes.onboarding_preferences` (jsonb).
 * L'écriture passe par la RPC `save_propriete_onboarding` (SECURITY DEFINER),
 * la table `proprietes` restant fermée en écriture aux non-admins.
 */

const META_KEYS = new Set(['answers', 'persona', 'version', 'completed_at', 'updated_at', 'source']);

export interface PropertyIntention {
  /** Réponses normalisées, quel que soit le format d'écriture d'origine. */
  answers: Answers;
  persona: Persona;
  /** Persona explicitement stockée par le parcours, si présente. */
  storedPersona: string | null;
  version: number | null;
  completedAt: string | null;
  updatedAt: string | null;
  /** Le jardin a-t-il été créé (ou complété) par le parcours d'accueil ? */
  hasOnboarding: boolean;
  raw: Record<string, unknown>;
}

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

  return {
    answers,
    persona: detectPersona(answers),
    storedPersona,
    version: typeof prefs.version === 'number' ? prefs.version : null,
    completedAt: typeof prefs.completed_at === 'string' ? prefs.completed_at : null,
    updatedAt: typeof prefs.updated_at === 'string' ? prefs.updated_at : null,
    hasOnboarding: Object.keys(answers).length > 0,
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
        persona: persona ?? detectPersona(merged),
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
