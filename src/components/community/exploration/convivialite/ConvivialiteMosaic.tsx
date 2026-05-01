import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flag, Trash2, X } from 'lucide-react';
import type { ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';

interface Props {
  photos: ConvivialitePhoto[];
  currentUserId?: string;
  isAdmin?: boolean;
  onReport: (photo: ConvivialitePhoto) => void;
  onDelete: (photo: ConvivialitePhoto) => void;
}

const ConvivialiteMosaic: React.FC<Props> = ({ photos, currentUserId, isAdmin, onReport, onDelete }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 text-white/60">
        <p className="text-sm">Le mur attend ses premiers instants.</p>
        <p className="text-xs mt-2 text-white/40">Les Ambassadeurs et Sentinelles tisseront ici la mémoire vivante du collectif.</p>
      </div>
    );
  }

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
        {photos.map((photo, i) => {
          const canDelete = isAdmin || photo.user_id === currentUserId;
          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.6) }}
              className="mb-3 break-inside-avoid relative group cursor-pointer"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={photo.url}
                alt={`Instant partagé par ${photo.author_prenom || 'un marcheur'}`}
                loading="lazy"
                className="w-full rounded-xl shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-emerald-500/20"
                style={photo.width && photo.height ? { aspectRatio: `${photo.width} / ${photo.height}` } : undefined}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-end justify-between text-white text-[11px]">
                <span className="font-medium drop-shadow">
                  {photo.author_prenom} {photo.author_nom}
                </span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onReport(photo)}
                    className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                    title="Signaler"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(photo)}
                      className="w-7 h-7 rounded-full bg-black/50 hover:bg-red-500/80 backdrop-blur flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {lightboxPhoto && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length)); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <motion.img
              key={lightboxPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={lightboxPhoto.url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm text-center">
              <div className="font-semibold">{lightboxPhoto.author_prenom} {lightboxPhoto.author_nom}</div>
              <div className="text-white/60 text-xs">
                {new Date(lightboxPhoto.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConvivialiteMosaic;
