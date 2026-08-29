import React, { useMemo, useState } from 'react';
import { Compass, Pencil, Sparkles, Loader2, Target, Footprints } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  usePropertyIntention, useCanEditIntention, useSaveIntention,
} from '@/hooks/propriete/usePropertyIntention';
import { DEFAULT_SEQUENCE } from '@/config/onboarding/defaultSequence';
import { buildSequence, CHAPTERS, type AnswerValue, type OnboardingQuestion } from '@/config/onboarding/schema';
import { PERSONA_LABELS } from '@/config/onboarding/personas';
import { IntentionQuestionEditor } from './IntentionQuestionEditor';
import { GardenExampleCard } from './GardenExampleCard';

interface Props {
  proprieteId: string;
  proprieteNom: string;
}

/** Libellé lisible d'une réponse, à partir des options de la question. */
const readableAnswer = (q: OnboardingQuestion, value: AnswerValue | undefined): string | null => {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  if (q.kind === 'slider' && q.slider) return `${value} ${q.slider.unit}`;
  const labelOf = (v: string) => q.options?.find((o) => o.value === v)?.label ?? v;
  if (Array.isArray(value)) return value.map(labelOf).join(' · ');
  if (typeof value === 'number') return String(value);
  return labelOf(value);
};

/**
 * « Intention » — troisième volet du Portrait : ce que le jardinier a déclaré
 * lors du parcours d'accueil, relisible et modifiable question par question.
 * Un jardin créé hors parcours peut compléter ses réponses ici.
 */
export const PortraitIntention: React.FC<Props> = ({ proprieteId, proprieteNom }) => {
  const { data: intention, isLoading } = usePropertyIntention(proprieteId);
  const { data: canEdit = false } = useCanEditIntention(proprieteId);
  const save = useSaveIntention(proprieteId);
  const [editing, setEditing] = useState<OnboardingQuestion | null>(null);

  const answers = intention?.answers ?? {};
  const persona = intention?.persona ?? 'PARTICULIER_PETIT';

  /** Écrans réellement pertinents pour cette persona. */
  const questions = useMemo(
    () => buildSequence(DEFAULT_SEQUENCE.questions, answers, persona),
    [answers, persona],
  );

  const answeredCount = questions.filter((q) =>
    q.kind === 'surface'
      ? answers[q.surface!.totalId] != null
      : answers[q.id] != null,
  ).length;

  const objectif = questions.find((q) => q.id === 'objectif_6_mois');
  const objectifLabel = objectif ? readableAnswer(objectif, answers.objectif_6_mois) : null;

  const handleSave = (patch: Record<string, AnswerValue | null>) => {
    save.mutate(
      { answers: patch, version: DEFAULT_SEQUENCE.version },
      {
        onSuccess: () => { toast.success('Intention mise à jour'); setEditing(null); },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Nous relisons votre intention…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-serif italic text-foreground flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            Intention du jardin
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mt-1">
            Ce que vous avez déclaré en ouvrant {proprieteNom} : votre lieu, vos envies, vos moyens.
            Ces réponses orientent la palette végétale, les analyses et l'IA de jardin.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {answeredCount} / {questions.length} renseignés
        </Badge>
      </div>

      {!intention?.hasOnboarding && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Ce jardin n'est pas encore passé par le parcours d'accueil.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Répondez aux questions ci-dessous, dans l'ordre qui vous arrange. Chaque réponse
                affine les recommandations, même isolée.
              </p>
            </div>
          </div>
        </div>
      )}

      {intention?.portrait && (
        <p className="rounded-2xl border-l-2 border-amber-500/50 bg-card/60 px-5 py-4 font-serif italic text-base text-foreground/90">
          {intention.portrait}
        </p>
      )}

      {intention?.hasOnboarding && <GardenExampleCard stored={intention.gardenExample} />}

      {(intention?.gestures.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
            <Footprints className="h-4 w-4 text-amber-600" /> Vos premiers gestes
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {intention!.gestures.map((g, i) => (
              <div key={`${g.title}-${i}`} className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-sm font-medium text-foreground">{g.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{g.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {objectif && (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => canEdit && setEditing(objectif)}
          className="w-full text-left rounded-2xl border border-primary/30 bg-primary/5 p-5 transition-colors hover:bg-primary/10 disabled:cursor-default"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
            <Target className="h-4 w-4" /> Les six prochains mois
          </div>
          <p className="mt-2 font-serif italic text-lg text-foreground">
            {objectifLabel ?? 'Quel cap vous donnez-vous ? Cliquez pour le poser.'}
          </p>
        </button>
      )}

      <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-xs text-muted-foreground">
        Profil détecté : <span className="text-foreground font-medium">{PERSONA_LABELS[persona]}</span>
        {intention?.updatedAt && (
          <> — mis à jour le {new Date(intention.updatedAt).toLocaleDateString('fr-FR')}</>
        )}
      </div>

      {CHAPTERS.map((chapter) => {
        const items = questions.filter((q) => q.chapter === chapter && q.id !== 'objectif_6_mois');
        if (items.length === 0) return null;
        return (
          <section key={chapter} className="space-y-2">
            <h3 className="text-sm font-medium text-foreground/80">{chapter}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((q) => {
                const label = q.kind === 'surface' && q.surface
                  ? [
                      answers[q.surface.totalId] != null ? `${answers[q.surface.totalId]} m² au total` : null,
                      answers[q.surface.freeId] != null ? `${answers[q.surface.freeId]} m² disponibles` : null,
                    ].filter(Boolean).join(' · ') || null
                  : readableAnswer(q, answers[q.id]);

                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => canEdit && setEditing(q)}
                    className="text-left rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{q.title}</span>
                      {canEdit && <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
                    </div>
                    <p className={`mt-1 text-sm ${label ? 'text-foreground' : 'italic text-muted-foreground/70'}`}>
                      {label ?? 'À compléter'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {!canEdit && (
        <p className="text-xs text-muted-foreground">
          Seul le propriétaire du jardin peut modifier ces réponses.
        </p>
      )}

      <IntentionQuestionEditor
        question={editing}
        values={answers}
        saving={save.isPending}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </div>
  );
};

export default PortraitIntention;
