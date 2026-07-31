import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gauge, Check, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  chatPageContext,
  contextSliceKey,
  type ContextProvider,
} from '@/hooks/useChatPageContext';
import {
  ecoVerdict,
  estimateTokens,
  formatBytes,
  formatTokens,
  ECO_COLORS,
} from '@/lib/chatContextCost';
import { cn } from '@/lib/utils';

interface ContextConsoleProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  providers: ContextProvider[];
  /** Clés de slices actuellement actives (`ctx.<id>`). */
  activeKeys: string[];
  /** Poids des autres pièces jointes déjà attachées (document, pool d'espèces). */
  baseBytes?: number;
}

/**
 * Console de contextes — cœur de l'IA frugale.
 *
 * L'IA ne reçoit par défaut qu'une carte d'identité minuscule. Chaque bloc de
 * données est activé explicitement ici, avec son poids affiché AVANT
 * activation, et une jauge d'éco-score qui agrège le total.
 */
export const ContextConsole: React.FC<ContextConsoleProps> = ({
  open,
  onClose,
  title = 'Console de contextes',
  providers,
  activeKeys,
  baseBytes = 0,
}) => {
  const activeSet = useMemo(() => new Set(activeKeys), [activeKeys]);

  const groups = useMemo(() => {
    const map = new Map<string, ContextProvider[]>();
    for (const p of providers) {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    }
    return Array.from(map.entries());
  }, [providers]);

  const totalBytes = useMemo(
    () =>
      baseBytes +
      providers.reduce((sum, p) => (activeSet.has(contextSliceKey(p.id)) ? sum + p.bytes : sum), 0),
    [providers, activeSet, baseBytes],
  );

  const verdict = ecoVerdict(totalBytes);
  const colors = ECO_COLORS[verdict.score];

  const toggle = (p: ContextProvider) => {
    const key = contextSliceKey(p.id);
    if (activeSet.has(key)) {
      chatPageContext.setVisibleSlice(key, undefined);
    } else {
      chatPageContext.setVisibleSlice(key, p.payload);
    }
  };

  const clearAll = () => {
    for (const p of providers) chatPageContext.setVisibleSlice(contextSliceKey(p.id), undefined);
  };

  const applyRecommended = () => {
    for (const p of providers) {
      chatPageContext.setVisibleSlice(contextSliceKey(p.id), p.recommended ? p.payload : undefined);
    }
  };

  const activeCount = providers.filter((p) => activeSet.has(contextSliceKey(p.id))).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: CHAT_Z_CONSOLE() }}
          className="fixed inset-0 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-0 sm:p-4"

          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[88%] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* En-tête + jauge */}
            <div className="shrink-0 border-b border-border bg-gradient-to-b from-primary/10 to-transparent px-4 pt-3.5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-primary" />
                    {title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    L'IA ne voit que ce que vous activez ici.
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div
                className={cn(
                  'mt-3 rounded-xl border px-3 py-2.5',
                  colors.bg,
                  colors.ring,
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn('text-xs font-semibold tracking-wide uppercase', colors.text)}>
                    {verdict.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatBytes(totalBytes)} · {formatTokens(estimateTokens(totalBytes))}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', colors.bar)}
                    initial={false}
                    animate={{ width: `${Math.max(3, verdict.ratio * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{verdict.hint}</p>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={applyRecommended}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Réglage conseillé
                </button>
                <button
                  onClick={clearAll}
                  disabled={activeCount === 0}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" />
                  Tout retirer
                </button>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                  {activeCount}/{providers.length} actif{activeCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Liste des contextes */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {groups.map(([group, items]) => (
                <div key={group}>
                  <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((p) => {
                      const active = activeSet.has(contextSliceKey(p.id));
                      const empty = p.bytes <= 2;
                      return (
                        <button
                          key={p.id}
                          onClick={() => !empty && toggle(p)}
                          disabled={empty}
                          className={cn(
                            'w-full text-left rounded-xl border px-3 py-2.5 transition-all',
                            active
                              ? 'border-primary/50 bg-primary/10 shadow-sm'
                              : 'border-border bg-background/60 hover:bg-muted/60',
                            empty && 'opacity-45 cursor-not-allowed',
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{p.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-foreground truncate">
                                  {p.label}
                                </span>
                                {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                              </div>
                              {p.hint && (
                                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                                  {p.hint}
                                </p>
                              )}
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] tabular-nums border',
                                active
                                  ? 'border-primary/30 bg-primary/15 text-primary'
                                  : 'border-border/60 text-muted-foreground',
                              )}
                            >
                              {empty ? '—' : formatBytes(p.bytes)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {providers.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Aucun contexte disponible sur cette page.
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-border p-3">
              <Button onClick={onClose} className="w-full rounded-xl">
                Utiliser ce contexte
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextConsole;
