import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Loader2, Circle, Printer } from 'lucide-react';

export type PrintPrepStatus = 'todo' | 'doing' | 'done';

export interface PrintPrepStep {
  key: string;
  label: string;
  status: PrintPrepStatus;
  /** Compteur optionnel affiché « n / N ». */
  loaded?: number;
  total?: number;
}

interface Props {
  visible: boolean;
  /** 0 → 1 */
  progress: number;
  steps: PrintPrepStep[];
  /** Nombre de médias qui n'ont pas pu être chargés. */
  skipped?: number;
  /** Préparation terminée mais des photos manquent : l'utilisateur décide. */
  incomplete?: boolean;
  onRetryMissing?: () => void;
  onPrintAnyway?: () => void;
  onCancel?: () => void;
}

const WHISPERS = [
  'Le papier se prépare…',
  'Chaque photographie retrouve sa place.',
  'Les planches A4 se composent, une à une.',
  'On relie le portrait, le regard et la terre.',
  'Encore un instant : le carnet se relie.',
];

const PrintPreparationOverlay: React.FC<Props> = ({
  visible,
  progress,
  steps,
  skipped = 0,
  incomplete = false,
  onRetryMissing,
  onPrintAnyway,
  onCancel,
}) => {

  const reduce = useReducedMotion();
  const [whisper, setWhisper] = React.useState(0);
  const [longWait, setLongWait] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setWhisper(0);
      setLongWait(false);
      return;
    }
    const rotate = window.setInterval(() => setWhisper((w) => w + 1), 2600);
    const patience = window.setTimeout(() => setLongWait(true), 3000);
    return () => {
      window.clearInterval(rotate);
      window.clearTimeout(patience);
    };
  }, [visible]);

  if (typeof document === 'undefined') return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[hsl(var(--ds-forest-deep))]/70 backdrop-blur-sm print:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: reduce ? 1 : 0.96, opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: reduce ? 1 : 0.96, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="relative w-[min(460px,92vw)] rounded-3xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-cream))] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] p-6"
          >
            <div className="pointer-events-none absolute inset-x-5 top-3 h-px bg-[hsl(var(--ds-gold))]/50" />
            <div className="pointer-events-none absolute inset-x-5 bottom-3 h-px bg-[hsl(var(--ds-gold))]/50" />

            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[hsl(var(--ds-gold))]/60 bg-white/60">
                <Printer className="h-4 w-4 text-[hsl(var(--ds-forest))]" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--ds-forest))]/70">
                  Atelier d'impression
                </div>
                <h3 className="font-serif italic text-2xl leading-tight text-[hsl(var(--ds-forest-deep))]">
                  Le carnet se compose
                </h3>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--ds-forest))]/10">
                <motion.div
                  className="h-full rounded-full bg-[hsl(var(--ds-gold))]"
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: reduce ? 0 : 0.4, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={whisper}
                    initial={{ opacity: 0, y: reduce ? 0 : 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -4 }}
                    transition={{ duration: reduce ? 0 : 0.35 }}
                    className="font-serif italic text-[13px] text-[hsl(var(--ds-forest-deep))]/75"
                  >
                    {WHISPERS[whisper % WHISPERS.length]}
                  </motion.span>
                </AnimatePresence>
                <span className="tabular-nums text-[11px] font-bold text-[hsl(var(--ds-forest))]/70">
                  {pct}%
                </span>
              </div>
            </div>

            <ul className="mt-5 space-y-2.5">
              {steps.map((s) => (
                <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    {s.status === 'done' && (
                      <motion.span
                        initial={{ scale: reduce ? 1 : 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      >
                        <Check className="h-4 w-4 text-[hsl(var(--ds-forest))]" />
                      </motion.span>
                    )}
                    {s.status === 'doing' && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[hsl(var(--ds-gold))]" />
                    )}
                    {s.status === 'todo' && (
                      <Circle className="h-3 w-3 text-[hsl(var(--ds-forest))]/25" />
                    )}
                  </span>
                  <span
                    className={[
                      'flex-1 transition-colors',
                      s.status === 'done'
                        ? 'text-[hsl(var(--ds-forest-deep))]'
                        : s.status === 'doing'
                          ? 'font-medium text-[hsl(var(--ds-forest-deep))]'
                          : 'text-[hsl(var(--ds-forest-deep))]/45',
                    ].join(' ')}
                  >
                    {s.label}
                    {typeof s.total === 'number' && s.total > 0 && s.status !== 'todo' && (
                      <span className="ml-1.5 tabular-nums text-[hsl(var(--ds-forest))]/60">
                        {Math.min(s.loaded ?? 0, s.total)} / {s.total}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {incomplete ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-xl border border-[hsl(var(--ds-gold))] bg-white/70 px-3 py-2.5 text-[12.5px] text-[hsl(var(--ds-forest-deep))]/85"
              >
                <span className="font-semibold">
                  {skipped} photographie{skipped > 1 ? 's' : ''} manque
                  {skipped > 1 ? 'nt' : ''} encore à l'appel.
                </span>{' '}
                <span className="italic">
                  Le carnet attend : rien ne part incomplet sans votre accord.
                </span>
              </motion.div>
            ) : (
              longWait && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-xl border border-[hsl(var(--ds-gold))]/40 bg-white/50 px-3 py-2 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/75"
                >
                  Chaque photographie est vérifiée avant l'impression — l'aperçu s'ouvrira
                  dès que le carnet sera complet.
                </motion.p>
              )
            )}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-full border border-[hsl(var(--ds-line))] px-4 py-1.5 text-[12px] font-medium text-[hsl(var(--ds-forest-deep))]/70 transition-colors hover:border-[hsl(var(--ds-gold))]/60 hover:text-[hsl(var(--ds-forest-deep))]"
                >
                  Annuler
                </button>
              )}
              {incomplete && onPrintAnyway && (
                <button
                  type="button"
                  onClick={onPrintAnyway}
                  className="rounded-full border border-[hsl(var(--ds-line))] px-4 py-1.5 text-[12px] font-medium text-[hsl(var(--ds-forest-deep))]/70 transition-colors hover:border-[hsl(var(--ds-gold))]/60 hover:text-[hsl(var(--ds-forest-deep))]"
                >
                  Imprimer quand même
                </button>
              )}
              {incomplete && onRetryMissing && (
                <button
                  type="button"
                  onClick={onRetryMissing}
                  className="rounded-full bg-[hsl(var(--ds-forest))] px-4 py-1.5 text-[12px] font-semibold text-[hsl(var(--ds-cream))] transition-opacity hover:opacity-90"
                >
                  Réessayer les manquantes
                </button>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default PrintPreparationOverlay;
