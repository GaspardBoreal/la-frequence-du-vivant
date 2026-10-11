import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { explorationSpeciesCountKey } from '@/hooks/useExplorationSpeciesCount';

const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // 2h

const SNAPSHOT_KEYS = [
  'exploration-biodiversity-summary',
  'event-biodiversity-snapshots',
  'event-biodiversity-snapshots-all',
  'event-marcheur-observations',
  'exploration-marche-ctx',
  'event-all-marches',
  'exploration-biodiversity',
  'exploration-species-pool-rpc',
  'biodiversity-snapshots',
  'biodiversity-snapshots-evolution',
  'marche-collected-data',
];

/**
 * Fraîcheur des données iNaturalist d'une exploration :
 * - resync silencieuse si le dernier snapshot a plus de 2 h ;
 * - `refresh()` force une collecte immédiate ;
 * - écoute temps réel des nouveaux snapshots → l'écran se met à jour seul.
 */
export function useSnapshotsResyncOnView(explorationId?: string | null) {
  const qc = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [marcheIds, setMarcheIds] = useState<string[]>([]);
  const firedRef = useRef<string | null>(null);

  const invalidateAll = useCallback(() => {
    SNAPSHOT_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    if (explorationId) qc.invalidateQueries({ queryKey: explorationSpeciesCountKey(explorationId) });
  }, [qc, explorationId]);

  const runCollect = useCallback(async (force: boolean) => {
    if (!explorationId) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('collect-event-biodiversity', {
        body: { explorationId, force },
      });
      if (error) throw error;
      const logId = (data as any)?.started ? (data as any)?.logId : null;
      if (logId) {
        const deadline = Date.now() + 10 * 60 * 1000;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 4000));
          const { data: log } = await supabase.from('data_collection_logs').select('status').eq('id', logId).maybeSingle();
          if (log?.status === 'completed' || log?.status === 'failed') break;
        }
      }
      setLastUpdatedAt(new Date());
      invalidateAll();
    } finally {
      setIsSyncing(false);
    }
  }, [explorationId, invalidateAll]);

  useEffect(() => {
    if (!explorationId) return;
    if (firedRef.current === explorationId) return;
    firedRef.current = explorationId;

    let cancelled = false;
    (async () => {
      try {
        const { data: em } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .eq('exploration_id', explorationId);
        const ids = (em || []).map((r: any) => r.marche_id);
        if (cancelled) return;
        setMarcheIds(ids);
        if (ids.length === 0) return;

        const { data: latest } = await supabase
          .from('biodiversity_snapshots')
          .select('created_at')
          .in('marche_id', ids)
          .order('created_at', { ascending: false })
          .limit(1);
        const newest = latest?.[0]?.created_at ? new Date(latest[0].created_at) : null;
        if (cancelled) return;
        setLastUpdatedAt(newest);
        if (newest && Date.now() - newest.getTime() < STALE_AFTER_MS) return;
        await runCollect(false);
      } catch (e) {
        console.warn('[snapshots-resync] failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [explorationId, runCollect]);

  // Temps réel : nouveau snapshot sur une marche de l'exploration
  useEffect(() => {
    if (marcheIds.length === 0) return;
    const set = new Set(marcheIds);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`snapshots-${explorationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'biodiversity_snapshots' }, (payload: any) => {
        if (!set.has(payload.new?.marche_id)) return;
        setLastUpdatedAt(new Date(payload.new?.created_at || Date.now()));
        if (timer) clearTimeout(timer);
        timer = setTimeout(invalidateAll, 1500);
      })
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [marcheIds, explorationId, invalidateAll]);

  const refresh = useCallback(() => runCollect(true), [runCollect]);

  return { isSyncing, lastUpdatedAt, refresh };
}
