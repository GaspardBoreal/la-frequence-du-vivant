import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackOptions {
  explorationId?: string;
  marcheEventId?: string;
  metadata?: Record<string, unknown>;
}

const DEBOUNCE_MS = 2000;

export function useActivityTracker() {
  const lastRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const trackActivity = useCallback(
    (eventType: string, eventTarget: string, options?: TrackOptions) => {
      const key = `${eventType}:${eventTarget}`;
      if (key === lastRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        lastRef.current = key;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;

          await supabase.from('marcheur_activity_logs').insert({
            user_id: session.user.id,
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
    },
    []
  );

  return { trackActivity };
}
