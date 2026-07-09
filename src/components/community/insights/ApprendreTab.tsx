import React, { useState, useCallback } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, FlaskConical, Share2, TrendingUp, TreePine, Headphones, BookOpen, Lightbulb, ChevronDown, Baby, Rocket, ArrowRight, Maximize2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useInsightCards } from '@/hooks/useInsightCards';
import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { ROLE_CONFIG } from '@/hooks/useCommunityProfile';
import RoleBadge from '@/components/community/RoleBadge';
import type { InsightAngle, InsightEventType, InsightCategory, InsightCard } from '@/lib/insightLevels';
import { CATEGORY_CONFIG, getLevelRank } from '@/lib/insightLevels';
import { LIVING_PILLARS, ROLE_MISSIONS, type LivingPillarKey } from '@/lib/marchesVivantFramework';
import ValorizationBlock from './ValorizationBlock';
import CeQueNousAvonsVu from './curation/CeQueNousAvonsVu';
import { useDiscoverFullscreen } from '@/components/biodiversity/discover/DiscoverFullscreenProvider';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { DiscoverMode } from '@/components/biodiversity/discover/DiscoverFullscreen';

function getIcon(name: string): React.FC<any> {
  return (LucideIcons as any)[name] || Lightbulb;
}

const CATEGORY_ORDER: InsightCategory[] = ['formation', 'inspiration', 'experimentation', 'partage', 'valorisation'];

const pillarAngleMap: Record<LivingPillarKey, InsightAngle> = {
  oeil: 'biodiversite',
  main: 'biodiversite',
  coeur: 'geopoetique',
  palais: 'biodiversite',
  oreille: 'bioacoustique',
};

interface ApprendreTabProps {
  userLevel: CommunityRoleKey;
  eventType: InsightEventType | null;
  explorationId?: string;
  marcheEventId?: string;
  totalSpecies?: number;
  userId?: string;
  onNavigateToMarche?: (marcheId: string) => void;
  initialSubTab?: 'decouvertes' | 'apprendre-creer';
  initialSensory?: 'oeil' | 'main' | 'oreille' | 'coeur' | 'palais';
  /** Espèces prêtes à alimenter le Mode Découverte plein écran (CTA en tête). */
  discoverSpecies?: BiodiversitySpecies[];
}

type ApprendreSubTab = 'decouvertes' | 'apprendre-creer';

const apprendreSubTabs: { key: ApprendreSubTab; label: string }[] = [
  { key: 'decouvertes', label: 'Ce que nous avons vu' },
  { key: 'apprendre-creer', label: 'Apprendre et créer' },
];

