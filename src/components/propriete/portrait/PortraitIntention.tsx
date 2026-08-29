import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Pencil, Sparkles, Loader2, Target, Footprints, Stethoscope, Sprout, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

type IntentionSection = 'jardin' | 'projet';

/** Libellé lisible d'une réponse, à partir des options de la question. */
const readableAnswer = (
  q: OnboardingQuestion,
  value: AnswerValue | undefined,
  answers: Record<string, AnswerValue> = {},
): string | null => {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  if (q.kind === 'slider' && q.slider) return `${value} ${q.slider.unit}`;
  const labelOf = (v: string) => q.options?.find((o) => o.value === v)?.label ?? v;
  /** Le texte libre du jardinier est repris mot pour mot, jamais traduit. */
  const precisionOf = (v: string) => {
    const key = q.options?.find((o) => o.value === v)?.followUp?.answerId;
    const raw = key ? answers[key] : undefined;
    return typeof raw === 'string' && raw.trim() ? ` — « ${raw.trim()} »` : '';
  };
  if (Array.isArray(value)) return value.map((v) => labelOf(v) + precisionOf(v)).join(' · ');
  if (typeof value === 'number') return String(value);
  return labelOf(value) + precisionOf(value);
};

/**
 * « Intention » — troisième volet du Portrait, scindé en deux sous-menus :
 * « Le jardin » (description du lieu et du jardinier) et « Le projet »
 * (problème à résoudre, cap à six mois, premiers gestes). Mobile d'abord.
 */
export const PortraitIntention: React.FC<Props> = ({ proprieteId, proprieteNom }) => {
  const { data: intention, isLoading, error } = usePropertyIntention(proprieteId);
  const { data: canEdit = false } = useCanEditIntention(proprieteId);
  const save = useSaveIntention(proprieteId);
  const [editing, setEditing] = useState<OnboardingQuestion | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const section: IntentionSection = searchParams.get('intention') === 'projet' ? 'projet' : 'jardin';
  const setSection = (s: IntentionSection) => {
    const next = new URLSearchParams(searchParams);
    if (s === 'jardin') next.delete('intention');
    else next.set('intention', s);
    setSearchParams(next, { replace: true });
  };

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

  const rawProbleme = answers.priorite_probleme;
  const probleme = typeof rawProbleme === 'string' && rawProbleme.trim() ? rawProbleme.trim() : null;

  const priorite = questions.find((q) => q.id === 'priorite');
  const objectif = questions.find((q) => q.id === 'objectif_6_mois');
  const objectifLabel = objectif ? readableAnswer(objectif, answers.objectif_6_mois, answers) : null;

  const handleSave = (patch: Record<string, AnswerValue | null>) => {
    save.mutate(
      { answers: patch, version: DEFAULT_SEQUENCE.version },
      {
        onSuccess: () => {
          toast.success('Intention mise à jour');
          // Répondre au rêve doit remettre l'image en cohérence : si la famille
          // choisie ne correspond plus au jardin-exemple, on rouvre la galerie.
          const nextStyle = typeof patch.style === 'string' ? patch.style : null;
          if (nextStyle && canEdit && intention?.gardenExample?.typeSlug !== nextStyle) {
            setPickerSlug(nextStyle);
            setPickerSignal((n) => n + 1);
          }
          setEditing(null);
        },
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

  const projetVide = !probleme && !objectifLabel && (intention?.gestures.length ?? 0) === 0;
  const lectureKO = !!error;


  return (
    <div className="space-y-5">
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

      {/* Sélecteur de sous-menu — pleine largeur et sticky sur mobile */}
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setSection('jardin')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              section === 'jardin'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sprout className="h-4 w-4 shrink-0 text-amber-600" />
            Le jardin
          </button>
          <button
            type="button"
            onClick={() => setSection('projet')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              section === 'projet'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Flag className="h-4 w-4 shrink-0 text-primary" />
            Le projet
          </button>
        </div>
      </div>

      {lectureKO && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
          Vos réponses n'ont pas pu être relues : {(error as Error).message}. Rechargez la page —
          rien n'est perdu, tout est conservé en base.
        </div>
      )}

      {!lectureKO && !intention?.hasOnboarding && (

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

      {section === 'jardin' ? (
        <>
          {intention?.portrait && (
            <p className="rounded-2xl border-l-2 border-amber-500/50 bg-card/60 px-5 py-4 font-serif italic text-base text-foreground/90">
              {intention.portrait}
            </p>
          )}

          <GardenExampleCard
            stored={intention?.gardenExample ?? null}
            proprieteId={proprieteId}
            canEdit={canEdit}
          />


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
                      : readableAnswer(q, answers[q.id], answers);

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
        </>
      ) : (
        <>
          {projetVide && (
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
              Rien n'est encore posé ici. Décrivez le problème à résoudre ou donnez-vous un cap
              pour les six prochains mois : c'est ce qui guide le travail du jardin.
            </div>
          )}

          <button
            type="button"
            disabled={!canEdit || !priorite}
            onClick={() => canEdit && priorite && setEditing(priorite)}
            className="w-full text-left rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 transition-colors hover:bg-amber-500/10 disabled:cursor-default disabled:hover:bg-amber-500/5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-600">
                <Stethoscope className="h-4 w-4" /> Le problème à résoudre
              </div>
              {canEdit && priorite && <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
            </div>
            {probleme ? (
              <>
                <p className="mt-2 font-serif italic text-base md:text-lg text-foreground">« {probleme} »</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cette phrase est transmise telle quelle à l'IA de jardin et à la clinique.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground/70">
                Plantation qui ne prend pas, sol, arbres, maladie… Cliquez pour le décrire.
              </p>
            )}
          </button>

          {objectif && (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && setEditing(objectif)}
              className="w-full text-left rounded-2xl border border-primary/30 bg-primary/5 p-5 transition-colors hover:bg-primary/10 disabled:cursor-default"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
                  <Target className="h-4 w-4" /> Les six prochains mois
                </div>
                {canEdit && <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
              </div>
              <p className="mt-2 font-serif italic text-base md:text-lg text-foreground">
                {objectifLabel ?? 'Quel cap vous donnez-vous ? Cliquez pour le poser.'}
              </p>
            </button>
          )}

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
        </>
      )}

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
