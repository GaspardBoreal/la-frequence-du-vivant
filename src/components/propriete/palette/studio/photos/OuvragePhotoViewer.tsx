/**
 * Visionneuse plein écran du carnet photo d'un ouvrage.
 * Reprend la « loupe de terrain » (molette / glisser / double-clic) déjà en
 * place dans la fiche espèce, avec navigation précédent / suivant.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useImageZoomPan } from '@/hooks/useImageZoomPan';
import ZoomBar from '@/components/propriete/identify/blocks/ZoomBar';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import { formatPhotoDate, seasonOf, SEASONS } from './seasons';

interface Props {
  photos: ObjetPhoto[];
  index: number;
  title: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}

export const OuvragePhotoViewer: React.FC<Props> = ({
  photos,
  index,
  title,
  onIndex,
  onClose,
}) => {
  const photo = photos[index];
  const [expanded, setExpanded] = React.useState(false);
  const zoom = useImageZoomPan(photo?.id ?? null);

  const go = React.useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndex],
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') zoom.zoomBy(1.4);
      else if (e.key === '-') zoom.zoomBy(1 / 1.4);
      else if (e.key === '0') zoom.reset();
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [go, onClose, zoom]);

  if (!photo) return null;
  const season = SEASONS.find((s) => s.key === seasonOf(photo));

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-[hsl(var(--ds-forest-deep))]/97 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label={`Photo · ${title}`}
    >
      {/* Bandeau */}
      {!expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-3 border-b border-[hsl(var(--ds-gold))]/25 px-4 py-3 text-[hsl(var(--ds-cream))]"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-[11px] opacity-70">
              {season?.glyph} {season?.label} · {formatPhotoDate(photo)} · {index + 1}/
              {photos.length}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cadre image */}
      <div
        ref={zoom.containerRef}
        onClick={(e) => e.stopPropagation()}
        {...zoom.handlers}
        className={`relative flex-1 select-none overflow-hidden ${
          zoom.isPanning ? 'cursor-grabbing' : zoom.isZoomed ? 'cursor-grab' : 'cursor-zoom-in'
        }`}
      >
        <img
          src={photo.url}
          alt={photo.caption || title}
          draggable={false}
          style={{ transform: zoom.transform }}
          className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full object-contain transition-[transform] duration-75 will-change-transform"
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-forest-deep))]/85 p-2 text-[hsl(var(--ds-cream))] transition hover:bg-[hsl(var(--ds-forest-deep))]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-forest-deep))]/85 p-2 text-[hsl(var(--ds-cream))] transition hover:bg-[hsl(var(--ds-forest-deep))]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <ZoomBar
          scale={zoom.scale}
          onScale={zoom.setScale}
          onReset={zoom.reset}
          expanded={expanded}
          onToggleExpand={() => setExpanded((v) => !v)}
        />
      </div>

      {!expanded && photo.caption && (
        <p
          onClick={(e) => e.stopPropagation()}
          className="border-t border-[hsl(var(--ds-gold))]/20 px-4 py-2 text-center text-[12px] italic text-[hsl(var(--ds-cream))]/85"
        >
          {photo.caption}
        </p>
      )}
    </div>,
    document.body,
  );
};

export default OuvragePhotoViewer;
