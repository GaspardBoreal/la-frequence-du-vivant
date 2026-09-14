import React from 'react';
import { BookLock, ShieldAlert, Sparkles, Footprints, Bot, Quote } from 'lucide-react';
import {
  REGISTRES, REGISTRE_LABELS,
  useProprieteConnaissance,
  type Registre,
} from '@/hooks/propriete/useProprieteEntretiens';

/**
 * La base de connaissance du jardin : ce qui a été relu avec la propriétaire,
 * validé, verrouillé — et qui fait autorité pour l'IA de Jardin, le Tour de
 * jardin et les trois premiers gestes.
 */

const REGISTRE_TONE: Record<Registre, string> = {
  ligne_rouge: 'border-destructive/40 bg-destructive/5',
  fait: 'border-emerald-600/30 bg-emerald-600/5',
  geste: 'border-emerald-600/30 bg-emerald-600/5',
  portrait: 'border-border bg-muted/30',
  cap: 'border-amber-500/30 bg-amber-500/5',
};

export const ConnaissanceJardinCard: React.FC<{ proprieteId: string }> = ({ proprieteId }) => {
  const { data: items = [], isLoading } = useProprieteConnaissance(proprieteId);

  if (isLoading || items.length === 0) return null;

  const lignesRouges = items.filter((i) => i.registre === 'ligne_rouge');
  const validatedAt = items.find((i) => i.validated_at)?.validated_at ?? null;
  const validatedWith = items.find((i) => i.validated_with)?.validated_with ?? null;

  return (
    <section className="rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-emerald-600/[0.07] to-transparent p-4 md:p-5 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-serif italic text-foreground flex items-center gap-2">
            <BookLock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Base de connaissance du jardin
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} point{items.length > 1 ? 's' : ''} validé{items.length > 1 ? 's' : ''} et verrouillé
            {items.length > 1 ? 's' : ''}
            {validatedAt && ` · le ${new Date(validatedAt).toLocaleDateString('fr-FR')}`}
            {validatedWith && ` avec ${validatedWith}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { icon: Bot, label: 'IA de Jardin' },
            { icon: Footprints, label: 'Tour de jardin' },
            { icon: Sparkles, label: 'Trois premiers gestes' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-700/30 bg-background/60 text-muted-foreground inline-flex items-center gap-1"
            >
              <Icon className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              {label}
            </span>
          ))}
        </div>
      </header>

      {lignesRouges.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 space-y-2">
          <div className="text-xs font-medium text-destructive flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            {lignesRouges.length} ligne{lignesRouges.length > 1 ? 's' : ''} rouge
            {lignesRouges.length > 1 ? 's' : ''} — jamais franchie{lignesRouges.length > 1 ? 's' : ''}
          </div>
          <ul className="space-y-1.5">
            {lignesRouges.map((l) => (
              <li key={l.id} className="text-xs text-foreground">
                <span className="font-medium">{l.titre}</span>
                {l.verbatim && (
                  <span className="block text-muted-foreground italic mt-0.5">
                    <Quote className="w-3 h-3 inline mr-1 text-destructive/70" />« {l.verbatim} »
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {REGISTRES.filter((r) => r !== 'ligne_rouge').map((r) => {
          const cards = items.filter((i) => i.registre === r);
          if (cards.length === 0) return null;
          return (
            <div key={r} className={`rounded-xl border p-3 space-y-1.5 ${REGISTRE_TONE[r]}`}>
              <div className="text-xs font-medium text-foreground">
                {REGISTRE_LABELS[r]}{' '}
                <span className="text-muted-foreground font-normal">· {cards.length}</span>
              </div>
              <ul className="space-y-1">
                {cards.map((c) => (
                  <li key={c.id} className="text-xs text-muted-foreground leading-snug">
                    <span className="text-foreground">{c.titre}</span>
                    {c.detail && <span> — {c.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};
