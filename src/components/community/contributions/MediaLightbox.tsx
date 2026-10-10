import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Globe, User, Pencil, Info, Minus, Plus, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformComponent, TransformWrapper, useControls, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import MediaAttributionSheet from '@/components/community/insights/curation/MediaAttributionSheet';
import type { ReattributeSource } from '@/hooks/useReattributeMedia';
import MediaMetadataPanel from './MediaMetadataPanel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { safeZoomSrc, computeSafeMaxScale } from '@/components/biodiversity/discover/modes/games/zoomImageSrc';

export interface LightboxItem {
  url: string;
  type: 'photo' | 'video';
  titre?: string | null;
  isPublic: boolean;
  isOwner: boolean;
  createdAt?: string;
  /** Underlying row id (marcheur_medias / marcheur_audio / exploration_convivialite_photos). */
  id?: string;
  /** Source table — required to enable reattribution on this item. */
  source?: ReattributeSource;
  /** Currently attributed marcheur (overrides uploader). */
  attributedMarcheurId?: string | null;
  /** Original uploader's display name. */
  uploaderName?: string | null;
  /** Optional EXIF/technical metadata (gps, date_taken, dimensions). */
  metadata?: {
    gps?: { latitude: number; longitude: number } | null;
    date_taken?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  /** File size in bytes (taille_octets). */
  sizeBytes?: number | null;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
  /** Curator/admin/sentinelle — enables the attribution editor. */
  canReattribute?: boolean;
  /** All marcheurs of the parent exploration (for the bottom-sheet picker). */
  marcheurs?: ExplorationMarcheur[];
  /** Used by the reattribute mutation for cache invalidation. */
  explorationId?: string;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({
  items,
  startIndex,
  onClose,
  canReattribute = false,
  marcheurs = [],
  explorationId,
}) => {
  const [index, setIndex] = useState(startIndex);
  const [attributionOpen, setAttributionOpen] = useState(false);
  const [photoScale, setPhotoScale] = useState(1);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeEligible = useRef(false);

  const goNext = useCallback(() => setIndex(i => Math.min(i + 1, items.length - 1)), [items.length]);
  const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const item = items[index];

  const attributedName = useMemo(() => {
    if (!item?.attributedMarcheurId) return null;
    const m = marcheurs.find(x => x.id === item.attributedMarcheurId);
    return m?.fullName ?? null;
  }, [item, marcheurs]);

  if (!item) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeEligible.current = e.touches.length === 1 && photoScale <= 1.02;
    if (!swipeEligible.current) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeEligible.current || !e.changedTouches[0]) return;
    swipeEligible.current = false;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 50 && dy < 100) {
      if (dx > 0) goNext();
      else goPrev();
    }
  };

  const canEditCredit = !!(canReattribute && item.id && item.source);
  const displayName = attributedName || item.uploaderName || null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Visionneuse de médias"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-white/70 text-sm font-medium">
            {index + 1} / {items.length}
          </span>
        </div>

        {/* Media */}
        <div
          className="flex-1 relative flex items-center justify-center min-h-0 px-2 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ overscrollBehavior: 'contain' }}
        >
          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {index < items.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center"
            >
              {item.type === 'photo' ? (
                <ZoomablePhoto
                  key={`${item.id ?? item.url}-${index}`}
                  src={item.url}
                  alt={item.titre || ''}
                  onScaleChange={setPhotoScale}
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  playsInline
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="shrink-0 px-4 py-3 space-y-2">
          {item.titre && (
            <p className="text-white text-sm font-medium truncate">{item.titre}</p>
          )}

          {/* Author / credit chip + metadata trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            {(displayName || canEditCredit) && (
              <button
                type="button"
                disabled={!canEditCredit}
                onClick={() => canEditCredit && setAttributionOpen(true)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition text-left shadow-lg shadow-black/40 backdrop-blur ring-1 ${
                  canEditCredit
                    ? 'bg-emerald-600/90 hover:bg-emerald-500 ring-emerald-300/40 cursor-pointer'
                    : 'bg-emerald-600/85 ring-emerald-300/30 cursor-default'
                }`}
                aria-label={canEditCredit ? 'Réattribuer la photo' : undefined}
              >
                <User className="w-4 h-4 text-white shrink-0" />
                <span className="text-white font-semibold text-sm drop-shadow truncate max-w-[60vw]">
                  {displayName || 'Anonyme'}
                </span>
                {canEditCredit && <Pencil className="w-3.5 h-3.5 text-white/85 shrink-0" />}
              </button>
            )}
            {(item.metadata || item.sizeBytes) && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Métadonnées de la photo"
                    className="p-1.5 rounded-full text-white/55 hover:text-white hover:bg-white/10 transition"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="z-[70] w-[280px] bg-black/85 backdrop-blur-xl border-white/10 text-white p-4 rounded-xl shadow-2xl"
                >
                  <MediaMetadataPanel item={item} />
                </PopoverContent>
              </Popover>
            )}
          </div>
          {item.attributedMarcheurId && item.uploaderName && item.uploaderName !== displayName && (
            <p className="text-white/50 text-[11px] -mt-1">
              upload&nbsp;: {item.uploaderName}
            </p>
          )}

          <div className="flex items-center gap-2 text-white/50 text-xs">
            {item.isPublic ? (
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
            ) : (
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Privé</span>
            )}
            {item.createdAt && (
              <>
                <span>·</span>
                <span>{format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}</span>
              </>
            )}
          </div>
        </div>

        {canEditCredit && item.id && item.source && (
          <MediaAttributionSheet
            open={attributionOpen}
            onOpenChange={setAttributionOpen}
            source={item.source}
            mediaId={item.id}
            explorationId={explorationId}
            marcheurs={marcheurs}
            currentAttributedId={item.attributedMarcheurId ?? null}
            uploaderName={item.uploaderName ?? null}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaLightbox;

interface ZoomablePhotoProps {
  src: string;
  alt: string;
  onScaleChange: (scale: number) => void;
}

const ZoomablePhoto: React.FC<ZoomablePhotoProps> = ({ src, alt, onScaleChange }) => {
  const [scale, setScale] = useState(1);
  const [maxScale, setMaxScale] = useState(8);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestScaleRef = useRef(1);
  const safeSrc = useMemo(() => safeZoomSrc(src) ?? src, [src]);

  useEffect(() => {
    onScaleChange(1);
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
      onScaleChange(nextScale);
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
