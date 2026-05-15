import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // 2h

/**
 * On view of an exploration, if the most recent biodiversity_snapshot
 * for one of its marches is older than 2h, fire-and-forget the
 * `collect-event-biodiversity` edge function to refresh iNat data,
 * then invalidate the React Query keys that show species counts.
 *
 * This complements the daily cron and lets newly logged iNat
 * observations appear within minutes (instead of waiting 24h).
 */
export function useSnapshotsResyncOnView(explorationId?: string | null) {
  const qc = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!explorationId) return;
    if (firedRef.current === explorationId) return;
    firedRef.current = explorationId;

    let cancelled = false;
    (async () => {
      try {
        // 1. Find marche IDs of this exploration
        const { data: em } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .eq('exploration_id', explorationId);
        const marcheIds = (em || []).map((r: any) => r.marche_id);
        if (marcheIds.length === 0) return;

        // 2. Most recent snapshot
        const { data: latest } = await supabase
          .from('biodiversity_snapshots')
          .select('created_at')
          .in('marche_id', marcheIds)
          .order('created_at', { ascending: false })
          .limit(1);
        const newest = latest?.[0]?.created_at ? new Date(latest[0].created_at).getTime() : 0;
        const ageMs = Date.now() - newest;
        if (newest && ageMs < STALE_AFTER_MS) return;

        // 3. Fire-and-forget refresh
        if (cancelled) return;
        setIsSyncing(true);
        const { error } = await supabase.functions.invoke('collect-event-biodiversity', {
          body: { explorationId },
        });
        if (cancelled) return;
        if (!error) {
          // Invalidate everything that depends on snapshots / species counts
          await Promise.all([
            qc.invalidateQueries({ queryKey: ['exploration-biodiversity-summary', explorationId] }),
            qc.invalidateQueries({ queryKey: ['marche-collected-data'] }),
            qc.invalidateQueries({ queryKey: ['biodiversity-snapshots-evolution'] }),
            qc.invalidateQueries({ queryKey: ['exploration-biodiversity'] }),
            qc.invalidateQueries({ queryKey: ['event-biodiversity-snapshots'] }),
          ]);
        }
      } catch (e) {
        // Silent: best-effort background refresh
        console.warn('[snapshots-resync] failed', e);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [explorationId, qc]);

  return { isSyncing };
}
