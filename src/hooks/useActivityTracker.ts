import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackOptions {
  explorationId?: string;
  marcheEventId?: string;
  /** Jardin concerné : tracé dans les métadonnées pour reconstituer le parcours. */
  proprieteId?: string;
  metadata?: Record<string, unknown>;
}

type PendingRow = Record<string, unknown>;

const DEBOUNCE_MS = 500;

export function useActivityTracker() {
  const pendingRef = useRef<Map<string, { timer: ReturnType<typeof setTimeout>; row: PendingRow }>>(
    new Map(),
  );

  const flushAll = useCallback(() => {
    const entries = Array.from(pendingRef.current.values());
    pendingRef.current.clear();
    if (!entries.length) return;
    entries.forEach((e) => clearTimeout(e.timer));
    void supabase
      .from('marcheur_activity_logs')
      .insert(entries.map((e) => e.row) as never)
      .then(() => undefined, () => undefined);
  }, []);

  // Ne pas perdre les dernières traces quand l'utilisateur quitte la page.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushAll();
    };
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushAll);
      flushAll();
    };
  }, [flushAll]);

  const trackActivity = useCallback(
    (userId: string, eventType: string, eventTarget: string, options?: TrackOptions) => {
      if (!userId) return;

      const key = `${eventType}:${eventTarget}:${options?.proprieteId ?? ''}`;

      // Si exactement le même évènement est déjà en attente, on ne doublonne pas.
      if (pendingRef.current.has(key)) return;

      const row: PendingRow = {
        user_id: userId,
        event_type: eventType,
        event_target: eventTarget,
        exploration_id: options?.explorationId || null,
        marche_event_id: options?.marcheEventId || null,
        metadata: {
          ...options?.metadata,
          ...(options?.proprieteId ? { propriete_id: options.proprieteId } : {}),
          user_agent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
        },
      };

      const timer = setTimeout(async () => {
        pendingRef.current.delete(key);
        try {
          await supabase.from('marcheur_activity_logs').insert(row as never);
        } catch {
          // fire-and-forget
        }
      }, DEBOUNCE_MS);

      pendingRef.current.set(key, { timer, row });
    },
    []
  );

  return { trackActivity };
}
