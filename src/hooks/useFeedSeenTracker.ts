import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityFeedItem } from './useCommunityFeed';

/**
 * Log « feed_seen » et « feed_clicked » dans marcheur_activity_logs.
 * Chaque item n'est loggé qu'une fois par session.
 */
export function useFeedSeenTracker(userId: string | undefined) {
  const seenRef = useRef<Set<string>>(new Set());
  const clickedRef = useRef<Set<string>>(new Set());

  const log = useCallback(
    async (item: CommunityFeedItem, eventType: 'feed_seen' | 'feed_clicked') => {
      if (!userId) return;
      const target = item.id; // `${kind}:${sourceId}`
      const set = eventType === 'feed_seen' ? seenRef.current : clickedRef.current;
      if (set.has(target)) return;
      set.add(target);
      try {
        await supabase.from('marcheur_activity_logs').insert({
          user_id: userId,
          event_type: eventType,
          event_target: target,
          marche_event_id: item.marche.eventId,
          exploration_id: item.marche.explorationId,
          metadata: {
            kind: item.kind,
            source_id: item.sourceId,
            author_user_id: item.author.userId,
            registered: item.registered,
          },
        });
      } catch {
        // fire-and-forget
      }
    },
    [userId],
  );

  const markSeen = useCallback((item: CommunityFeedItem) => log(item, 'feed_seen'), [log]);
  const markClicked = useCallback((item: CommunityFeedItem) => log(item, 'feed_clicked'), [log]);

  return { markSeen, markClicked };
}
