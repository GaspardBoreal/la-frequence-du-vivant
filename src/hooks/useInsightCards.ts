import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import {
  type InsightCard,
  type InsightAngle,
  type InsightEventType,
  type InsightCategory,
  filterInsightCards,
} from '@/lib/insightLevels';

interface UseInsightCardsParams {
  userLevel: CommunityRoleKey;
  eventType: InsightEventType | null;
  angle: InsightAngle;
  view: 'empreinte' | 'marche';
  displayMode?: 'card' | 'full';
}

export function useInsightCards(params: UseInsightCardsParams) {
  const { userLevel, eventType, angle, view, displayMode } = params;

  const { data: allCards = [], isLoading } = useQuery({
    queryKey: ['insight-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insight_cards')
        .select('*')
        .eq('active', true)
        .order('ordre');
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category as InsightCategory,
        min_level: row.min_level as CommunityRoleKey,
        event_types: row.event_types as InsightEventType[],
        angles: row.angles as InsightAngle[],
        view: row.view as 'empreinte' | 'marche' | 'both',
        display_mode: row.display_mode as 'card' | 'full' | 'both',
        icon_name: row.icon_name || 'Lightbulb',
        ordre: row.ordre,
      })) as InsightCard[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filteredCards = useMemo(
    () => filterInsightCards(allCards, userLevel, eventType, angle, view, displayMode),
    [allCards, userLevel, eventType, angle, view, displayMode],
  );

  const byCategory = useMemo(() => {
    const map: Partial<Record<InsightCategory, InsightCard[]>> = {};
    for (const card of filteredCards) {
      if (!map[card.category]) map[card.category] = [];
      map[card.category]!.push(card);
    }
    return map;
  }, [filteredCards]);

  return { cards: filteredCards, byCategory, isLoading };
}
