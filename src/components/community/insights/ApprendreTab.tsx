import React, { useState, useCallback } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, FlaskConical, Share2, TrendingUp, TreePine, Headphones, BookOpen, Lightbulb, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useInsightCards } from '@/hooks/useInsightCards';
import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { ROLE_CONFIG } from '@/hooks/useCommunityProfile';
import RoleBadge from '@/components/community/RoleBadge';
import type { InsightAngle, InsightEventType, InsightCategory, InsightCard } from '@/lib/insightLevels';
import { CATEGORY_CONFIG, ANGLE_CONFIG, getLevelRank } from '@/lib/insightLevels';
import { LIVING_PILLARS, ROLE_MISSIONS, type LivingPillarKey } from '@/lib/marchesVivantFramework';
import ValorizationBlock from './ValorizationBlock';

function getIcon(name: string): React.FC<any> {
  return (LucideIcons as any)[name] || Lightbulb;
}

const CATEGORY_ORDER: InsightCategory[] = ['formation', 'inspiration', 'experimentation', 'partage', 'valorisation'];

const angleIcons: Record<InsightAngle, React.FC<any>> = {
  biodiversite: TreePine,
  bioacoustique: Headphones,
  geopoetique: BookOpen,
};

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
  totalSpecies?: number;
  userId?: string;
}

const ApprendreTab: React.FC<ApprendreTabProps> = ({ userLevel, eventType, explorationId, totalSpecies, userId }) => {
  const [activePillar, setActivePillar] = useState<LivingPillarKey>('oeil');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { trackActivity } = useActivityTracker();
  const activeAngle = pillarAngleMap[activePillar];

  const handlePillarChange = useCallback((pillar: LivingPillarKey) => {
    setActivePillar(pillar);
    if (userId) trackActivity(userId, 'tab_switch', `tab:apprendre:${pillar}`, { explorationId });
  }, [trackActivity, explorationId, userId]);

  const { cards, byCategory, isLoading } = useInsightCards({
    userLevel,
    eventType,
    angle: activeAngle,
    view: 'empreinte',
    displayMode: 'full',
  });

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
            <h2 className="text-foreground text-base font-semibold">Apprendre & Créer</h2>
            <p className="text-muted-foreground text-xs">Contenus adaptés à votre niveau</p>
          </div>
        </div>
        <RoleBadge role={userLevel} size="sm" />
      </div>

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

export default ApprendreTab;
