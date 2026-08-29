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
  'persona_label', 'flow_source', 'flow_version', 'garden_example', 'gestures',
  'gestures_meta', 'portrait',
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
  /** Famille de jardin (type de la galerie) — même vocabulaire que la réponse `style`. */
  typeId: string | null;
  typeSlug: string | null;
  /** L'utilisateur a explicitement répondu « Aucun ne me ressemble ». */
  refused: boolean;
}

export interface IntentionGesture {
  title: string;
  detail: string;
  sketch?: string | null;
}

/** Trace de la dernière rédaction des gestes (empreinte des réponses ayant servi). */
export interface GesturesMeta {
  generatedAt: string | null;
  fingerprint: string | null;
  source: string | null;
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
  gesturesMeta: GesturesMeta | null;
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
    typeId: str(g.typeId) ?? str(g.type_id),
    typeSlug: str(g.typeSlug) ?? str(g.type_slug),
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
  const rawMeta = prefs.gestures_meta && typeof prefs.gestures_meta === 'object'
    ? (prefs.gestures_meta as Record<string, unknown>)
    : null;
  const gesturesMeta: GesturesMeta | null = rawMeta
    ? {
        generatedAt: str(rawMeta.generated_at) ?? str(rawMeta.generatedAt),
        fingerprint: str(rawMeta.fingerprint),
        source: str(rawMeta.source),
      }
    : null;

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
    gesturesMeta,
    portrait,
    raw: prefs,
  };
};

/** Un état vide ne doit jamais effacer un état déjà renseigné à l'écran. */
const isEmptyIntention = (i: PropertyIntention) =>
  Object.keys(i.answers).length === 0 && !i.gardenExample && i.gestures.length === 0 && !i.portrait;

export const usePropertyIntention = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['propriete-intention', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<PropertyIntention> => {
      // Lecture par la même voie sécurisée que l'écriture : les droits ne peuvent plus diverger.
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
      }).rpc('get_propriete_onboarding', { _propriete_id: proprieteId });
      if (error) throw new Error(error.message);

      const fresh = normalize(data);
      const cached = qc.getQueryData<PropertyIntention>(['propriete-intention', proprieteId]);
      if (cached && !isEmptyIntention(cached) && isEmptyIntention(fresh)) {
        console.warn('[intention] relecture vide ignorée — état courant conservé', { proprieteId });
        return cached;
      }
      return fresh;
    },
  });
};


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

/** Appel typé de la RPC : elle renvoie l'objet `onboarding_preferences` complet. */
const callSaveOnboarding = async (
  proprieteId: string,
  patch: Record<string, unknown>,
): Promise<PropertyIntention> => {
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  }).rpc('save_propriete_onboarding', { _propriete_id: proprieteId, _patch: patch });
  if (error) throw new Error(error.message);
  return normalize(data);
};

export const useSaveIntention = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<PropertyIntention, Error, SaveIntentionInput>({
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

      return callSaveOnboarding(proprieteId, patch);
    },
    // L'écran se met à jour avec l'état renvoyé par la base, sans attendre la relecture.
    onSuccess: async (fresh) => {
      qc.setQueryData(['propriete-intention', proprieteId], fresh);
      // La relecture est attendue : l'écran ne peut pas retomber sur « À compléter ».
      await qc.refetchQueries({ queryKey: ['propriete-intention', proprieteId], exact: true });
      qc.invalidateQueries({ queryKey: ['propriete-fiche', proprieteId] });
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
    typeId?: string | null;
    typeSlug?: string | null;
  } | null;
  /** Réponses à écrire dans le même geste (ex. `style` déduit de la famille choisie). */
  answers?: Record<string, AnswerValue | null>;
}

export const useSaveGardenExample = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<PropertyIntention, Error, SaveGardenExampleInput>({
    mutationFn: async ({ example, answers }) => {
      if (!proprieteId) throw new Error('Jardin inconnu');
      const now = new Date().toISOString();
      const garden_example = example
        ? { ...example, chosenAt: now, refused: false, source: 'lfdv_portrait' }
        : { refused: true, chosenAt: now, source: 'lfdv_portrait' };

      const patch: Record<string, unknown> = { garden_example, updated_at: now };

      // L'image et la question « Quel jardin vous fait rêver ? » disent la même chose :
      // elles s'écrivent ensemble pour ne jamais diverger à l'écran.
      if (answers && Object.keys(answers).length > 0) {
        const current = qc.getQueryData<PropertyIntention>(['propriete-intention', proprieteId]);
        const merged: Record<string, AnswerValue> = { ...(current?.answers ?? {}) };
        Object.entries(answers).forEach(([k, v]) => {
          if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete merged[k];
          else merged[k] = v;
        });
        patch.answers = merged;
        patch.persona = current?.storedPersona ?? detectPersona(merged);
      }

      return callSaveOnboarding(proprieteId, patch);
    },
    onSuccess: async (fresh) => {
      qc.setQueryData(['propriete-intention', proprieteId], fresh);
      await qc.refetchQueries({ queryKey: ['propriete-intention', proprieteId], exact: true });
      qc.invalidateQueries({ queryKey: ['onboarding-garden-example'] });
      qc.invalidateQueries({ queryKey: ['propriete-fiche', proprieteId] });
    },

  });
};

