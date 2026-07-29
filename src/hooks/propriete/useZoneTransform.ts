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
  /** À appeler juste avant un geste : empile l'état courant. */
  pushHistory: () => void;
  preview: (ring: Ring) => void;
  smooth: () => void;
  undo: () => void;
  cancel: () => void;
  save: () => void;
}

/**
 * État d'édition géométrique d'un emplacement : copie locale, pile d'annulation,
 * lissage cumulatif et sauvegarde différée (rien n'est écrit avant « Valider »).
 */
export function useZoneTransform(
  onPatchZone?: (zone: ProprieteZone, patch: Partial<ProprieteZone>) => void,
): ZoneTransformApi {
  const [zone, setZone] = React.useState<ProprieteZone | null>(null);
  const [ring, setRing] = React.useState<Ring>([]);
  const [history, setHistory] = React.useState<Ring[]>([]);
  const [smoothCount, setSmoothCount] = React.useState(0);
  const baseRef = React.useRef<Ring>([]);
  const ringRef = React.useRef<Ring>([]);
  ringRef.current = ring;

  const start = React.useCallback((z: ProprieteZone) => {
    const r = closeRing((z.geometry?.coordinates?.[0] ?? []) as Ring);
    baseRef.current = r;
    setZone(z);
    setRing(r);
    setHistory([]);
    setSmoothCount(0);
  }, []);

  const pushHistory = React.useCallback(() => {
    setHistory((h) => [...h.slice(-24), ringRef.current]);
  }, []);

  const preview = React.useCallback((next: Ring) => setRing(next), []);

  const smooth = React.useCallback(() => {
    setHistory((h) => [...h.slice(-24), ringRef.current]);
    setRing(closeRing(smoothRing(ringRef.current, 1)));
    setSmoothCount((c) => c + 1);
  }, []);

  const undo = React.useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setRing(h[h.length - 1]);
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
    if (!zone || openRing(ring).length < 3) {
      cancel();
      return;
    }
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
    pushHistory,
    preview,
    smooth,
    undo,
    cancel,
    save,
  };
}
