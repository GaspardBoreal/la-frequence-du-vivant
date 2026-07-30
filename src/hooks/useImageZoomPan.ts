import { useCallback, useEffect, useRef, useState } from 'react';

export const MIN_SCALE = 1;
export const MAX_SCALE = 8;

interface ZoomState {
  scale: number;
  tx: number;
  ty: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Loupe de terrain : zoom molette centré sur le curseur, pan au glisser,
 * double-clic pour basculer, bornage des translations sur le cadre rendu.
 *
 * `containerRef` = cadre `overflow-hidden` ; le contenu est transformé via `style`.
 */
export function useImageZoomPan(resetKey?: string | null) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<ZoomState>({ scale: 1, tx: 0, ty: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  // Miroir synchrone de l'état pour les handlers natifs
  const stateRef = useRef(state);
  stateRef.current = state;

  const reset = useCallback(() => setState({ scale: 1, tx: 0, ty: 0 }), []);

  // Nouvelle photo → cadrage neutre
  useEffect(() => {
    reset();
  }, [resetKey, reset]);

  /** Borne la translation pour que l'image ne quitte jamais le cadre. */
  const bound = useCallback((next: ZoomState): ZoomState => {
    const el = containerRef.current;
    if (!el) return next;
    const { width, height } = el.getBoundingClientRect();
    const maxX = Math.max(0, (width * next.scale - width) / 2);
    const maxY = Math.max(0, (height * next.scale - height) / 2);
    return {
      scale: next.scale,
      tx: clamp(next.tx, -maxX, maxX),
      ty: clamp(next.ty, -maxY, maxY),
    };
  }, []);

  /** Zoom ancré sur un point client (px écran). */
  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = clientX - rect.left - rect.width / 2;
      const cy = clientY - rect.top - rect.height / 2;
      setState((prev) => {
        const scale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
        const k = scale / prev.scale;
        if (scale === MIN_SCALE) return { scale, tx: 0, ty: 0 };
        return bound({
          scale,
          tx: cx - (cx - prev.tx) * k,
          ty: cy - (cy - prev.ty) * k,
        });
      });
    },
    [bound],
  );

  /** Zoom depuis un contrôle (curseur, boutons) : ancré au centre. */
  const setScale = useCallback(
    (scale: number) => {
      setState((prev) => {
        const s = clamp(scale, MIN_SCALE, MAX_SCALE);
        if (s === MIN_SCALE) return { scale: s, tx: 0, ty: 0 };
        const k = s / prev.scale;
        return bound({ scale: s, tx: prev.tx * k, ty: prev.ty * k });
      });
    },
    [bound],
  );

  const zoomBy = useCallback(
    (factor: number) => setScale(stateRef.current.scale * factor),
    [setScale],
  );

  // Molette : listener non-passif pour pouvoir preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0022);
      zoomAt(e.clientX, e.clientY, factor);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (stateRef.current.scale <= MIN_SCALE) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty };
      setIsPanning(true);
    },
    [state.tx, state.ty],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      setState((prev) =>
        bound({ scale: prev.scale, tx: d.tx + (e.clientX - d.x), ty: d.ty + (e.clientY - d.y) }),
      );
    },
    [bound],
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
    setIsPanning(false);
  }, []);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (stateRef.current.scale > MIN_SCALE) reset();
      else zoomAt(e.clientX, e.clientY, 2.5);
    },
    [reset, zoomAt],
  );

  return {
    containerRef,
    scale: state.scale,
    transform: `translate3d(${state.tx}px, ${state.ty}px, 0) scale(${state.scale})`,
    isZoomed: state.scale > MIN_SCALE,
    isPanning,
    reset,
    setScale,
    zoomBy,
    zoomAt,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick },
  };
}

export default useImageZoomPan;
