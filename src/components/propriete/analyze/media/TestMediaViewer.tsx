import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TestMedia } from '@/hooks/propriete/usePropertyTestMedias';

export const TestMediaViewer: React.FC<{
  medias: TestMedia[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}> = ({ medias, index, onClose, onNavigate }) => {
  const open = index !== null && index >= 0 && index < medias.length;
  const media = open ? medias[index as number] : null;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(Math.min((index as number) + 1, medias.length - 1));
      if (e.key === 'ArrowLeft') onNavigate(Math.max((index as number) - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, medias.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && media && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {(index as number) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((index as number) - 1);
              }}
              aria-label="Précédent"
              className="absolute left-3 md:left-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {(index as number) < medias.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((index as number) + 1);
              }}
              aria-label="Suivant"
              className="absolute right-3 md:right-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <motion.div
            key={media.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full"
          >
            <div className="rounded-2xl overflow-hidden bg-black shadow-2xl">
              {media.media_type === 'video' ? (
                <video src={media.url} controls autoPlay className="w-full max-h-[76vh]" />
              ) : (
                <img
                  src={media.url}
                  alt={media.caption ?? 'Preuve de terrain'}
                  className="w-full max-h-[76vh] object-contain"
                />
              )}
            </div>
            <div className="mt-3 text-center text-white/80 text-sm">
              <div className="font-medium text-white">
                {(media.sample_location || media.sample_label || '—') as string}
              </div>
              <div className="text-xs mt-0.5">
                {media.caption ? `${media.caption} · ` : ''}
                Ajouté le{' '}
                {new Date(media.created_at).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
