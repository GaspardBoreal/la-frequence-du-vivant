import { useCallback, useEffect, useRef, useState } from 'react';

export type FabCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface UseDraggableFabOptions {
  id: string;
  size?: number;
  defaultCorner?: FabCorner;
  margin?: number;
}

interface StoredPos {
  x: number;
  y: number;
  edge: 'left' | 'right';
}

const LONG_PRESS_MS = 250;
const DRAG_THRESHOLD = 6;
const STORAGE_PREFIX = 'fab-pos:';

const safeAreaBottom = (): number => {
  if (typeof window === 'undefined') return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom');
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

export function useDraggableFab({
  id,
  size = 56,
  defaultCorner = 'bottom-right',
  margin = 16,
}: UseDraggableFabOptions) {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // refs for pointer logic
  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const didDragRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const clampToViewport = useCallback(
    (x: number, y: number) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sb = safeAreaBottom();
      const minX = margin;
      const maxX = vw - size - margin;
      const minY = margin;
      const maxY = vh - size - margin - sb;
      return {
        x: Math.min(maxX, Math.max(minX, x)),
        y: Math.min(maxY, Math.max(minY, y)),
      };
    },
    [margin, size]
  );

  const computeDefault = useCallback(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sb = safeAreaBottom();
    switch (defaultCorner) {
      case 'bottom-left':
        return { x: margin, y: vh - size - margin - sb };
      case 'top-right':
        return { x: vw - size - margin, y: margin };
      case 'top-left':
        return { x: margin, y: margin };
      case 'bottom-right':
      default:
        return { x: vw - size - margin, y: vh - size - margin - sb };
    }
  }, [defaultCorner, margin, size]);

  // Initial position load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let next = computeDefault();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as StoredPos;
        if (
          typeof stored?.x === 'number' &&
          typeof stored?.y === 'number'
        ) {
          next = clampToViewport(stored.x, stored.y);
        }
      }
    } catch {
      /* noop */
    }
    setPos(next);

    // First-time hint
    try {
      if (!localStorage.getItem('fab-hint-seen')) {
        setShowHint(true);
        window.setTimeout(() => setShowHint(false), 3500);
        localStorage.setItem('fab-hint-seen', '1');
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Reclamp on resize / orientation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setPos((p) => (p ? clampToViewport(p.x, p.y) : p));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [clampToViewport]);

  const persist = useCallback(
    (x: number, y: number) => {
      const vw = window.innerWidth;
      const edge: 'left' | 'right' = x + size / 2 < vw / 2 ? 'left' : 'right';
      try {
        localStorage.setItem(storageKey, JSON.stringify({ x, y, edge } satisfies StoredPos));
      } catch {
        /* noop */
      }
    },
    [size, storageKey]
  );

  const cancelLongPress = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pos) return;
      // Only primary button for mouse
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerIdRef.current = e.pointerId;
      startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
      didDragRef.current = false;
      draggingRef.current = false;

      cancelLongPress();
      longPressTimerRef.current = window.setTimeout(() => {
        draggingRef.current = true;
        setIsDragging(true);
        try {
          (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
        } catch {
          /* noop */
        }
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate?.(10);
          } catch {
            /* noop */
          }
        }
      }, LONG_PRESS_MS);
    },
    [pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      const start = startRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dist = Math.hypot(dx, dy);

      if (!draggingRef.current) {
        if (dist > DRAG_THRESHOLD * 2) {
          // user moved before long-press fired → cancel (treat as scroll)
          cancelLongPress();
          pointerIdRef.current = null;
          startRef.current = null;
        }
        return;
      }

      // Active drag
      didDragRef.current = true;
      e.preventDefault();
      const nx = e.clientX - offsetRef.current.dx;
      const ny = e.clientY - offsetRef.current.dy;
      const clamped = clampToViewport(nx, ny);
      setPos(clamped);
    },
    [clampToViewport]
  );

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      cancelLongPress();
      const wasDragging = draggingRef.current;
      pointerIdRef.current = null;
      startRef.current = null;
      draggingRef.current = false;

      if (wasDragging) {
        setIsDragging(false);
        setPos((current) => {
          if (!current) return current;
          // Snap horizontally to nearest edge
          const vw = window.innerWidth;
          const snappedX =
            current.x + size / 2 < vw / 2 ? margin : vw - size - margin;
          const next = clampToViewport(snappedX, current.y);
          persist(next.x, next.y);
          return next;
        });
      }
      // Reset didDrag shortly after to swallow the click if any
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 50);
    },
    [clampToViewport, margin, persist, size]
  );

  // Intercept click during drag
  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const resetPosition = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
    setPos(computeDefault());
  }, [computeDefault, storageKey]);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Avoid resetting when double-click was actually a tap
      if (didDragRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      resetPosition();
    },
    [resetPosition]
  );

  return {
    containerRef,
    pos,
    isDragging,
    showHint,
    resetPosition,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onClickCapture,
      onDoubleClick,
    } satisfies React.HTMLAttributes<HTMLDivElement>,
  };
}
