import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { CapteurPhoto } from '@/hooks/iot/useCapteurPhotos';

/** Visionneuse plein écran du reportage d'un capteur. */
export const SensorPhotoViewer: React.FC<{
  photos: CapteurPhoto[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}> = ({ photos, index, onClose, onNavigate }) => {
  const open = index !== null && index >= 0 && index < photos.length;
  const photo = open ? photos[index as number] : null;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(Math.min((index as number) + 1, photos.length - 1));
      if (e.key === 'ArrowLeft') onNavigate(Math.max((index as number) - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, photos.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {(index as number) > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate((index as number) - 1); }}
              aria-label="Précédent"
              className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:left-8"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {(index as number) < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate((index as number) + 1); }}
              aria-label="Suivant"
              className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:right-8"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <motion.div
            key={photo.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl"
          >
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
              {photo.thumbUrl && photo.thumbUrl !== photo.url && (
                <img
                  src={photo.thumbUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-105 object-contain blur-sm"
                />
              )}
              <img
                src={photo.url}
                alt={photo.caption ?? 'Capteur en situation'}
                decoding="async"
                fetchPriority="high"
                onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                className="relative max-h-[76vh] w-full object-contain opacity-0 transition-opacity duration-300"
              />
            </div>
            <div className="mt-3 text-center text-sm text-white/80">
              {photo.caption && <div className="font-medium text-white">{photo.caption}</div>}
              <div className="mt-0.5 inline-flex items-center gap-2 text-xs">
                <span>
                  {new Date(photo.taken_at ?? photo.created_at).toLocaleString('fr-FR', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </span>
                {photo.lat != null && photo.lng != null && (
                  <span className="inline-flex items-center gap-1 opacity-80">
                    <MapPin className="h-3 w-3" /> {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SensorPhotoViewer;
