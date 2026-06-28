import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import { Plus, Minus, RotateCcw, X } from 'lucide-react';
import { safeZoomSrc, computeSafeMaxScale } from './zoomImageSrc';
import { useFullscreenPortalTarget } from './useFullscreenPortalTarget';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** URL de l'image (mode simple). Si renderImage est fourni, il prime. */
  src?: string;
  alt?: string;
  /** Slot pour images custom (ex: image floutée du Mystery, image avec scale init). */
  renderImage?: (props: { className: string; style?: React.CSSProperties }) => React.ReactNode;
  /** Légende sous l'image (nom + nom scientifique, indices…). */
  caption?: React.ReactNode;
  /** Petite note d'avertissement pédagogique (ex: « Image floutée volontairement »). */
  notice?: React.ReactNode;
  initialScale?: number;
}

/**
 * Lightbox plein écran avec zoom/pan tactile + souris (react-zoom-pan-pinch).
 * Robuste mobile/tablette : source bridée, throttle anti-render-loop,
 * maxScale calculé selon la taille réelle de l'image, error boundary.
 */
const ZoomLightbox: React.FC<Props> = ({
  open,
  onOpenChange,
  src,
  alt = '',
  renderImage,
  caption,
  notice,
  initialScale = 1,
}) => {
  // Bloque le scroll body pendant l'ouverture
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const safeSrc = useMemo(() => safeZoomSrc(src), [src]);
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-[100dvh] sm:h-screen p-0 bg-black/90 backdrop-blur-sm border-0 rounded-none sm:rounded-none [&>button]:hidden"
      >
        <VisuallyHidden asChild>
          <DialogTitle>Zoom sur la photo {alt}</DialogTitle>
        </VisuallyHidden>
        <div
          className="relative w-full h-full flex items-center justify-center"
          onWheel={(e) => e.stopPropagation()}
        >
          <ZoomErrorBoundary onError={handleClose}>
            <ZoomInner
              src={safeSrc}
              alt={alt}
              renderImage={renderImage}
              initialScale={initialScale}
              onClose={handleClose}
            />
          </ZoomErrorBoundary>

          {/* Bandeau légende (top) */}
          {(caption || notice) && (
            <div className="pointer-events-none absolute top-0 inset-x-0 p-3 sm:p-4 flex flex-col items-center gap-1 text-center">
              {notice && (
                <div className="pointer-events-auto px-3 py-1 rounded-full bg-amber-200/95 text-amber-900 border border-amber-400/60 shadow text-sm"
                  style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
                  {notice}
                </div>
              )}
              {caption && (
                <div className="pointer-events-auto px-3 py-1.5 rounded-2xl bg-black/55 text-white"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
                  {caption}
                </div>
              )}
            </div>
          )}

          {/* Croix */}
          <button
            onClick={handleClose}
            aria-label="Fermer le zoom"
            className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[#3B2A1A] shadow"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface InnerProps {
  src?: string;
  alt?: string;
  renderImage?: (props: { className: string; style?: React.CSSProperties }) => React.ReactNode;
  initialScale: number;
  onClose: () => void;
}

const ZoomInner: React.FC<InnerProps> = ({ src, alt, renderImage, initialScale, onClose }) => {
  const [scale, setScale] = useState(initialScale);
  const [maxScale, setMaxScale] = useState(4);
  const rafRef = useRef<number | null>(null);
  const lastScaleRef = useRef(initialScale);

  // Throttle onTransform via rAF + delta minimal pour éviter les re-renders
  // cascade qui gèlent l'UI sur tablette.
  const handleTransform = useCallback((_ref: any, state: any) => {
    const next = state.scale as number;
    if (Math.abs(next - lastScaleRef.current) < 0.05) return;
    lastScaleRef.current = next;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setScale(lastScaleRef.current);
    });
  }, []);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  // Garde-fou dynamique : limite maxScale dès qu'on connaît la taille réelle.
  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const nw = e.currentTarget.naturalWidth;
    setMaxScale(computeSafeMaxScale(nw));
  }, []);

  return (
    <TransformWrapper
      initialScale={initialScale}
      minScale={1}
      maxScale={maxScale}
      centerOnInit
      wheel={{ step: 0.15 }}
      pinch={{ step: 5 }}
      doubleClick={{ mode: 'toggle', step: 2 }}
      limitToBounds
      panning={{ velocityDisabled: true }}
      onTransform={handleTransform}
    >
      <>
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          {renderImage ? (
            renderImage({
              className: 'max-w-[96vw] max-h-[88dvh] object-contain select-none',
            })
          ) : src ? (
            <img
              src={src}
              alt={alt}
              draggable={false}
              decoding="async"
              loading="eager"
              onLoad={handleImgLoad}
              className="max-w-[96vw] max-h-[88dvh] object-contain select-none"
            />
          ) : null}
        </TransformComponent>
        <ZoomToolbar scale={scale} onClose={onClose} />
      </>
    </TransformWrapper>
  );
};

const ZoomToolbar: React.FC<{ scale: number; onClose: () => void }> = React.memo(({ scale, onClose }) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const isZoomed = scale > 1.02;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-lg border border-white/60"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => zoomOut(0.4)}
        aria-label="Dézoomer"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-amber-100 text-[#3B2A1A]"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="px-2 text-sm tabular-nums text-[#3B2A1A]/80 min-w-[3rem] text-center"
        style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
        {scale.toFixed(1)}×
      </span>
      <button
        onClick={() => zoomIn(0.4)}
        aria-label="Zoomer"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-amber-100 text-[#3B2A1A]"
      >
        <Plus className="h-4 w-4" />
      </button>
      {isZoomed && (
        <button
          onClick={() => resetTransform()}
          aria-label="Réinitialiser le zoom"
          className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-amber-100 text-[#3B2A1A]"
          title="Réinitialiser"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
      <div className="w-px h-5 bg-[#3B2A1A]/15 mx-1" />
      <button
        onClick={onClose}
        className="px-3 h-9 inline-flex items-center justify-center rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-900 text-sm"
        style={{ fontFamily: '"Patrick Hand", sans-serif' }}
      >
        Revenir au jeu
      </button>
    </div>
  );
});
ZoomToolbar.displayName = 'ZoomToolbar';

/** Error boundary local : si rzpp / TransformComponent plante, on ferme
 *  proprement la lightbox au lieu de cracher tout l'écran. */
class ZoomErrorBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ZoomLightbox] crash interne, fermeture sécurisée', err);
    // Ferme à la frame suivante pour éviter setState pendant render
    setTimeout(() => this.props.onError(), 0);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-white text-center px-6" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
          Impossible d'afficher le zoom — retour au jeu…
        </div>
      );
    }
    return this.props.children;
  }
}

export default ZoomLightbox;
