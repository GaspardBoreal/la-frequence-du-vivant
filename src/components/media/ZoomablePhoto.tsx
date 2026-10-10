import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Minus, Plus, Scan } from 'lucide-react';
import { TransformComponent, TransformWrapper, useControls, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { safeZoomSrc, computeSafeMaxScale } from '@/components/biodiversity/discover/modes/games/zoomImageSrc';

interface ZoomablePhotoProps {
  src: string;
  alt: string;
  onScaleChange?: (scale: number) => void;
}

export const ZoomablePhoto: React.FC<ZoomablePhotoProps> = ({ src, alt, onScaleChange }) => {
  const [scale, setScale] = useState(1);
  const [maxScale, setMaxScale] = useState(8);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestScaleRef = useRef(1);
  const safeSrc = useMemo(() => safeZoomSrc(src) ?? src, [src]);

  useEffect(() => {
    onScaleChange?.(1);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [onScaleChange, src]);

  const handleTransform = useCallback((_context: unknown, state: { scale: number }) => {
    latestScaleRef.current = state.scale;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const nextScale = latestScaleRef.current;
      setScale(nextScale);
      onScaleChange?.(nextScale);
    });
  }, [onScaleChange]);

  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const naturalWidth = event.currentTarget.naturalWidth;
    const safeScale = Math.floor(12800 / Math.max(naturalWidth, 1));
    setMaxScale(Math.max(computeSafeMaxScale(naturalWidth), Math.min(8, safeScale)));
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const handleWheel = (event: WheelEvent) => {
      const transform = transformRef.current;
      if (!transform) return;
      event.preventDefault();
      event.stopPropagation();

      const deltaModeFactor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const normalizedDelta = event.deltaY * deltaModeFactor;
      const current = transform.state;
      const nextScale = Math.min(maxScale, Math.max(1, current.scale * Math.exp(-normalizedDelta * 0.0018)));
      if (Math.abs(nextScale - current.scale) < 0.001) return;

      const rect = surface.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const ratio = nextScale / current.scale;
      const nextX = pointerX - (pointerX - current.positionX) * ratio;
      const nextY = pointerY - (pointerY - current.positionY) * ratio;
      transform.setTransform(nextX, nextY, nextScale, 0);
    };

    surface.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => surface.removeEventListener('wheel', handleWheel, { capture: true });
  }, [maxScale]);

  return (
    <div ref={surfaceRef} className="relative h-full w-full overflow-hidden" style={{ touchAction: 'none' }}>
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={1}
        maxScale={maxScale}
        centerOnInit
        centerZoomedOut
        limitToBounds
        wheel={{ disabled: true }}
        pinch={{ step: 4 }}
        doubleClick={{ mode: 'toggle', step: 2 }}
        panning={{ velocityDisabled: true }}
        onTransform={handleTransform}
      >
        <>
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full flex items-center justify-center"
          >
            <img
              src={safeSrc}
              alt={alt}
              onLoad={handleLoad}
              draggable={false}
              decoding="async"
              loading="eager"
              className="max-w-full max-h-full object-contain rounded-lg select-none"
            />
          </TransformComponent>
          <PhotoZoomToolbar scale={scale} />
        </>
      </TransformWrapper>
    </div>
  );
};

const stopToolbarEvent = (event: React.SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const PhotoZoomToolbar: React.FC<{ scale: number }> = React.memo(({ scale }) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const isAdjusted = scale <= 1.02;

  return (
    <div
      className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-full border border-white/15 bg-black/70 p-1 text-white shadow-2xl backdrop-blur-md"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      aria-label="Commandes de zoom"
    >
      <button
        type="button"
        onClick={(event) => { stopToolbarEvent(event); zoomOut(0.35); }}
        disabled={isAdjusted}
        aria-label="Réduire la photo"
        title="Réduire"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-35 sm:h-9 sm:w-9"
      >
        <Minus className="h-5 w-5" />
      </button>
      <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums" aria-live="polite">
        {Math.round(scale * 100)} %
      </span>
      <button
        type="button"
        onClick={(event) => { stopToolbarEvent(event); zoomIn(0.35); }}
        aria-label="Agrandir la photo"
        title="Agrandir"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/15 sm:h-9 sm:w-9"
      >
        <Plus className="h-5 w-5" />
      </button>
      <div className="mx-0.5 h-5 w-px bg-white/20" />
      <button
        type="button"
        onClick={(event) => { stopToolbarEvent(event); resetTransform(220); }}
        disabled={isAdjusted}
        aria-label="Ajuster la photo à l’écran"
        title="Revenir à la vue initiale"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-40 sm:h-9 sm:w-9"
      >
        <Scan className="h-4 w-4" />
      </button>
    </div>
  );
});

PhotoZoomToolbar.displayName = 'PhotoZoomToolbar';

export default ZoomablePhoto;
