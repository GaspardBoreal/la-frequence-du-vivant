import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackOptions {
  explorationId?: string;
  marcheEventId?: string;
  metadata?: Record<string, unknown>;
}

const DEBOUNCE_MS = 2000;

export function useActivityTracker() {
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const trackActivity = useCallback(
    (userId: string, eventType: string, eventTarget: string, options?: TrackOptions) => {
      if (!userId) return;

      const key = `${eventType}:${eventTarget}`;

      // If this exact same event is already pending, skip
      if (pendingRef.current.has(key)) return;

      const timer = setTimeout(async () => {
        pendingRef.current.delete(key);
        try {
          await supabase.from('marcheur_activity_logs').insert({
            user_id: userId,
            event_type: eventType,
            event_target: eventTarget,
            exploration_id: options?.explorationId || null,
            marche_event_id: options?.marcheEventId || null,
            metadata: {
              ...options?.metadata,
              user_agent: navigator.userAgent,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {
          // fire-and-forget
        }
      }, DEBOUNCE_MS);

      pendingRef.current.set(key, timer);
    },
    []
  );

  return { trackActivity };
}
