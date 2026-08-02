import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Printer, Check, ScrollText } from 'lucide-react';
import type { ContextProvider } from '@/hooks/useChatPageContext';
import {
  EXPORT_FORMATS,
  buildBordereau,
  serializeProvider,
  copyText,
  downloadFile,
  type ExportFormat,
} from '@/lib/contextExport';
import {
  ecoVerdict,
  estimateTokens,
  formatBytes,
  formatTokens,
  ECO_COLORS,
} from '@/lib/chatContextCost';
import { cn } from '@/lib/utils';

interface ContextBordereauProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subject?: string | null;
  /** Contextes à documenter (sélection active, ou un seul contexte). */
  providers: ContextProvider[];
  /** Poids des autres pièces jointes déjà attachées. */
  baseBytes?: number;
  /** Mode « un seul contexte » : pas d'en-tête bordereau. */
  single?: boolean;
  zIndex?: number;
}

/**
 * « Le Bordereau du vivant » — le document de transparence.
 *
 * Papier d'atelier posé sur la nuit : ce que l'IA reçoit, exactement, avec sa
 * part de poids, lisible, copiable, emportable.
 */
export const ContextBordereau: React.FC<ContextBordereauProps> = ({
  open,
  onClose,
  title,
  subject,
  providers,
  baseBytes = 0,
  single = false,
  zIndex = 1400,
}) => {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);

  const total = useMemo(
    () => baseBytes + providers.reduce((s, p) => s + p.bytes, 0),
    [providers, baseBytes],
  );
  const verdict = ecoVerdict(total);
  const colors = ECO_COLORS[verdict.score];

  const file = useMemo(() => {
    if (single && providers.length === 1) return serializeProvider(providers[0], format);
    return buildBordereau(providers, { title, subject, baseBytes }, format);
  }, [single, providers, format, title, subject, baseBytes]);

  const lines = useMemo(() => file.content.split('\n'), [file.content]);

  const handleCopy = async () => {
    const ok = await copyText(file.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex }}
          onClick={onClose}
          className="fixed inset-0 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4 print:static print:bg-transparent print:p-0"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="ctx-bordereau relative w-full sm:max-w-2xl max-h-[92%] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-amber-400/25 bg-card shadow-2xl"
          >
            {/* Filet doré de marge */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-amber-300/70 via-amber-400/30 to-transparent print:hidden" />

            {/* En-tête à sceau */}
            <div className="shrink-0 border-b border-border/70 bg-gradient-to-b from-amber-400/[0.07] to-transparent px-4 pt-4 pb-3 pl-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                    Bordereau du vivant
                  </p>
                  <h3 className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ScrollText className="h-4 w-4 text-amber-300" />
                    {single && providers.length === 1 ? providers[0].label : title}
                  </h3>
                  {subject && !single && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subject}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted print:hidden"
                  aria-label="Fermer le bordereau"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                <span className={cn('rounded-full border px-2 py-0.5 font-semibold', colors.bg, colors.ring, colors.text)}>
                  {verdict.label}
                </span>
                <span>{providers.length} contexte{providers.length > 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{formatBytes(total)}</span>
                <span>·</span>
                <span>{formatTokens(estimateTokens(total))}</span>
              </div>

              {/* Part de poids par bloc */}
              {!single && providers.length > 0 && (
                <div className="mt-2.5 space-y-1 print:hidden">
                  {providers.map((p, i) => {
                    const share = total > 0 ? (p.bytes / total) * 100 : 0;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i, duration: 0.25 }}
                        className="flex items-center gap-2"
                      >
                        <span className="w-4 text-center text-[11px]">{p.emoji}</span>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/80">{p.label}</span>
                        <div className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-foreground/10">
                          <motion.div
                            className="h-full rounded-full bg-amber-300/80"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, share)}%` }}
                            transition={{ delay: 0.06 * i, type: 'spring', stiffness: 180, damping: 24 }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                          {formatBytes(p.bytes)}
                        </span>
                        <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-amber-300/80">
                          {Math.round(share)} %
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Formats */}
              <div className="mt-3 inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-background/50 p-1 print:hidden">
                {EXPORT_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                      format === f.id
                        ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                    title={f.hint}
                  >
                    {f.label}
                    <span className="ml-1 text-[9.5px] opacity-60">{f.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu */}
            <div className="ctx-bordereau-paper flex-1 overflow-auto bg-background/40 px-0 py-3">
              <pre className="min-w-full text-[11.5px] leading-[1.55] font-mono text-foreground/90">
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-3 px-3 hover:bg-foreground/[0.03]">
                    <span className="w-8 shrink-0 select-none text-right text-[10px] text-muted-foreground/40 print:hidden">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{line || ' '}</span>
                  </div>
                ))}
              </pre>
            </div>

            {/* Pied */}
            <div className="shrink-0 border-t border-border/70 p-3 flex items-center gap-2 print:hidden">
              <button
                onClick={handleCopy}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                  copied
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20',
                )}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => downloadFile(file)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Télécharger
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
                title="Imprimer / PDF"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextBordereau;
