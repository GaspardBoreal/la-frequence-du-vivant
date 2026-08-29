import React, { useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import type { AnswerValue, OnboardingQuestion } from '@/config/onboarding/schema';

interface Props {
  question: OnboardingQuestion | null;
  /** Valeurs courantes (une question « surface » en pilote deux). */
  values: Record<string, AnswerValue | undefined>;
  saving?: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, AnswerValue | null>) => void;
}

const asArray = (v: AnswerValue | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];

/**
 * Édition d'une seule question du parcours d'accueil, dans le même esprit
 * que l'onboarding : une question, des choix larges, rien d'autre.
 */
export const IntentionQuestionEditor: React.FC<Props> = ({
  question, values, saving, onClose, onSave,
}) => {
  const open = !!question;

  const initial = useMemo<Record<string, AnswerValue | null>>(() => {
    if (!question) return {};
    if (question.kind === 'surface' && question.surface) {
      const { totalId, freeId, default: d, freeDefault } = question.surface;
      return {
        [totalId]: typeof values[totalId] === 'number' ? (values[totalId] as number) : d,
        [freeId]: typeof values[freeId] === 'number' ? (values[freeId] as number) : freeDefault,
      };
    }
    if (question.kind === 'slider' && question.slider) {
      return {
        [question.id]:
          typeof values[question.id] === 'number' ? (values[question.id] as number) : question.slider.default,
      };
    }
    if (question.kind === 'multi' || question.kind === 'tiles') {
      return { [question.id]: asArray(values[question.id]) };
    }
    return { [question.id]: (values[question.id] as AnswerValue | undefined) ?? null };
  }, [question, values]);

  const [draft, setDraft] = useState<Record<string, AnswerValue | null>>(initial);
  const [key, setKey] = useState<string | null>(null);
  if (question && key !== question.id) {
    setKey(question.id);
    setDraft(initial);
  }

  if (!question) return null;

  const multiple = question.kind === 'multi' || question.kind === 'tiles';
  const selected = asArray(draft[question.id] as AnswerValue | undefined);

  /** Option retenue ouvrant une précision en texte libre (ex. « Résoudre un problème »). */
  const followUpOption = (question.options ?? []).find(
    (o) => o.followUp && (multiple ? selected.includes(o.value) : draft[question.id] === o.value),
  );
  const followUp = followUpOption?.followUp ?? null;
  const followUpValue = followUp ? String(draft[followUp.answerId] ?? values[followUp.answerId] ?? '') : '';
  const followUpMissing = !!followUp?.required && !followUpValue.trim();

  const toggle = (value: string) => {
    if (multiple) {
      const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
      setDraft((d) => ({ ...d, [question.id]: next }));
    } else {
      setDraft((d) => {
        const next = { ...d, [question.id]: value };
        // Une précision ne survit jamais au choix qu'elle accompagnait.
        (question.options ?? []).forEach((o) => {
          if (o.followUp && o.value !== value) next[o.followUp.answerId] = null;
        });
        return next;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif italic text-xl">{question.title}</SheetTitle>
          {question.subtitle && <SheetDescription>{question.subtitle}</SheetDescription>}
        </SheetHeader>

        <div className="py-5 space-y-4">
          {(question.kind === 'single' || question.kind === 'multi'
            || question.kind === 'tiles' || question.kind === 'gallery') && (
            <div className="grid gap-2 sm:grid-cols-2">
              {(question.options ?? []).map((opt) => {
                const active = multiple ? selected.includes(opt.value) : draft[question.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`text-left rounded-2xl border px-4 py-3 transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                        : 'border-border/70 bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    {opt.hint && <p className="mt-1 text-xs text-muted-foreground">{opt.hint}</p>}
                  </button>
                );
              })}
            </div>
          )}

          {followUp && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <label className="text-sm font-medium text-foreground" htmlFor="intention-follow-up">
                {followUp.label}
              </label>
              {followUp.multiline === false ? (
                <Input
                  id="intention-follow-up"
                  className="mt-2"
                  value={followUpValue}
                  placeholder={followUp.placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [followUp.answerId]: e.target.value }))}
                />
              ) : (
                <Textarea
                  id="intention-follow-up"
                  className="mt-2 min-h-[96px]"
                  value={followUpValue}
                  placeholder={followUp.placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [followUp.answerId]: e.target.value }))}
                />
              )}
              {followUpMissing && (
                <p className="mt-2 text-xs text-amber-600">Une phrase suffit — c'est elle qui guidera le diagnostic.</p>
              )}
            </div>
          )}

          {question.kind === 'slider' && question.slider && (
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="text-3xl font-semibold text-foreground">
                {Number(draft[question.id] ?? question.slider.default)}{' '}
                <span className="text-base font-normal text-muted-foreground">{question.slider.unit}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {question.slider.describe(Number(draft[question.id] ?? question.slider.default))}
              </p>
              <Slider
                className="mt-5"
                min={question.slider.min}
                max={question.slider.max}
                step={question.slider.step}
                value={[Number(draft[question.id] ?? question.slider.default)]}
                onValueChange={([v]) => setDraft((d) => ({ ...d, [question.id]: v }))}
              />
            </div>
          )}

          {question.kind === 'surface' && question.surface && (
            <div className="space-y-3">
              {[
                { id: question.surface.totalId, label: 'Surface totale' },
                { id: question.surface.freeId, label: 'Surface encore disponible' },
              ].map((row) => (
                <div key={row.id} className="rounded-2xl border border-border/70 bg-card p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-2xl font-semibold text-foreground">
                      {Number(draft[row.id] ?? 0)} <span className="text-sm font-normal">m²</span>
                    </span>
                  </div>
                  <Slider
                    className="mt-4"
                    min={0}
                    max={question.surface!.max}
                    step={10}
                    value={[Number(draft[row.id] ?? 0)]}
                    onValueChange={([v]) => setDraft((d) => ({ ...d, [row.id]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={() => onSave(draft)} disabled={saving || followUpMissing}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default IntentionQuestionEditor;
