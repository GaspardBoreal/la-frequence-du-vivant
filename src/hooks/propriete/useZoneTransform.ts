import React from 'react';
import {
  closeRing,
  openRing,
  reflectRing,
  ringCenter,
  rotateRing,
  smoothRing,
  type Ring,
} from '@/lib/geomTransform';
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
  /** Enregistrement en cours : Valider est verrouillé. */
  saving: boolean;
  /** Dernier échec d'enregistrement (la barre reste ouverte). */
  saveError: string | null;
  start: (zone: ProprieteZone) => void;
  /** À appeler juste avant un geste : empile l'état courant. */
  pushHistory: () => void;
  preview: (ring: Ring) => void;
  smooth: () => void;
  rotate90: () => void;
  reflect: (axis: 'horizontal' | 'vertical') => void;
  undo: () => void;
  cancel: () => void;
  save: () => void;
}

type FinishFn = (
  kind: 'save' | 'cancel',
  zone: ProprieteZone,
  base: Ring,
  final: Ring,
) => void | Promise<void>;

/**
 * État d'édition géométrique d'un emplacement : copie locale, pile d'annulation,
 * lissage cumulatif et sauvegarde différée (rien n'est écrit avant « Valider »).
 * La validation n'est refermée qu'après confirmation réelle de l'enregistrement.
 */
export function useZoneTransform(
  onPatchZone?: (zone: ProprieteZone, patch: Partial<ProprieteZone>) => unknown,
  onFinish?: FinishFn,
): ZoneTransformApi {
  const [zone, setZone] = React.useState<ProprieteZone | null>(null);
  const [ring, setRing] = React.useState<Ring>([]);
  const [history, setHistory] = React.useState<Ring[]>([]);
  const [smoothCount, setSmoothCount] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const baseRef = React.useRef<Ring>([]);
  const ringRef = React.useRef<Ring>([]);
  ringRef.current = ring;
  const zoneRef = React.useRef<ProprieteZone | null>(null);
  zoneRef.current = zone;
  const savingRef = React.useRef(false);
  const patchRef = React.useRef(onPatchZone);
  patchRef.current = onPatchZone;
  const finishRef = React.useRef(onFinish);
  finishRef.current = onFinish;

  const reset = React.useCallback(() => {
    setZone(null);
    zoneRef.current = null;
    setRing([]);
    setHistory([]);
    setSmoothCount(0);
    setSaveError(null);
  }, []);

  const start = React.useCallback((z: ProprieteZone) => {
    const r = closeRing((z.geometry?.coordinates?.[0] ?? []) as Ring);
    baseRef.current = r;
    savingRef.current = false;
    setSaving(false);
    setSaveError(null);
    setZone(z);
    zoneRef.current = z;
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

  const rotate90 = React.useCallback(() => {
    const center = ringCenter(ringRef.current);
    if (!center) return;
    setHistory((h) => [...h.slice(-24), ringRef.current]);
    setRing(closeRing(rotateRing(openRing(ringRef.current), center, Math.PI / 2)));
  }, []);

  const reflect = React.useCallback((axis: 'horizontal' | 'vertical') => {
    const center = ringCenter(ringRef.current);
    if (!center) return;
    setHistory((h) => [...h.slice(-24), ringRef.current]);
    setRing(closeRing(reflectRing(openRing(ringRef.current), center, axis)));
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
    const z = zoneRef.current;
    if (savingRef.current) return;
    try {
      if (z) {
        const res = finishRef.current?.('cancel', z, baseRef.current, ringRef.current);
        if (res && typeof (res as Promise<void>).catch === 'function') {
          (res as Promise<void>).catch((e) => console.error('[zone-transform] cancel', e));
        }
      }
    } catch (e) {
      console.error('[zone-transform] cancel', e);
    } finally {
      reset();
    }
  }, [reset]);

  const baseArea = React.useMemo(() => ringAreaM2(openRing(baseRef.current)), [zone]);
  const area = React.useMemo(() => ringAreaM2(openRing(ring)), [ring]);

  const save = React.useCallback(() => {
    const z = zoneRef.current;
    const finalRing = ringRef.current;
    if (savingRef.current) return;
    if (!z || openRing(finalRing).length < 3) {
      cancel();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    (async () => {
      try {
        await patchRef.current?.(z, {
          geometry: { type: 'Polygon', coordinates: [closeRing(finalRing)] } as any,
          surface_m2: Math.round(ringAreaM2(openRing(finalRing))),
        });
      } catch (e) {
        console.error('[zone-transform] save', e);
        setSaveError('La forme n’a pas pu être enregistrée.');
        return;
      }
      try {
        await finishRef.current?.('save', z, baseRef.current, finalRing);
      } catch (e) {
        console.error('[zone-transform] finish', e);
        setSaveError(e instanceof Error && e.message ? e.message : 'Enregistrement incomplet.');
        return;
      }
      reset();
    })().finally(() => {
      savingRef.current = false;
      setSaving(false);
    });
  }, [cancel, reset]);

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
    saving,
    saveError,
    start,
    pushHistory,
    preview,
    smooth,
    rotate90,
    reflect,
    undo,
    cancel,
    save,
  };
}
