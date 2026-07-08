import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GitBranch, Network, X, PanelRightClose, PanelRightOpen, MessageCircle } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import type { TrophicChainResult, TrophicStar } from '@/hooks/useTrophicChain';
import { getLevelMeta, probablePreyGroups, type TrophicGroup } from '@/lib/trophicClassification';
import { ConstellationTab } from '@/components/community/synthese/trophic/ConstellationTab';
import { SpiraleTab } from '@/components/community/synthese/trophic/SpiraleTab';
import { ReseauTab } from '@/components/community/synthese/trophic/ReseauTab';
import { TrophicSourceLegend } from '@/components/community/synthese/trophic/TrophicSourceLegend';
import {
  DefaultPanel,
  SelectedStarPanel,
  type TrophicSpeciesPoolEntry,
} from '@/components/community/synthese/trophic/_panels';
import { SpeciesName } from '@/components/species/SpeciesName';

export type TrophicViewKey = 'constellation' | 'spirale' | 'reseau';

const VIEWS: Array<{ key: TrophicViewKey; label: string; icon: typeof Sparkles; hint: string }> = [
  { key: 'constellation', label: 'Constellation', icon: Sparkles, hint: 'Orbites par niveau' },
  { key: 'spirale', label: 'Spirale', icon: GitBranch, hint: 'Flux d’énergie' },
  { key: 'reseau', label: 'Réseau', icon: Network, hint: 'Liens prédateur → proie' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scientificName: string;
  commonName?: string | null;
  chain: TrophicChainResult;
  speciesPool: TrophicSpeciesPoolEntry[];
  initialView?: TrophicViewKey;
}

type SidebarTab = 'details' | 'mange' | 'mangepar' | 'chat';

/** Resolve a star object for either the highlighted species or the user-selected one. */
function useResolvedStar(chain: TrophicChainResult, selected: TrophicStar | null, fallbackSn: string): TrophicStar | null {
  return useMemo(() => {
    if (selected) return selected;
    return chain.stars.find((s) => s.scientificName === fallbackSn) || null;
  }, [chain.stars, selected, fallbackSn]);
}

export const TrophicFullscreenModal: React.FC<Props> = ({
  open,
  onOpenChange,
  scientificName,
  commonName,
  chain,
  speciesPool,
  initialView = 'constellation',
}) => {
  const [view, setView] = useState<TrophicViewKey>(initialView);
  const [selected, setSelected] = useState<TrophicStar | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('details');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true,
  );

  // Reset selection when modal closes or the focal species changes.
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setSidebarTab('details');
    }
  }, [open]);

  useEffect(() => {
    if (open) setSelected(null);
  }, [scientificName, open]);

  // When user picks a star → switch to "Détails" tab automatically.
  useEffect(() => {
    if (selected) setSidebarTab('details');
  }, [selected]);

  const star = useResolvedStar(chain, selected, scientificName);
  const meta = star ? getLevelMeta(star.group) : null;

  const renderView = (key: TrophicViewKey) => {
    // Always pass the focal species name (selected ?? entry-point) so that
    // each tab can derive an `effectiveSelected` and keep the trophic beams
    // visible across tab switches.
    const focusSn = selected?.scientificName ?? scientificName;
    const common = {
      chain,
      speciesPool,
      highlightScientificName: focusSn,
      compact: true as const,
      onSpeciesSelect: (s: TrophicStar | null) => setSelected(s),
    };
    if (key === 'constellation') return <ConstellationTab {...common} />;
    if (key === 'spirale') return <SpiraleTab {...common} />;
    return <ReseauTab {...common} />;
  };

  // Derive prey / predators for the resolved star from the species pool.
  const preyPredators = useMemo(() => {
    if (!star) return { prey: [], pred: [] as TrophicStar[] };
    const preyGroups = probablePreyGroups(star.group);
    const prey = chain.stars.filter((s) => preyGroups.includes(s.group));
    const pred = chain.stars.filter((s) => probablePreyGroups(s.group).includes(star.group));
    return { prey, pred };
  }, [star, chain.stars]);

  const openChatWith = (prefill: string) => {
    if (typeof window === 'undefined' || !star) return;
    window.dispatchEvent(
      new CustomEvent('community-chat:open', {
        detail: {
          prefill,
          species: star.scientificName,
          speciesLabel: star.commonName || star.scientificName,
          trophic: {
            scientificName: star.scientificName,
            commonName: star.commonName,
            group: star.group,
            levelLabel: meta?.label ?? null,
            prey: preyPredators.prey.map((s) => ({
              sn: s.scientificName,
              cn: s.commonName ?? null,
              g: s.group,
            })),
            predators: preyPredators.pred.map((s) => ({
              sn: s.scientificName,
              cn: s.commonName ?? null,
              g: s.group,
            })),
          },
          autoAttachSpeciesPool: true,
        },
      }),
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-[1200] flex flex-col bg-background',

            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'duration-200 outline-none',
          )}
        >
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>
              Place trophique de {commonName || scientificName}
            </DialogPrimitive.Title>
          </VisuallyHidden.Root>

          {/* Header */}
          <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-background/95 backdrop-blur">
            <div className="min-w-0 flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Place trophique
                </p>
                <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {commonName || scientificName}
                </h3>
              </div>
              {meta && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border"
                  style={{
                    background: `hsl(var(${meta.token}) / 0.18)`,
                    color: `hsl(var(${meta.token}))`,
                    borderColor: `hsl(var(${meta.token}) / 0.4)`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(var(${meta.token}))` }} />
                  {meta.shortLabel} · {meta.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-muted/60 hover:bg-muted text-foreground text-xs font-medium transition"
                aria-label={sidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
              >
                {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                <span>{sidebarOpen ? 'Masquer' : 'Détails'}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-foreground ring-1 ring-border transition"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* View switcher */}
          <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex gap-1 p-1 bg-muted/40 rounded-xl">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                const active = view === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setView(v.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {v.label}
                  </button>
                );
              })}
            </div>
            <TrophicSourceLegend chain={chain} className="justify-end" />
          </div>

          {/* Body: canvas + sidebar */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 min-w-0 overflow-auto">
              <div className="h-full w-full flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[min(100%,calc(100vh-220px))] aspect-square">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="h-full"
                    >
                      {renderView(view)}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.aside
                  key="sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="hidden md:flex flex-col border-l border-border bg-card/40 overflow-hidden"
                >
                  <div className="w-[340px] flex flex-col h-full">
                    {/* Sidebar tabs */}
                    <div className="px-3 pt-3">
                      <div className="grid grid-cols-4 gap-1 p-1 bg-muted/40 rounded-xl">
                        {(
                          [
                            { key: 'details', label: 'Détails' },
                            { key: 'mange', label: 'Mange' },
                            { key: 'mangepar', label: 'Mangé par' },
                            { key: 'chat', label: 'Chat' },
                          ] as Array<{ key: SidebarTab; label: string }>
                        ).map((t) => {
                          const active = sidebarTab === t.key;
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setSidebarTab(t.key)}
                              className={cn(
                                'text-[11px] font-medium py-2 rounded-lg transition',
                                active
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {sidebarTab === 'details' && (
                        <>
                          {star ? (
                            <SelectedStarPanel
                              star={star}
                              chain={chain}
                              onLevelClick={() => {}}
                              onClose={() => setSelected(null)}
                              speciesPool={speciesPool}
                            />
                          ) : (
                            <DefaultPanel chain={chain} onLevelClick={() => {}} />
                          )}
                        </>
                      )}

                      {sidebarTab === 'mange' && (
                        <SpeciesList
                          title="Proies probables"
                          subtitle={
                            star
                              ? `Espèces du pool aux niveaux ${probablePreyGroups(star.group).join(', ') || '—'}`
                              : 'Sélectionnez une espèce'
                          }
                          items={preyPredators.prey}
                          onPick={(s) => setSelected(s)}
                          emptyHint="Aucune proie identifiée dans ce pool d'observations."
                        />
                      )}

                      {sidebarTab === 'mangepar' && (
                        <SpeciesList
                          title="Prédateurs probables"
                          subtitle={star ? `Espèces qui consomment ${meta?.label ?? ''}` : 'Sélectionnez une espèce'}
                          items={preyPredators.pred}
                          onPick={(s) => setSelected(s)}
                          emptyHint="Aucun prédateur identifié dans ce pool d'observations."
                        />
                      )}

                      {sidebarTab === 'chat' && (
                        <div className="space-y-3">
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Compagnon du Vivant
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            Explore{' '}
                            <span className="font-medium">
                              {star?.commonName || star?.scientificName || 'cette espèce'}
                            </span>{' '}
                            avec l'IA. Le contexte trophique et toutes les espèces de l'événement sont
                            joints automatiquement.
                          </p>
                          {star ? (
                            <ul className="space-y-2">
                              {[
                                {
                                  title: 'Rôle écologique',
                                  hint: 'Indicateur, fonction, saisonnalité',
                                  prompt: `Quel est le rôle écologique de ${star.commonName || star.scientificName}${meta ? ` (${meta.label})` : ''} dans cet écosystème ? Que nous apprend sa présence : indicateur de quoi, fonctions clés, saisonnalité, fragilités ?`,
                                },
                                {
                                  title: 'Qui la mange, qu’elle mange',
                                  hint: 'Interactions trophiques réelles du pool',
                                  prompt: `Parmi les espèces observées sur cet événement, avec lesquelles ${star.commonName || star.scientificName} interagit-elle trophiquement ? Détaille les proies probables, les prédateurs, et la nature des liens.`,
                                },
                                {
                                  title: `Comparaison ${meta ? meta.shortLabel : 'du niveau'}`,
                                  hint: 'Mise en perspective dans le pool',
                                  prompt: `Compare ${star.commonName || star.scientificName} aux autres ${meta?.label.toLowerCase() ?? 'espèces du même niveau'} observés sur cet événement : ressemblances, différences, indicateurs respectifs, ce que leur cohabitation révèle.`,
                                },
                              ].map((s) => (
                                <li key={s.title}>
                                  <button
                                    type="button"
                                    onClick={() => openChatWith(s.prompt)}
                                    className="w-full text-left p-3 rounded-xl border border-border bg-background/60 hover:bg-muted/60 hover:border-primary/40 transition group"
                                  >
                                    <div className="flex items-start gap-2">
                                      <MessageCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0 group-hover:scale-110 transition" />
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium text-foreground leading-tight">
                                          {s.title}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                          {s.hint}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Sélectionnez une espèce pour démarrer une conversation contextualisée.
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => openChatWith('')}
                            disabled={!star}
                            className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-full bg-muted/60 hover:bg-muted text-foreground text-xs font-medium transition disabled:opacity-50"
                          >
                            Discuter librement
                          </button>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                            📎 Liste des espèces de l'événement attachée automatiquement.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

const SpeciesList: React.FC<{
  title: string;
  subtitle: string;
  items: TrophicStar[];
  onPick: (s: TrophicStar) => void;
  emptyHint: string;
}> = ({ title, subtitle, items, onPick, emptyHint }) => {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
        <p className="text-[12px] text-muted-foreground/80 mt-0.5">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{emptyHint}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 30).map((s) => {
            const m = getLevelMeta(s.group);
            return (
              <li key={s.scientificName}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 text-left transition"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={m ? { backgroundColor: `hsl(var(${m.token}))` } : undefined}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <SpeciesName
                      scientificName={s.scientificName}
                      commonName={s.commonName}
                      size="sm"
                    />
                  </span>
                  {m && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: `hsl(var(${m.token}) / 0.15)`,
                        color: `hsl(var(${m.token}))`,
                      }}
                    >
                      {m.shortLabel}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TrophicFullscreenModal;
