import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Camera, ExternalLink } from 'lucide-react';
import type { GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import { GEOFENCE_LABELS } from '@/lib/geofence';
import { useImageZoomPan } from '@/hooks/useImageZoomPan';
import { hiResPhotoUrl } from '@/utils/photoUtils';
import ZoomBar from './ZoomBar';
import { useSpeciesThumb } from '@/hooks/useSpeciesThumb';

/** Un cliché affiché en grand : terrain du marcheur, observation, ou référence. */
interface PhotoFrame {
  url: string;
  kind: 'walker' | 'observation' | 'reference';
  attribution?: string | null;
}



interface Props {
  items: GpsCandidate[];
  currentId: string | null;
  onChange: (id: string) => void;
  onClose: () => void;
  displayNameFor: (w: { scientificName?: string | null; commonName?: string | null }) => string;
}

/**
 * Visionneuse plein écran des photos d'observation (Carte des révélations).
 * Navigation ← → clavier / boutons, Échap pour fermer, légende complète.
 */
export const RevealPhotoLightbox: React.FC<Props> = ({
  items,
  currentId,
  onChange,
  onClose,
  displayNameFor,
}) => {
  const photoItems = useMemo(() => items.filter((w) => !!w.photoUrl), [items]);
  const index = photoItems.findIndex((w) => w.id === currentId);
  const current = index >= 0 ? photoItems[index] : null;

  /**
   * Deux clichés par observation, dans l'ordre qui aide à juger l'emplacement :
   *   1. la photo prise sur le terrain par le marcheur,
   *   2. la photo de référence de l'espèce (iNaturalist).
   */
  const { data: thumb } = useSpeciesThumb(current?.scientificName || undefined);
  const frames = useMemo<PhotoFrame[]>(() => {
    if (!current) return [];
    const out: PhotoFrame[] = [
      {
        url: current.photoUrl as string,
        kind: current.source === 'marcheur' ? 'walker' : 'observation',
      },
    ];
    const ref = thumb?.photo_url;
    if (ref && ref !== current.photoUrl) {
      out.push({ url: ref, kind: 'reference', attribution: thumb?.photo_attribution || null });
    }
    return out;
  }, [current, thumb]);

  const [frame, setFrame] = useState(0);
  useEffect(() => setFrame(0), [currentId]);
  const frameIdx = Math.min(frame, Math.max(frames.length - 1, 0));
  const currentFrame = frames[frameIdx] || null;

  /** Précédent / Suivant : on parcourt d'abord les clichés, puis les observations. */
  const go = useCallback(
    (delta: number) => {
      if (!photoItems.length || index < 0) return;
      const next = frameIdx + delta;
      if (next >= 0 && next < frames.length) {
        setFrame(next);
        return;
      }
      const nextObs = (index + delta + photoItems.length) % photoItems.length;
      setFrame(0);
      onChange(photoItems[nextObs].id);
    },
    [photoItems, index, onChange, frameIdx, frames.length],
  );

  const zoom = useImageZoomPan(`${currentId}#${frameIdx}`);
  const [expanded, setExpanded] = useState(false);

  // Montée en résolution de la photo courante (iNaturalist square/medium → large)
  const baseUrl = currentFrame?.url || null;
  const [src, setSrc] = useState<string | null>(baseUrl);
  const [loadingHiRes, setLoadingHiRes] = useState(false);

  useEffect(() => {
    setSrc(baseUrl);
    const hi = hiResPhotoUrl(baseUrl);
    if (!hi) return;
    setLoadingHiRes(true);
    const img = new Image();
    img.onload = () => {
      setSrc(hi);
      setLoadingHiRes(false);
    };
    img.onerror = () => setLoadingHiRes(false);
    img.src = hi;
    return () => {
      img.onload = null;
      img.onerror = null;
      setLoadingHiRes(false);
    };
  }, [baseUrl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoom.isZoomed) zoom.reset();
        else onClose();
      }
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === '+' || e.key === '=') zoom.zoomBy(1.4);
      if (e.key === '-' || e.key === '_') zoom.zoomBy(1 / 1.4);
      if (e.key === '0') zoom.reset();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onClose, zoom]);

  if (!current) return null;

  const inatUrl = current.inatObservationId
    ? `https://www.inaturalist.org/observations/${current.inatObservationId}`
    : null;


  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[4000] bg-black/90 flex flex-col items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo de l'observation"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la visionneuse"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/25 transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Pastille de registre : on sait toujours quel cliché on regarde. */}
      {currentFrame && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-white/12 px-1 py-1 text-white"
        >
          {frames.map((f, i) => (
            <button
              key={f.url}
              type="button"
              onClick={() => setFrame(i)}
              className={`rounded-full px-3 py-1 text-[11px] transition ${
                i === frameIdx ? 'bg-white text-black font-medium' : 'hover:bg-white/20'
              }`}
            >
              {f.kind === 'reference'
                ? '🌐 Référence iNaturalist'
                : f.kind === 'walker'
                  ? '📷 Photo du marcheur'
                  : '🌐 Photo de l’observation'}
            </button>
          ))}
        </div>
      )}

      {(photoItems.length > 1 || frames.length > 1) && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-3 md:left-6 w-11 h-11 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-3 md:right-6 w-11 h-11 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/25 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        ref={zoom.containerRef}
        onClick={(e) => e.stopPropagation()}
        {...zoom.handlers}
        style={{ touchAction: 'none' }}
        className={`relative overflow-hidden rounded-xl shadow-2xl bg-black/40 ${
          expanded ? 'h-[88vh]' : 'h-[72vh]'
        } w-[92vw] max-w-[1400px] ${
          zoom.isPanning ? 'cursor-grabbing' : zoom.isZoomed ? 'cursor-grab' : 'cursor-zoom-in'
        }`}
      >
        <img
          src={src || currentFrame?.url || (current.photoUrl as string)}
          alt={displayNameFor(current)}
          draggable={false}
          style={{ transform: zoom.transform, willChange: 'transform' }}
          className="w-full h-full object-contain select-none transition-transform duration-75"
        />


        <ZoomBar
          scale={zoom.scale}
          onScale={zoom.setScale}
          onReset={zoom.reset}
          expanded={expanded}
          onToggleExpand={() => setExpanded((v) => !v)}
          loadingHiRes={loadingHiRes}
        />
      </div>


      {!expanded && (
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 w-full max-w-2xl rounded-xl bg-white/10 backdrop-blur px-4 py-3 text-white"
      >

        <div className="font-serif text-lg leading-tight">{displayNameFor(current)}</div>
        <div className="text-xs italic opacity-70">{current.scientificName}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] opacity-80">
          <span>
            {current.source === 'marcheur'
              ? '📷 Observation marcheur'
              : `🌐 Observation citoyenne${current.observerName ? ` · ${current.observerName}` : ''}`}
          </span>
          {current.observationDate && (
            <span className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {new Date(current.observationDate).toLocaleDateString('fr-FR')}
            </span>
          )}
          {current.geofenceStatus === 'outside' && (
            <span className="text-[#f0a58f]">
              ⚠︎ {GEOFENCE_LABELS.outside}
              {current.geofenceDistanceM ? ` · ${current.geofenceDistanceM} m` : ''}
            </span>
          )}
          {current.overrideStatus === 'repositioned' && (
            <span className="text-[#a8dcb5]">✎ Position corrigée par un curateur</span>
          )}
          {inatUrl && (
            <a
              href={inatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 underline underline-offset-2 hover:opacity-100"
            >
              <ExternalLink className="w-3 h-3" /> Voir sur iNaturalist
            </a>
          )}
          {currentFrame?.kind === 'reference' && currentFrame.attribution && (
            <span className="opacity-60">© {currentFrame.attribution}</span>
          )}
          <span className="ml-auto opacity-60">
            {frames.length > 1 ? `cliché ${frameIdx + 1}/${frames.length} · ` : ''}
            {index + 1} / {photoItems.length}
          </span>
        </div>
      </div>
      )}
    </motion.div>,

    document.body,
  );
};

export default RevealPhotoLightbox;
