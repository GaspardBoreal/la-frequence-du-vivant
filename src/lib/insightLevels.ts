import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';

/** Numeric rank for cumulative level filtering */
const LEVEL_RANK: Record<string, number> = {
  marcheur_en_devenir: 0,
  marcheur: 1,
  eclaireur: 2,
  ambassadeur: 3,
  sentinelle: 4,
};

export type InsightCategory = 'formation' | 'inspiration' | 'experimentation' | 'partage' | 'valorisation';
export type InsightAngle = 'biodiversite' | 'bioacoustique' | 'geopoetique';
export type InsightEventType = 'agroecologique' | 'eco_poetique' | 'eco_tourisme';

export interface InsightCard {
  id: string;
  title: string;
  content: string;
  category: InsightCategory;
  min_level: CommunityRoleKey;
  event_types: InsightEventType[];
  angles: InsightAngle[];
  view: 'empreinte' | 'marche' | 'both';
  display_mode: 'card' | 'full' | 'both';
  icon_name: string;
  ordre: number;
  isAI?: boolean;
}

export function getLevelRank(level: string): number {
  return LEVEL_RANK[level] ?? 0;
}

/** Check if userLevel >= card's min_level (cumulative access) */
export function canAccessLevel(userLevel: CommunityRoleKey, cardMinLevel: CommunityRoleKey): boolean {
  return getLevelRank(userLevel) >= getLevelRank(cardMinLevel);
}

/** Filter cards for a given context */
export function filterInsightCards(
  cards: InsightCard[],
  userLevel: CommunityRoleKey,
  eventType: InsightEventType | null,
  angle: InsightAngle,
  view: 'empreinte' | 'marche',
  displayMode?: 'card' | 'full',
): InsightCard[] {
  return cards.filter(card => {
    if (!canAccessLevel(userLevel, card.min_level)) return false;
    if (card.view !== 'both' && card.view !== view) return false;
    if (displayMode && card.display_mode !== 'both' && card.display_mode !== displayMode) return false;
    if (eventType && !card.event_types.includes(eventType)) return false;
    if (!card.angles.includes(angle)) return false;
    return true;
  }).sort((a, b) => a.ordre - b.ordre);
}

export const CATEGORY_CONFIG: Record<InsightCategory, { label: string; icon: string; color: string; bgColor: string }> = {
  formation: { label: 'Se former', icon: 'GraduationCap', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
  inspiration: { label: 'S\'inspirer', icon: 'Sparkles', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  experimentation: { label: 'Expérimenter', icon: 'FlaskConical', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  partage: { label: 'Partager', icon: 'Share2', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
  valorisation: { label: 'Valoriser', icon: 'TrendingUp', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' },
};

export const ANGLE_CONFIG: Record<InsightAngle, { label: string; icon: string }> = {
  biodiversite: { label: 'Biodiversité', icon: 'TreePine' },
  bioacoustique: { label: 'Bioacoustique', icon: 'Headphones' },
  geopoetique: { label: 'Géopoétique', icon: 'BookOpen' },
};
