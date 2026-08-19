import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { CapteurPhoto } from '@/hooks/iot/useCapteurPhotos';

const SWIPE_X = 60;
const SWIPE_DOWN = 90;

/** Visionneuse plein écran du reportage d'un capteur — mobile first (balayage). */
export const SensorPhotoViewer: React.FC<{
  photos: CapteurPhoto[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}> = ({ photos, index, onClose, onNavigate }) => {
  const open = index !== null && index >= 0 && index < photos.length;
  const i = (index ?? 0) as number;
  const photo = open ? photos[i] : null;

  const go = React.useCallback(
    (dir: -1 | 1) => onNavigate(Math.min(Math.max(i + dir, 0), photos.length - 1)),
    [i, photos.length, onNavigate],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose]);

  // Gestes tactiles : balayage horizontal = photo suivante/précédente, vers le bas = fermer.
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = React.useState(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag(e.clientX - start.current.x);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    setDrag(0);
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_X) go(dx < 0 ? 1 : -1);
    else if (dy > SWIPE_DOWN && Math.abs(dx) < SWIPE_X) onClose();
  };

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[4400] flex touch-none select-none items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Revenir à la fiche"
            className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <span
              className="absolute left-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
              style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            >
              {i + 1} / {photos.length}
            </span>
          )}

          {i > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Photo précédente"
              className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:left-8"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {i < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Photo suivante"
              className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:right-8"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <motion.div
            key={photo.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: drag * 0.35 }}
            transition={{ x: { duration: 0 } }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { start.current = null; setDrag(0); }}
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
                draggable={false}
                onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                className="relative max-h-[72vh] w-full object-contain opacity-0 transition-opacity duration-300"
              />
            </div>

            <div className="mt-3 text-center text-sm text-white/80">
              {photo.caption && <div className="font-medium text-white">{photo.caption}</div>}
              <div className="mt-0.5 inline-flex flex-wrap items-center justify-center gap-2 text-xs">
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

              {photos.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {photos.map((p, k) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`Photo ${k + 1}`}
                      onClick={(e) => { e.stopPropagation(); onNavigate(k); }}
                      className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
              {photos.length > 1 && (
                <p className="mt-2 text-[10px] text-white/40 md:hidden">
                  Balayez pour naviguer · vers le bas pour revenir
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SensorPhotoViewer;