const ApprendreTab: React.FC<ApprendreTabProps> = ({ userLevel, eventType, explorationId, marcheEventId, totalSpecies, userId, onNavigateToMarche, initialSubTab, initialSensory, discoverSpecies }) => {
  void eventType;
  const [activeSubTab, setActiveSubTab] = useState<ApprendreSubTab>(initialSubTab ?? 'decouvertes');
  const [activePillar, setActivePillar] = useState<LivingPillarKey>('oeil');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { trackActivity } = useActivityTracker();
  const activeAngle = pillarAngleMap[activePillar];

  const handlePillarChange = useCallback((pillar: LivingPillarKey) => {
    setActivePillar(pillar);
    if (userId) trackActivity(userId, 'tab_switch', `tab:apprendre:${pillar}`, { explorationId });
  }, [trackActivity, explorationId, userId]);

  const handleSubTabChange = useCallback((sub: ApprendreSubTab) => {
    setActiveSubTab(sub);
    if (userId) trackActivity(userId, 'tab_switch', `tab:apprendre:${sub}`, { explorationId });
  }, [trackActivity, explorationId, userId]);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const levelConfig = ROLE_CONFIG[userLevel];
  const nextLevelKey = levelConfig.nextRole;

  return (
    <div className="space-y-6">
      {/* Header with level badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold">Apprendre</h2>
            <p className="text-muted-foreground text-xs">Découvertes & contenus adaptés</p>
          </div>
        </div>
        <RoleBadge role={userLevel} size="sm" />
      </div>

      {/* Sous-onglets */}
      <div className="flex border-b border-border">
        {apprendreSubTabs.map(sub => {
          const isActive = activeSubTab === sub.key;
          return (
            <button
              key={sub.key}
              onClick={() => handleSubTabChange(sub.key)}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'decouvertes' && explorationId && (
        <CeQueNousAvonsVu
          explorationId={explorationId}
          marcheEventId={marcheEventId}
          onNavigateToMarche={onNavigateToMarche}
          initialSensory={initialSensory}
        />
      )}

      {activeSubTab === 'apprendre-creer' && (
        <ApprendreCreerContent
          userLevel={userLevel}
          activePillar={activePillar}
          handlePillarChange={handlePillarChange}
          activeAngle={activeAngle}
          expandedCards={expandedCards}
          toggleCard={toggleCard}
          explorationId={explorationId}
          totalSpecies={totalSpecies}
          nextLevelKey={nextLevelKey}
          discoverSpecies={discoverSpecies}
        />
      )}
    </div>
  );
};

interface ApprendreCreerContentProps {
  userLevel: CommunityRoleKey;
  activePillar: LivingPillarKey;
  handlePillarChange: (p: LivingPillarKey) => void;
  activeAngle: InsightAngle;
  expandedCards: Set<string>;
  toggleCard: (id: string) => void;
  explorationId?: string;
  totalSpecies?: number;
  nextLevelKey: CommunityRoleKey | null | undefined;
  discoverSpecies?: BiodiversitySpecies[];
}

const ApprendreCreerContent: React.FC<ApprendreCreerContentProps> = ({
  userLevel, activePillar, handlePillarChange, activeAngle, expandedCards, toggleCard,
  explorationId, totalSpecies, nextLevelKey, discoverSpecies,
}) => {
  const { cards, byCategory, isLoading } = useInsightCards({
    userLevel,
    eventType: null,
    angle: activeAngle,
    view: 'empreinte',
    displayMode: 'full',
  });

  return (
    <div className="space-y-6">

      {/* CTA « wahou » — Mode Découverte plein écran */}
      <DiscoverHeroCTA
        species={discoverSpecies ?? []}
        explorationId={explorationId}
      />



      {/* 5 pillars selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {LIVING_PILLARS.map(pillar => {
          const PillarIcon = getIcon(pillar.icon);
          const isActive = activePillar === pillar.key;
          return (
            <button
              key={pillar.key}
              onClick={() => handlePillarChange(pillar.key)}
              className={`min-h-16 rounded-xl border px-3 py-2 text-left transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold"><PillarIcon className="h-3.5 w-3.5" />{pillar.label}</span>
              <span className="mt-1 block text-[10px] leading-tight opacity-80">{pillar.verb}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          {React.createElement(getIcon(LIVING_PILLARS.find(p => p.key === activePillar)?.icon || 'Lightbulb'), { className: 'mt-0.5 h-4 w-4 text-primary' })}
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-foreground">{LIVING_PILLARS.find(p => p.key === activePillar)?.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {(ROLE_MISSIONS[userLevel] || []).map((mission) => (
                <span key={mission} className="rounded-full border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">{mission}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Cards by category */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAngle}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {CATEGORY_ORDER.filter(cat => byCategory[cat]?.length).map(category => {
              const catConfig = CATEGORY_CONFIG[category];
              const CatIcon = getIcon(catConfig.icon);
              const catCards = byCategory[category] || [];

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <CatIcon className={`w-4 h-4 ${catConfig.color}`} />
                    <h3 className={`text-sm font-semibold ${catConfig.color}`}>{catConfig.label}</h3>
                    <span className="text-muted-foreground text-[10px]">({catCards.length})</span>
                  </div>

                  <div className="space-y-2">
                    {catCards.map(card => {
                      const CardIcon = getIcon(card.icon_name);
                      const isExpanded = expandedCards.has(card.id);

                      return (
                        <motion.div
                          key={card.id}
                          layout
                          className="rounded-xl border border-border bg-card overflow-hidden"
                        >
                          <button
                            onClick={() => toggleCard(card.id)}
                            className="w-full text-left px-4 py-3 flex items-start gap-3"
                          >
                            <div className={`w-8 h-8 rounded-lg ${catConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                              <CardIcon className={`w-4 h-4 ${catConfig.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground text-sm font-medium leading-snug">{card.title}</p>
                              {!isExpanded && (
                                <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                                  {card.content.replace(/\*\*/g, '').slice(0, 80)}…
                                </p>
                              )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-0">
                                  <div className="pl-11 text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                                    {card.content.replace(/\*\*/g, '')}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {cards.length === 0 && (
              <div className="text-center py-12">
                <Lightbulb className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Aucun contenu disponible pour cette combinaison</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Essayez un autre angle de vue</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Valorization block for Ambassadeur+ */}
      {getLevelRank(userLevel) >= getLevelRank('ambassadeur') && (
        <ValorizationBlock
          explorationId={explorationId}
          totalSpecies={totalSpecies}
          userLevel={userLevel}
        />
      )}

      {/* Next level teaser */}
      {nextLevelKey && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
          <p className="text-muted-foreground text-xs mb-2">
            Progressez vers le niveau suivant pour débloquer plus de contenus
          </p>
          <RoleBadge role={nextLevelKey} size="sm" />
          <p className="text-muted-foreground/60 text-[10px] mt-2">{ROLE_CONFIG[nextLevelKey].description}</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Discover Hero CTA — "wahou" entry point to the Mode Découverte plein écran
// ─────────────────────────────────────────────────────────────────────────────

interface DiscoverHeroCTAProps {
  species: BiodiversitySpecies[];
  explorationId?: string;
}

const DISCOVER_MODE_CARDS: Array<{
  mode: DiscoverMode;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  glow: string;
  ring: string;
}> = [
  { mode: 'kids', label: 'Enfant', desc: '4 mini-jeux', Icon: Baby, glow: 'from-amber-400/40 to-rose-400/20', ring: 'ring-amber-300/40' },
  { mode: 'immersive', label: 'Immersif', desc: 'Carrousel', Icon: Sparkles, glow: 'from-emerald-400/40 to-cyan-400/20', ring: 'ring-emerald-300/50' },
  { mode: 'prospective', label: 'Prospectif 2100', desc: '+3°C', Icon: Rocket, glow: 'from-fuchsia-500/40 to-cyan-500/20', ring: 'ring-fuchsia-300/50' },
];

const DiscoverHeroCTA: React.FC<DiscoverHeroCTAProps> = ({ species, explorationId }) => {
  const { openDiscover } = useDiscoverFullscreen();
  const count = species.length;
  const disabled = count === 0;
  const filtersLabel = 'Toutes les espèces de l\'exploration';

  const launch = (initialMode: DiscoverMode = 'hub') => {
    if (disabled) return;
    openDiscover({ species, explorationId, filtersLabel, initialMode });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-950/50 via-violet-950/40 to-cyan-950/40 p-5 sm:p-7">
      {/* Aurora halos */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/80 mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Mode Découverte
            {count > 0 && <span className="text-white/40 normal-case tracking-normal">· {count} espèce{count > 1 ? 's' : ''} prête{count > 1 ? 's' : ''}</span>}
          </p>
          <h3 className="text-white text-xl sm:text-2xl font-light tracking-tight leading-tight">
            Entrez en <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent font-normal">plein écran</span>
          </h3>
          <p className="mt-1.5 text-white/60 text-xs sm:text-sm max-w-md">
            Trois portes d'entrée dans le vivant — apprendre en jouant, contempler, ou se projeter en 2100.
          </p>
        </div>
        <div className="hidden sm:flex h-10 w-10 shrink-0 rounded-full bg-white/10 backdrop-blur border border-white/15 items-center justify-center">
          <Maximize2 className="w-4 h-4 text-white/70" />
        </div>
      </div>

      {/* Mode chips */}
      <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {DISCOVER_MODE_CARDS.map((c) => (
          <motion.button
            key={c.mode}
            type="button"
            onClick={() => launch(c.mode)}
            disabled={disabled}
            whileHover={disabled ? undefined : { y: -3, scale: 1.02 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={`group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] ring-1 ${c.ring} px-3 py-3 text-left transition disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.glow} opacity-40 group-hover:opacity-80 transition`} />
            <div className="relative flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <c.Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight truncate">{c.label}</p>
                <p className="text-white/50 text-[10px] leading-tight truncate">{c.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Main CTA */}
      <div className="relative mt-5 flex items-center justify-between gap-3">
        <p className="text-white/40 text-[10px] hidden sm:block">
          {disabled ? 'Aucune espèce collectée pour l\'instant' : 'Esc pour fermer · H pour revenir au hub'}
        </p>
        <motion.button
          type="button"
          onClick={() => launch('hub')}
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.03 }}
          whileTap={disabled ? undefined : { scale: 0.97 }}
          className="relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-600 shadow-lg shadow-fuchsia-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-400/40 via-violet-400/40 to-cyan-400/40 blur-md"
            animate={disabled ? undefined : { opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative">Entrer en plein écran</span>
          <ArrowRight className="relative w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default ApprendreTab;

