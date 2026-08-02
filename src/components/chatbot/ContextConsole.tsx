import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gauge, Check, Sparkles, Trash2, Copy, Download, Eye, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFullscreenSurfaceOpen, CHAT_Z } from '@/lib/uiOverlayLevel';

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
import {
  buildBordereau,
  serializeProvider,
  copyText,
  downloadFile,
} from '@/lib/contextExport';
import { ContextBordereau } from './ContextBordereau';
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
  /** UI spécialisée injectée en tête d'un groupe (ex : plateau des ouvrages). */
  groupExtras?: Record<string, React.ReactNode>;
  /** Nom de la fiche courante (propriété, marche…) porté sur le bordereau. */
  subject?: string | null;
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
  groupExtras,
  subject,
}) => {
  const activeSet = useMemo(() => new Set(activeKeys), [activeKeys]);


  const groups = useMemo(() => {
    const map = new Map<string, ContextProvider[]>();
    for (const p of providers) {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    }
    // Les groupes porteurs d'une UI spécialisée (plateau des ouvrages…) doivent
    // exister même sans provider : sinon l'utilisateur ne peut jamais faire la
    // sélection qui, précisément, crée le provider.
    for (const g of Object.keys(groupExtras ?? {})) {
      if (!map.has(g)) map.set(g, []);
    }
    const ORDER = ['Vivant', 'Sol', 'Ouvrages', 'Site', 'Flore'];
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b);
    });
  }, [providers, groupExtras]);

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

  const activeProviders = useMemo(
    () => providers.filter((p) => activeSet.has(contextSliceKey(p.id))),
    [providers, activeSet],
  );
  const activeCount = activeProviders.length;
  const fullscreenOpen = useFullscreenSurfaceOpen();

  /* ---- Transparence : copier / exporter les contextes ---- */
  const [bordereau, setBordereau] = useState<{ providers: ContextProvider[]; single: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const flashCopied = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1600);
  };

  const copyOne = async (p: ContextProvider) => {
    if (await copyText(serializeProvider(p, 'markdown').content)) flashCopied(p.id);
  };
  const downloadOne = (p: ContextProvider) => downloadFile(serializeProvider(p, 'markdown'));

  const bordereauFile = () =>
    buildBordereau(activeProviders, { title, subject, baseBytes }, 'markdown');
  const copyAll = async () => {
    if (await copyText(bordereauFile().content)) flashCopied('__all__');
  };
  const overlayZ = fullscreenOpen ? CHAT_Z.aboveFullscreen + 100 : 1300;




  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: fullscreenOpen ? CHAT_Z.aboveFullscreen + 100 : 1300 }}
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

              {/* Transparence : emporter la sélection complète */}
              {activeCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    onClick={() => setBordereau({ providers: activeProviders, single: false })}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-400/20 transition-colors"
                  >
                    <ScrollText className="h-3 w-3" />
                    Bordereau
                  </button>
                  <button
                    onClick={copyAll}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {copiedId === '__all__' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedId === '__all__' ? 'Copié' : 'Copier tout'}
                  </button>
                  <button
                    onClick={() => downloadFile(bordereauFile())}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Exporter
                  </button>
                </div>
              )}


              {/* Récapitulatif vivant des contextes retenus */}
              <AnimatePresence initial={false}>
                {activeProviders.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                        Transmis
                      </span>
                      {activeProviders.map((p) => (
                        <motion.button
                          key={p.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => toggle(p)}
                          title="Retirer ce contexte"
                          className="group inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10.5px] font-medium text-primary hover:bg-primary/25 transition-colors"
                        >
                          <span>{p.emoji}</span>
                          <span className="max-w-[10rem] truncate">{p.label}</span>
                          <X className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Liste des contextes */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {groups.map(([group, items]) => {
                const groupActive = items.filter((p) => activeSet.has(contextSliceKey(p.id))).length;
                return (
                <div key={group}>
                  <div className="flex items-center gap-2 px-1 pb-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    <span className="h-px flex-1 bg-border/70" />
                    {groupActive > 0 && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-[1px] text-[9.5px] font-semibold text-primary tabular-nums">
                        {groupActive} actif{groupActive > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {groupExtras?.[group]}
                  <div className="space-y-1.5">
                    {items.map((p) => {
                      const active = activeSet.has(contextSliceKey(p.id));
                      const empty = p.bytes <= 2;
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={empty ? -1 : 0}
                          aria-pressed={active}
                          onClick={() => !empty && toggle(p)}
                          onKeyDown={(e) => {
                            if (!empty && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              toggle(p);
                            }
                          }}
                          className={cn(
                            'group/ctx relative w-full overflow-hidden text-left rounded-xl border px-3 py-2.5 pl-4 transition-all duration-200',
                            active
                              ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/40 shadow-[0_0_0_3px_hsl(var(--primary)/0.07),0_6px_18px_-10px_hsl(var(--primary)/0.6)]'
                              : 'border-border bg-background/60 hover:bg-muted/60 hover:border-border',
                            empty ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
                          )}
                        >

                          {active && (
                            <motion.span
                              layoutId={`ctx-rail-${p.id}`}
                              className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-primary"
                            />
                          )}
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base leading-none transition-colors',
                                active ? 'bg-primary/20' : 'bg-muted/50',
                              )}
                            >
                              {p.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'text-[13px] truncate',
                                    active ? 'font-semibold text-primary' : 'font-medium text-foreground',
                                  )}
                                >
                                  {p.label}
                                </span>
                                {active && (
                                  <motion.span
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                  >
                                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                  </motion.span>
                                )}
                              </div>
                              {p.hint && (
                                <p
                                  className={cn(
                                    'text-[11px] leading-snug mt-0.5 line-clamp-2',
                                    active ? 'text-foreground/75' : 'text-muted-foreground',
                                  )}
                                >
                                  {p.hint}
                                </p>
                              )}
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] tabular-nums border',
                                active
                                  ? 'border-primary/40 bg-primary text-primary-foreground'
                                  : 'border-border/60 text-muted-foreground',
                              )}
                            >
                              {empty ? '—' : formatBytes(p.bytes)}
                            </span>
                          </div>

                          {/* Transparence : lire, copier, emporter ce contexte */}
                          {!empty && (
                            <div className="mt-1.5 flex items-center gap-1 pl-9 opacity-0 transition-opacity duration-200 group-hover/ctx:opacity-100 focus-within:opacity-100 group-focus/ctx:opacity-100">
                              {[
                                {
                                  key: 'eye',
                                  icon: <Eye className="h-3 w-3" />,
                                  label: 'Lire',
                                  run: () => setBordereau({ providers: [p], single: true }),
                                },
                                {
                                  key: 'copy',
                                  icon:
                                    copiedId === p.id ? (
                                      <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    ),
                                  label: copiedId === p.id ? 'Copié' : 'Copier',
                                  run: () => void copyOne(p),
                                },
                                {
                                  key: 'dl',
                                  icon: <Download className="h-3 w-3" />,
                                  label: 'Fichier',
                                  run: () => downloadOne(p),
                                },
                              ].map((a) => (
                                <button
                                  key={a.key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    a.run();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                  {a.icon}
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                      );
                    })}
                  </div>
                </div>
                );
              })}

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
