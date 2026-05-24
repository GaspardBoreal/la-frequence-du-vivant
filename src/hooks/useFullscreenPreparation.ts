import { useEffect, useRef, useState } from 'react';
import type { UnidentifiedPhotoCandidate } from './useMarcheurUnidentifiedPhotos';

export interface MarcheLite {
  id: string;
  title: string;
  date_marche: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type StepStatus = 'todo' | 'doing' | 'done';

export interface PrepStep {
  key: string;
  label: string;
  status: StepStatus;
  weight: number;
  count?: number;
}

export type GpsCat = 'exif' | 'marche' | 'none';

export interface EnrichedPhoto {
  candidate: UnidentifiedPhotoCandidate;
  marche?: MarcheLite;
  lat: number | null;
  lon: number | null;
  cat: GpsCat;
  isManual: boolean;
}

export interface PreparationResult {
  ready: boolean;
  progress: number; // 0..1
  steps: PrepStep[];
  enriched: EnrichedPhoto[];
  bounds: Array<[number, number]>;
  stats: { exif: number; marche: number; none: number };
  /** Streaming: only the first N markers revealed (for cascade animation). */
  revealedCount: number;
}

const PRELOAD_PARALLEL = 6;
const REVEAL_BATCH = 12;
const REVEAL_INTERVAL_MS = 60;

const preloadImage = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });

const preloadInPool = async (urls: string[], onTick: () => void) => {
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      const idx = i++;
      await preloadImage(urls[idx]);
      onTick();
    }
  };
  await Promise.all(Array.from({ length: Math.min(PRELOAD_PARALLEL, urls.length) }, worker));
};

interface Params {
  candidates: UnidentifiedPhotoCandidate[];
  marches: MarcheLite[];
  candidatesLoading: boolean;
  marchesLoading: boolean;
  /** Active even when fullscreen closed — background pre-calc. */
  enabled: boolean;
}

export function useFullscreenPreparation({
  candidates,
  marches,
  candidatesLoading,
  marchesLoading,
  enabled,
}: Params): PreparationResult {
  const [revealedCount, setRevealedCount] = useState(0);
  const [steps, setSteps] = useState<PrepStep[]>(() => [
    { key: 'photos', label: 'Chargement des photos', status: 'todo', weight: 5 },
    { key: 'gps', label: 'Lecture GPS EXIF', status: 'todo', weight: 20 },
    { key: 'fallback', label: 'Calcul GPS depuis les marches', status: 'todo', weight: 15 },
    { key: 'snap', label: 'Aimantation aux waypoints', status: 'todo', weight: 10 },
    { key: 'preload', label: 'Pré-chargement des vignettes', status: 'todo', weight: 50 },
  ]);
  const [preloadProgress, setPreloadProgress] = useState(0); // 0..1
  const [enriched, setEnriched] = useState<EnrichedPhoto[]>([]);
  const [ready, setReady] = useState(false);
  const runIdRef = useRef(0);
  const revealTimerRef = useRef<number | null>(null);

  const setStep = (key: string, patch: Partial<PrepStep>) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  // Main pipeline — re-runs when inputs change
  useEffect(() => {
    if (!enabled) return;
    if (candidatesLoading || marchesLoading) return;

    const runId = ++runIdRef.current;
    setReady(false);
    setRevealedCount(0);
    setPreloadProgress(0);
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'todo', count: undefined })));

    const run = async () => {
      // STEP 1 — photos loaded
      setStep('photos', { status: 'doing' });
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (runIdRef.current !== runId) return;
      setStep('photos', { status: 'done', count: candidates.length });

      // STEP 2 — read EXIF GPS (already in metadata)
      setStep('gps', { status: 'doing' });
      const marcheById = new Map<string, MarcheLite>();
      marches.forEach((m) => marcheById.set(m.id, m));
      const partial: EnrichedPhoto[] = candidates.map((c) => {
        const lat = c.gps?.latitude ?? null;
        const lon = c.gps?.longitude ?? null;
        const isManual = c.gps?.source === 'manual';
        return {
          candidate: c,
          marche: marcheById.get(c.marcheEventId),
          lat,
          lon,
          cat: lat !== null && lon !== null ? 'exif' : 'none',
          isManual,
        };
      });
      const exifCount = partial.filter((p) => p.cat === 'exif').length;
      await new Promise((r) => setTimeout(r, 80));
      if (runIdRef.current !== runId) return;
      setStep('gps', { status: 'done', count: exifCount });

      // STEP 3 — fallback marche
      setStep('fallback', { status: 'doing' });
      let fallbackCount = 0;
      const withFallback = partial.map((p) => {
        if (p.lat !== null && p.lon !== null) return p;
        if (p.marche?.latitude && p.marche?.longitude) {
          fallbackCount++;
          return { ...p, lat: p.marche.latitude, lon: p.marche.longitude, cat: 'marche' as GpsCat };
        }
        return p;
      });
      await new Promise((r) => setTimeout(r, 80));
      if (runIdRef.current !== runId) return;
      setStep('fallback', { status: 'done', count: fallbackCount });

      // STEP 4 — snap waypoints (synthetic: snapping happens at reposition time;
      // here we just count photos already aligned to a marche centroid)
      setStep('snap', { status: 'doing' });
      await new Promise((r) => setTimeout(r, 60));
      if (runIdRef.current !== runId) return;
      setStep('snap', { status: 'done', count: fallbackCount });

      setEnriched(withFallback);

      // STEP 5 — preload thumbnails
      setStep('preload', { status: 'doing' });
      const urls = withFallback.map((p) => p.candidate.url);
      let done = 0;
      await preloadInPool(urls, () => {
        done++;
        if (runIdRef.current === runId) {
          setPreloadProgress(urls.length ? done / urls.length : 1);
        }
      });
      if (runIdRef.current !== runId) return;
      setStep('preload', { status: 'done', count: urls.length });
      setPreloadProgress(1);
      setReady(true);
    };

    run();
  }, [enabled, candidates, marches, candidatesLoading, marchesLoading]);

  // Cascade reveal once enriched data ready
  useEffect(() => {
    if (!ready || enriched.length === 0) return;
    setRevealedCount(0);
    let n = 0;
    const tick = () => {
      n = Math.min(enriched.length, n + REVEAL_BATCH);
      setRevealedCount(n);
      if (n < enriched.length) {
        revealTimerRef.current = window.setTimeout(tick, REVEAL_INTERVAL_MS);
      }
    };
    revealTimerRef.current = window.setTimeout(tick, 40);
    return () => {
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    };
  }, [ready, enriched.length]);

  // Derive overall progress as weighted average
  const totalWeight = steps.reduce((a, s) => a + s.weight, 0);
  const progress = steps.reduce((acc, s) => {
    if (s.status === 'done') return acc + s.weight;
    if (s.key === 'preload' && s.status === 'doing') return acc + s.weight * preloadProgress;
    if (s.status === 'doing') return acc + s.weight * 0.4;
    return acc;
  }, 0) / Math.max(1, totalWeight);

  const stats = enriched.reduce(
    (acc, p) => {
      if (p.cat === 'exif') acc.exif++;
      else if (p.cat === 'marche') acc.marche++;
      else acc.none++;
      return acc;
    },
    { exif: 0, marche: 0, none: 0 },
  );

  const bounds: Array<[number, number]> = enriched
    .filter((p) => p.lat !== null && p.lon !== null)
    .map((p) => [p.lat!, p.lon!]);

  return { ready, progress, steps, enriched, bounds, stats, revealedCount };
}
