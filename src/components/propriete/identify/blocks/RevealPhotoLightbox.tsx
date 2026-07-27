import React, { useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Camera, ExternalLink } from 'lucide-react';
import type { GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import { GEOFENCE_LABELS } from '@/lib/geofence';

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

  const go = useCallback(
    (delta: number) => {
      if (!photoItems.length || index < 0) return;
      const next = (index + delta + photoItems.length) % photoItems.length;
      onChange(photoItems[next].id);
    },
    [photoItems, index, onChange],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onClose]);

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

      {photoItems.length > 1 && (
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

      <img
        src={current.photoUrl as string}
        alt={displayNameFor(current)}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[72vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
      />

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
          {photoItems.length > 1 && (
            <span className="ml-auto opacity-60">
              {index + 1} / {photoItems.length}
            </span>
          )}
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

export default RevealPhotoLightbox;
