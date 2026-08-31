import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  usePropertyIntention, useSaveGestures, type IntentionGesture, type PropertyIntention,
} from './usePropertyIntention';
import { DEFAULT_SEQUENCE } from '@/config/onboarding/defaultSequence';
import { PERSONA_LABELS } from '@/config/onboarding/personas';
import { useProprieteEntretienAcquis, REGISTRE_LABELS } from './useProprieteEntretiens';
import type { AnswerValue, OnboardingQuestion } from '@/config/onboarding/schema';

/**
 * Les trois premiers gestes sont une lecture de l'intention *à jour*, pas une
 * photo du jour de l'inscription : dès qu'une réponse change, l'empreinte
 * change, et l'IA de jardin les réécrit.
 */

const stableFingerprint = (input: string): string => {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
};

/** Libellé lisible d'une réponse (mêmes règles d'affichage que le Portrait). */
const readable = (
  q: OnboardingQuestion,
  value: AnswerValue | undefined,
  answers: Record<string, AnswerValue>,
): string | null => {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  if (q.kind === 'slider' && q.slider) return `${value} ${q.slider.unit}`;
  const labelOf = (v: string) => q.options?.find((o) => o.value === v)?.label ?? v;
  const precisionOf = (v: string) => {
    const key = q.options?.find((o) => o.value === v)?.followUp?.answerId;
    const raw = key ? answers[key] : undefined;
    return typeof raw === 'string' && raw.trim() ? ` — « ${raw.trim()} »` : '';
  };
  if (Array.isArray(value)) return value.map((v) => labelOf(v) + precisionOf(v)).join(' · ');
  if (typeof value === 'number') return String(value);
  return labelOf(value) + precisionOf(value);
};

/** Contexte envoyé à l'IA : uniquement des libellés lisibles, jamais des codes. */
export const buildGestureContext = (intention: PropertyIntention | undefined) => {
  const answers = intention?.answers ?? {};
  const lignes: string[] = [];

  DEFAULT_SEQUENCE.questions.forEach((q) => {
    if (q.kind === 'surface' && q.surface) {
      const total = answers[q.surface.totalId];
      const libre = answers[q.surface.freeId];
      const parts = [
        total != null ? `${total} m² au total` : null,
        libre != null ? `${libre} m² disponibles` : null,
      ].filter(Boolean);
      if (parts.length) lignes.push(`${q.title} : ${parts.join(' · ')}`);
      return;
    }
    const label = readable(q, answers[q.id], answers);
    if (label) lignes.push(`${q.title} : ${label}`);
  });

  const ex = intention?.gardenExample;
  if (ex && !ex.refused && (ex.titre || ex.intention)) {
    lignes.push(
      `Jardin-exemple retenu : ${[ex.titre, ex.sousTitre].filter(Boolean).join(' — ')}` +
      (ex.intention ? ` (${ex.intention})` : '') +
      (ex.keywords.length ? ` [${ex.keywords.join(', ')}]` : ''),
    );
  }

  const persona = intention?.persona;
  if (persona && PERSONA_LABELS[persona]) lignes.push(`Profil : ${PERSONA_LABELS[persona]}`);

  return lignes;
};

export const useGardenGestures = (proprieteId?: string, canEdit = false) => {
  const { data: intention } = usePropertyIntention(proprieteId);
  const { data: acquis } = useProprieteEntretienAcquis(proprieteId);
  const save = useSaveGestures(proprieteId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef<Set<string>>(new Set());

  // L'entretien fondateur validé pèse dans les gestes : les faits du lieu, les
  // pratiques déjà en place et surtout les lignes rouges à ne jamais franchir.
  const context = useMemo(() => {
    const base = buildGestureContext(intention);
    (acquis ?? []).forEach((c) => {
      const label = REGISTRE_LABELS[c.registre] ?? c.registre;
      base.push(`${label} : ${c.titre}${c.detail ? ` — ${c.detail}` : ''}`);
    });
    return base;
  }, [intention, acquis]);
  const fingerprint = useMemo(
    () => (context.length ? stableFingerprint(context.join('\n')) : null),
    [context],
  );

  const generate = useCallback(async () => {
    if (!proprieteId || !fingerprint || !context.length) return;
    setIsGenerating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-garden-gestures', {
        body: { proprieteId, context },
      });
      if (fnError) throw new Error(fnError.message);
      const gestures = Array.isArray((data as { gestures?: unknown })?.gestures)
        ? ((data as { gestures: IntentionGesture[] }).gestures)
            .filter((g) => g && typeof g.title === 'string' && g.title.trim())
            .slice(0, 3)
        : [];
      if (gestures.length === 0) throw new Error("L'IA de jardin n'a rien renvoyé.");
      await save.mutateAsync({ gestures, fingerprint });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rédaction indisponible');
    } finally {
      setIsGenerating(false);
    }
  }, [proprieteId, fingerprint, context, save]);

  // Régénération silencieuse : les gestes stockés ne correspondent plus aux réponses.
  const stale = !!fingerprint && intention?.gesturesMeta?.fingerprint !== fingerprint;

  useEffect(() => {
    if (!canEdit || !fingerprint || !stale || isGenerating) return;
    if (attempted.current.has(fingerprint)) return;
    attempted.current.add(fingerprint);
    void generate();
  }, [canEdit, fingerprint, stale, isGenerating, generate]);

  const regenerate = useCallback(() => {
    if (fingerprint) attempted.current.add(fingerprint);
    return generate();
  }, [fingerprint, generate]);

  return {
    gestures: intention?.gestures ?? [],
    generatedAt: intention?.gesturesMeta?.generatedAt ?? null,
    isGenerating: isGenerating || save.isPending,
    error,
    stale,
    regenerate,
  };
};
