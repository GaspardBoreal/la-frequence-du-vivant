import React from 'react';
import { closeRing, openRing, smoothRing, type Ring } from '@/lib/geomTransform';
import { ringAreaM2 } from '@/components/propriete/palette/studio/geoMetrics';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';

export interface ZoneTransformApi {
  zone: ProprieteZone | null;
  ring: Ring;
  dirty: boolean;
  smoothCount: number;
  canUndo: boolean;
  baseArea: number;
  area: number;
  start: (zone: ProprieteZone) => void;
  preview: (ring: Ring) => void;
  commit: (ring: Ring) => void;
  smooth: () => void;
  undo: () => void;
  cancel: () => void;
  save: () => void;
}

/**
 * État d'édition géométrique d'un emplacement : copie locale, pile d'annulation,
 * lissage cumulatif et sauvegarde différée.
 */
export function useZoneTransform(
  onPatchZone?: (zone: ProprieteZone, patch: Partial<ProprieteZone>) => void,
): ZoneTransformApi {
  const [zone, setZone] = React.useState<ProprieteZone | null>(null);
  const [ring, setRing] = React.useState<Ring>([]);
  const [history, setHistory] = React.useState<Ring[]>([]);
  const [smoothCount, setSmoothCount] = React.useState(0);
  const baseRef = React.useRef<Ring>([]);

  const start = React.useCallback((z: ProprieteZone) => {
    const r = (z.geometry?.coordinates?.[0] ?? []) as Ring;
    baseRef.current = closeRing(r);
    setZone(z);
    setRing(closeRing(r));
    setHistory([]);
    setSmoothCount(0);
  }, []);

  const preview = React.useCallback((next: Ring) => setRing(next), []);

  const push = React.useCallback((next: Ring) => {
    setHistory((h) => [...h.slice(-24), ring]);
    setRing(next);
  }, [ring]);

  const commit = React.useCallback(
    (next: Ring) => {
      setHistory((h) => [...h.slice(-24), baseRefSnapshot(h, ring)]);
      setRing(next);
    },
    [ring],
  );

  const smooth = React.useCallback(() => {
    setHistory((h) => [...h.slice(-24), ring]);
    setRing(closeRing(smoothRing(ring, 1)));
    setSmoothCount((c) => c + 1);
  }, [ring]);

  const undo = React.useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setRing(last);
      setSmoothCount((c) => Math.max(0, c - 1));
      return h.slice(0, -1);
    });
  }, []);

  const cancel = React.useCallback(() => {
    setZone(null);
    setRing([]);
    setHistory([]);
    setSmoothCount(0);
  }, []);

  const baseArea = React.useMemo(() => ringAreaM2(openRing(baseRef.current)), [zone]);
  const area = React.useMemo(() => ringAreaM2(openRing(ring)), [ring]);

  const save = React.useCallback(() => {
    if (!zone || openRing(ring).length < 3) return cancel();
    onPatchZone?.(zone, {
      geometry: { type: 'Polygon', coordinates: [closeRing(ring)] } as any,
      surface_m2: Math.round(area),
    });
    cancel();
  }, [zone, ring, area, onPatchZone, cancel]);

  const dirty = React.useMemo(
    () => JSON.stringify(ring) !== JSON.stringify(baseRef.current),
    [ring, zone],
  );

  return {
    zone,
    ring,
    dirty,
    smoothCount,
    canUndo: history.length > 0,
    baseArea,
    area,
    start,
    preview,
    commit,
    smooth,
    undo,
    cancel,
    save,
  };
}

/** Le geste a déjà écrit l'aperçu : on empile l'état d'avant-geste conservé par la pile. */
function baseRefSnapshot(history: Ring[], current: Ring): Ring {
  return history.length ? current : current;
}
