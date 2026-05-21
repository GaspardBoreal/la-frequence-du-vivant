import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
  className?: string;
  /** When provided and zoom > 1, the view recenters smoothly on this point. */
  selectedFocus?: { x: number; y: number } | null;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * Mutualised zoom / pan wrapper for the trophic SVG views (Réseau, Constellation, Spirale).
 * - Wheel zoom centered on cursor
 * - Pinch zoom (2-finger) centered between fingers
 * - Drag to pan when zoom > 1
 * - +/− buttons, reset, % indicator
 * - Exposes CSS var `--zoom` so individual elements can compensate (e.g. text size)
 */
export const ZoomableSvgStage: React.FC<Props> = ({
  width,
  height,
  children,
  className,
  selectedFocus,
  minZoom = 1,
  maxZoom = 5,
}) => {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: width / 2, y: height / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const clamp = useCallback(
    (c: { x: number; y: number }, z: number) => {
      const halfW = width / (2 * z);
      const halfH = height / (2 * z);
      return {
        x: Math.max(halfW, Math.min(width - halfW, c.x)),
        y: Math.max(halfH, Math.min(height - halfH, c.y)),
      };
    },
    [width, height],
  );

  const setZoomAt = useCallback(
    (newZoom: number, anchor?: { x: number; y: number }) => {
      const z = Math.max(minZoom, Math.min(maxZoom, newZoom));
      setZoom(z);
      if (anchor) {
        // Keep anchor under cursor by adjusting center toward anchor proportionally
        setCenter((prev) => {
          const shift = 1 - 1 / (z / zoom || 1);
          // Simpler: blend toward anchor when zooming in
          if (z > zoom) {
            return clamp(
              { x: prev.x + (anchor.x - prev.x) * 0.5, y: prev.y + (anchor.y - prev.y) * 0.5 },
              z,
            );
          }
          return clamp(prev, z);
        });
      } else {
        setCenter((c) => clamp(c, z));
      }
    },
    [clamp, minZoom, maxZoom, zoom],
  );

  // Auto-recenter on selected node when zoomed in
  useEffect(() => {
    if (selectedFocus && zoom > 1.05) {
      setCenter(clamp(selectedFocus, zoom));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFocus?.x, selectedFocus?.y]);

  const reset = useCallback(() => {
    setZoom(1);
    setCenter({ x: width / 2, y: height / 2 });
  }, [width, height]);

  const clientToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: width / 2, y: height / 2 };
      const rect = svg.getBoundingClientRect();
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      const vbW = width / zoom;
      const vbH = height / zoom;
      const vbX = center.x - vbW / 2;
      const vbY = center.y - vbH / 2;
      return { x: vbX + nx * vbW, y: vbY + ny * vbH };
    },
    [width, height, zoom, center.x, center.y],
  );

  // Native wheel listener (React onWheel is passive — cannot preventDefault)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      const anchor = clientToSvg(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.25 : 1 / 1.25;
      setZoomAt(zoom * factor, anchor);
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, [clientToSvg, setZoomAt, zoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1.01) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, cx: center.x, cy: center.y };
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * (width / zoom);
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * (height / zoom);
    setCenter(clamp({ x: dragRef.current.cx - dx, y: dragRef.current.cy - dy }, zoom));
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const anchor = clientToSvg(cx, cy);
      setZoomAt(pinchRef.current.zoom * (newDist / pinchRef.current.dist), anchor);
    }
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  const vbW = width / zoom;
  const vbH = height / zoom;
  const vbX = center.x - vbW / 2;
  const vbY = center.y - vbH / 2;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  const cursor =
    zoom > 1.01 ? (isDragging ? 'grabbing' : 'grab') : 'default';

  return (
    <div
      className="relative"
      style={{ ['--zoom' as any]: zoom, transition: 'all 0.2s' }}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={className ?? 'w-full h-auto block'}
        style={{ cursor, touchAction: 'none', transition: isDragging ? 'none' : 'all 0.25s ease-out' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </svg>

      {/* Haut-gauche : Vue d'ensemble + indicateur % (visibles seulement si zoomé) */}
      {zoom > 1.05 && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur rounded-full border border-border p-1 shadow-sm z-10">
          <button
            type="button"
            onClick={reset}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
            aria-label="Vue d'ensemble"
            title="Vue d'ensemble"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-medium tabular-nums text-muted-foreground hover:text-foreground px-1.5 leading-none"
            aria-label="Réinitialiser le zoom"
            title="Cliquer pour réinitialiser"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      )}

      {/* Haut-droite : zoom + / − */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur rounded-full border border-border p-1 shadow-sm z-10">
        <button
          type="button"
          onClick={() => setZoomAt(zoom / 1.4)}
          disabled={zoom <= minZoom + 0.01}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition"
          aria-label="Zoom arrière"
          title="Zoom arrière"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoomAt(zoom * 1.4)}
          disabled={zoom >= maxZoom - 0.01}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition"
          aria-label="Zoom avant"
          title="Zoom avant (molette)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ZoomableSvgStage;
