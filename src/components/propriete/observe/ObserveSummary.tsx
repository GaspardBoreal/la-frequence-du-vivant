import React from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Printer, RotateCcw, ArrowRight } from 'lucide-react';
import { OBSERVE_BLOCKS, SENSORIAL_FIELDS, type ObserveBlock } from './observeConfig';
import { describeBlock, hasRisk, riskLabels } from './summarizeAnswers';
import { SiteSignature } from './SiteSignature';

interface Props {
  answers: Record<string, string[]>;
  sensorial: Record<string, any>;
  completedAt: string | null;
  onEditBlock: (blockId: string) => void;
  onReopenAll: () => void;
  onNextStep?: () => void;
  propertyName?: string;
  /** Ouvre la modale de choix d'impression (fournie par le parent) */
  onPrint?: () => void;
  /** Mode "rendu pour impression combinée" : masque actions écran, garde le cartouche print */
  printOnly?: boolean;
}

const num = (n: number) => String(n).padStart(2, '0');

const ChipRow: React.FC<{ block: ObserveBlock; selected: string[] }> = ({
  block,
  selected,
}) => {
  const picks = block.choices.filter((c) => selected.includes(c.value));
  if (picks.length === 0) {
    return (
      <p className="mb-2 text-xs italic text-[hsl(var(--ds-forest-deep))]/40">
        — Non renseigné —
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {picks.map((c) => (
        <span
          key={c.value}
          className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-cream))] px-2.5 py-1 text-sm text-[hsl(var(--ds-forest-deep))] shadow-sm print:shadow-none"
        >
          <span aria-hidden className="text-base leading-none">{c.icon}</span>
          <span className="font-medium">{c.label}</span>
        </span>
      ))}
    </div>
  );
};

