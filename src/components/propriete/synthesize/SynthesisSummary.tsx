import React from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Printer, RotateCcw, AlertTriangle } from 'lucide-react';
import type { PropertySynthesisState, SynthesisItem } from '@/hooks/propriete/usePropertySynthesis';
import type { SynthesisModel } from './synthesisModel';
import { IdentityCard } from './IdentityCard';
import { ECO_SOURCE } from '@/lib/plantIndicatorKb';

export type SynthesizeBlockId = 'context' | 'portrait' | 'atouts' | 'contraintes' | 'vigilances' | 'notes';

interface Props {
  state: PropertySynthesisState;
  model: SynthesisModel;
  completedAt: string | null;
  propertyName?: string;
  commune?: string | null;
  onEditBlock: (id: SynthesizeBlockId) => void;
  onReopenAll: () => void;
  onPrint?: () => void;
  printOnly?: boolean;
  /** p1 = cartouche + identité + portrait · p2 = atouts / contraintes / vigilances */
  printSection?: 'all' | 'p1' | 'p2';
}

const Column: React.FC<{
  eyebrow: string;
  title: string;
  items: SynthesisItem[];
  dot: string;
  head: string;
}> = ({ eyebrow, title, items, dot, head }) => (
  <div className="print-avoid-break">
    <div className={`text-[10px] font-bold tracking-[0.3em] uppercase ${head}`}>{eyebrow}</div>
    <h4 className="mt-1 mb-2 font-serif italic text-2xl text-[hsl(var(--ds-forest-deep))]">
      {title}
    </h4>
    {items.length === 0 ? (
      <p className="text-xs italic text-[hsl(var(--ds-forest-deep))]/40">— Non renseigné —</p>
    ) : (
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 print-avoid-break">
            <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            <div>
              <span className="text-sm text-[hsl(var(--ds-forest-deep))] leading-snug">
                {it.text}
              </span>
              {it.because && (
                <span className="block text-[10px] italic text-[hsl(var(--ds-forest-deep))]/50">
                  {it.because}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const SynthesisSummary: React.FC<Props> = ({
  state,
  model,
  completedAt,
  propertyName,
  commune,
  onEditBlock,
  onReopenAll,
  onPrint,
  printOnly = false,
  printSection = 'all',
}) => {
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  const showP1 = printSection === 'all' || printSection === 'p1';
  const showP2 = printSection === 'all' || printSection === 'p2';
  const isSuite = printSection === 'p2';
  const portrait = (state.portrait ?? '').trim() || model.portraitFallback;

  const Root: any = printOnly ? 'article' : motion.article;

  return (
    <Root
      {...(printOnly
        ? {}
        : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } })}
      className="synthesize-print-root relative bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-line))] shadow-[0_10px_40px_-15px_rgba(22,48,32,0.15)] p-8 md:p-14 overflow-hidden print:shadow-none print:border-0"
    >
      {/* Cartouche impression */}
      {showP1 && (
        <div className={printOnly ? 'block mb-8' : 'hidden print:block mb-8'}>
          <div className="border-t-2 border-b-2 border-[hsl(var(--ds-gold))] py-6 text-center">
            <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-[hsl(var(--ds-forest))]/70">
              Diagnostic Propriété · Étape 4
            </div>
            <h1 className="mt-3 font-serif italic text-4xl text-[hsl(var(--ds-forest-deep))] leading-tight">
              {propertyName ?? 'Synthèse du site'}
            </h1>
            <div className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/70">
              {commune ? `${commune} · ` : ''}Validé le {dateStr} · Fréquence du Vivant
            </div>
          </div>
        </div>
      )}

      {isSuite && (
        <div className="mb-8 border-b border-[hsl(var(--ds-gold))]/70 pb-5">
          <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]/70">
            Diagnostic Propriété · Étape 4 · Suite
          </div>
          <h2 className="mt-2 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ?? 'Synthèse du site'}
          </h2>
          <div className="mt-2 text-[10px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/60">
            Atouts · Contraintes · Vigilances
          </div>
        </div>
      )}

      {/* Sceau daté (écran) */}
      {!printOnly && (
        <div className="absolute top-6 right-6 md:top-8 md:right-8 w-32 h-32 flex items-center justify-center rotate-12 pointer-events-none z-10 print:hidden">
          <svg className="absolute inset-0 w-full h-full text-[hsl(var(--ds-forest-deep))]" viewBox="0 0 100 100">
            <defs>
              <path
                id="synthesize-seal-circle"
                d="M 15,50 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                fill="transparent"
              />
            </defs>
            <text className="fill-current" style={{ fontSize: '7px', letterSpacing: '2px', fontWeight: 700 }}>
              <textPath href="#synthesize-seal-circle">
                SYNTHÈSE DU SITE • FRÉQUENCE DU VIVANT •
              </textPath>
            </text>
          </svg>
          <div className="relative flex flex-col items-center justify-center text-center w-20 h-20 rounded-full border border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-cream))]">
            <span className="text-[9px] uppercase tracking-widest font-bold text-[hsl(var(--ds-gold))]">
              Validé
            </span>
            <span className="font-serif italic text-sm text-[hsl(var(--ds-forest-deep))] leading-tight">
              {dateStr}
            </span>
            <span className="text-[7px] uppercase tracking-widest text-[hsl(var(--ds-gold))]">
              Étape 4
            </span>
          </div>
        </div>
      )}

      {showP1 && (
        <>
          {!printOnly && (
            <header className="mb-8 print:hidden">
              <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]/70">
                Étape 4 · Je synthétise
              </div>
              <h2 className="mt-2 font-serif italic text-3xl md:text-4xl text-[hsl(var(--ds-forest-deep))] leading-tight">
                Le portrait écologique du site
              </h2>
            </header>
          )}

          <div className="group relative print-avoid-break">
            {!printOnly && (
              <button
                onClick={() => onEditBlock('context')}
                className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] hover:bg-[hsl(var(--ds-gold))]/15 print:hidden"
                aria-label="Modifier le contexte"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
              01. Carte d’identité écologique
            </div>
            <div className="mt-3">
              <IdentityCard lines={model.identity} compact={printOnly} />
            </div>
          </div>

          <div className="group relative mt-8 print-avoid-break">
            {!printOnly && (
              <button
                onClick={() => onEditBlock('portrait')}
                className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] hover:bg-[hsl(var(--ds-gold))]/15 print:hidden"
                aria-label="Modifier le portrait"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
              02. Portrait du site
            </div>
            <p className="mt-3 font-serif italic text-lg md:text-xl text-[hsl(var(--ds-forest-deep))] leading-relaxed whitespace-pre-line">
              {portrait}
            </p>
          </div>

          {model.missing.length > 0 && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50/60 px-3 py-2 print-avoid-break">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-700 shrink-0" />
              <p className="text-[11px] text-amber-800 leading-snug">
                Lecture partielle — {model.missing.join(' · ')}. Les conclusions restent
                provisoires tant que ces étapes ne sont pas scellées.
              </p>
            </div>
          )}
        </>
      )}

      {showP2 && (
        <div className={showP1 && !printOnly ? 'mt-10' : ''}>
          <div className={printOnly ? 'grid grid-cols-3 gap-x-8' : 'grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8'}>
            <Column
              eyebrow="03 · Ce qui porte"
              title="Atouts"
              items={state.atouts}
              dot="bg-[hsl(var(--ds-forest))]"
              head="text-[hsl(var(--ds-forest))]"
            />
            <Column
              eyebrow="04 · Ce qui limite"
              title="Contraintes"
              items={state.contraintes}
              dot="bg-[hsl(var(--ds-gold))]"
              head="text-[hsl(var(--ds-gold))]"
            />
            <Column
              eyebrow="05 · Ce qui alerte"
              title="Vigilances"
              items={state.vigilances}
              dot="bg-amber-500"
              head="text-amber-700"
            />
          </div>

          {(state.notes ?? '').trim().length > 0 && (
            <div className="mt-8 print-avoid-break">
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
                06. Note libre
              </div>
              <p className="mt-2 font-serif italic text-base text-[hsl(var(--ds-forest-deep))] leading-relaxed whitespace-pre-line">
                {state.notes}
              </p>
            </div>
          )}

          <p className="mt-8 text-[9px] leading-snug text-[hsl(var(--ds-forest-deep))]/45">
            {ECO_SOURCE} Méthode de diagnostic de site — Étape 4 « Je synthétise ».
          </p>
        </div>
      )}

      {/* Footer / actions */}
      {!printOnly && (
        <footer className="mt-12 pt-6 border-t border-[hsl(var(--ds-line))] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full border border-[hsl(var(--ds-forest))] flex items-center justify-center text-[hsl(var(--ds-forest))]">
              <Check className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-[hsl(var(--ds-forest-deep))]">
              Synthèse verrouillée · prête pour le rapport client
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[hsl(var(--ds-forest))] text-[hsl(var(--ds-forest-deep))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-forest))] hover:text-[hsl(var(--ds-cream))] transition-colors rounded"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimer
            </button>
            <button
              onClick={onReopenAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-gold))]/15 transition-colors rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Rouvrir en édition
            </button>
          </div>
        </footer>
      )}
    </Root>
  );
};