export const ObserveSummary: React.FC<Props> = ({
  answers,
  sensorial,
  completedAt,
  onEditBlock,
  onReopenAll,
  onNextStep,
  propertyName,
}) => {
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';
  const intensity =
    typeof sensorial?.intensity === 'number' ? sensorial.intensity : 5;

  const first7 = OBSERVE_BLOCKS.slice(0, 7);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="observe-print-root relative bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-line))] shadow-[0_10px_40px_-15px_rgba(22,48,32,0.15)] p-8 md:p-14 overflow-hidden print:shadow-none print:border-0"
    >
      {/* Cartouche impression — visible uniquement à l'impression */}
      <div className="hidden print:block mb-8">
        <div className="border-t-2 border-b-2 border-[hsl(var(--ds-gold))] py-6 text-center">
          <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-[hsl(var(--ds-forest))]/70">
            Diagnostic Propriété · Étape 1
          </div>
          <h1 className="mt-3 font-serif italic text-4xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ?? 'Portrait de la Propriété'}
          </h1>
          <div className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/70">
            Validé le {dateStr} · Fréquence du Vivant
          </div>
        </div>
      </div>

      {/* Sceau daté (masqué à l'impression) */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 w-32 h-32 flex items-center justify-center rotate-12 pointer-events-none z-10 print:hidden">
        <svg className="absolute inset-0 w-full h-full text-[hsl(var(--ds-forest-deep))]" viewBox="0 0 100 100">
          <defs>
            <path
              id="observe-seal-circle"
              d="M 15,50 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
              fill="transparent"
            />
          </defs>
          <text className="fill-current" style={{ fontSize: '7px', letterSpacing: '2px', fontWeight: 700 }}>
            <textPath href="#observe-seal-circle">
              DIAGNOSTIC PROPRIÉTÉ • FRÉQUENCE DU VIVANT •
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
            Étape 1
          </span>
        </div>
      </div>

      {/* Header écran */}
      <header className="mb-6 md:mb-8 border-b border-[hsl(var(--ds-line))] pb-6 pr-32 print:hidden">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
          Étape 1 — Terminée
        </span>
        <h2 className="mt-2 font-serif italic text-4xl md:text-5xl text-[hsl(var(--ds-forest-deep))] leading-tight">
          {propertyName ? `Portrait — ${propertyName}` : 'Portrait de la Propriété'}
        </h2>
        <p className="mt-3 text-sm md:text-base text-[hsl(var(--ds-forest-deep))]/70 max-w-xl">
          Synthèse des observations réalisées sur site. Ce portrait constitue le
          socle écologique du projet.
        </p>
      </header>

      {/* Signature du site — glyphe unique */}
      <SiteSignature answers={answers} sensorial={sensorial} dateStr={dateStr} />


      {/* Grille synthèse — 7 premiers blocs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        {first7.map((b) => {
          const sel = answers[b.id] ?? [];
          const risky = hasRisk(sel);
          const risks = riskLabels(b, sel);
          return (
            <div
              key={b.id}
              className={
                risky
                  ? 'group relative -m-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200/70'
                  : 'group relative'
              }
            >
              <button
                onClick={() => onEditBlock(b.id)}
                className={
                  'absolute -right-1 top-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/15'
                }
                title={`Modifier ${b.category}`}
                aria-label={`Modifier ${b.category}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <h3
                  className={
                    risky
                      ? 'text-[11px] uppercase tracking-[0.2em] font-bold text-amber-700'
                      : 'text-[11px] uppercase tracking-[0.2em] font-bold text-[hsl(var(--ds-forest))]'
                  }
                >
                  {num(b.number)}. {b.category}
                </h3>
                {risky && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-tight">
                    Attention
                  </span>
                )}
              </div>

              <ChipRow block={b} selected={sel} />

              <p
                className={
                  risky
                    ? 'text-[hsl(var(--ds-forest-deep))] font-medium leading-relaxed'
                    : 'text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed'
                }
              >
                {describeBlock(b, sel)}
              </p>

              {risky && risks.length > 0 && (
                <p className="mt-1 text-[11px] uppercase tracking-widest text-amber-700 font-bold">
                  {risks.join(' · ')}
                </p>
              )}
            </div>
          );
        })}

        {/* Bloc 8 — L'Âme du Lieu, pleine largeur */}
        <div className="md:col-span-2 group relative mt-4 pt-8 border-t border-[hsl(var(--ds-line))]">
          <button
            onClick={() => onEditBlock('sensorial')}
            className="absolute right-0 top-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/15"
            title="Modifier l'analyse sensorielle"
            aria-label="Modifier l'analyse sensorielle"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
                08. Analyse sensorielle
              </span>
              <h3 className="mt-1 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))]">
                L'Âme du Lieu
              </h3>
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70 font-bold mb-1.5">
                Ambiance ressentie
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      i < intensity
                        ? 'w-4 h-1.5 bg-[hsl(var(--ds-forest))]'
                        : 'w-4 h-1.5 bg-[hsl(var(--ds-line))]'
                    }
                  />
                ))}
                <span className="ml-2 text-xs font-bold text-[hsl(var(--ds-forest-deep))]">
                  {intensity}/10
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {SENSORIAL_FIELDS.map((f) => {
              const v = sensorial?.[f.key];
              return (
                <div key={f.key}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm" aria-hidden>
                      {f.icon}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--ds-forest))]/70">
                      {f.label}
                    </span>
                  </div>
                  <p className="text-sm text-[hsl(var(--ds-forest-deep))] italic min-h-[1.25rem]">
                    {v && String(v).trim() ? String(v) : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / actions */}
      <footer className="mt-12 pt-6 border-t border-[hsl(var(--ds-line))] flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full border border-[hsl(var(--ds-forest))] flex items-center justify-center text-[hsl(var(--ds-forest))]">
            <Check className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium text-[hsl(var(--ds-forest-deep))]">
            Observation verrouillée · prête pour le rapport client
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              document.body.classList.add('observe-printing');
              const cleanup = () => {
                document.body.classList.remove('observe-printing');
                window.removeEventListener('afterprint', cleanup);
              };
              window.addEventListener('afterprint', cleanup);
              setTimeout(() => window.print(), 50);
            }}
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
          {onNextStep && (
            <button
              onClick={onNextStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-forest-deep))] transition-colors rounded"
            >
              J'analyse le sol <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>
    </motion.article>
  );
};
