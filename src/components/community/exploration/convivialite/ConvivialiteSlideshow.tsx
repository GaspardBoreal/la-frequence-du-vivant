import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';

interface Props {
  photos: ConvivialitePhoto[];
  onClose?: () => void;
}

const SLIDE_MS = 5000;

const ConvivialiteSlideshow: React.FC<Props> = ({ photos }) => {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || photos.length === 0) return;
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, SLIDE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, playing, photos.length]);

  if (photos.length === 0) {
    return <div className="text-white/60 text-sm py-20 text-center">Aucune photo à projeter pour l'instant.</div>;
  }

  const current = photos[index];

  return (
    <div className="relative w-full h-[70vh] bg-black/80 rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={current.id}
          src={current.url}
          alt=""
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1.15 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: SLIDE_MS / 1000, ease: 'linear' } }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-between">
        <div className="text-white/90 text-sm">
          <div className="font-semibold">
            {current.author_prenom} {current.author_nom}
          </div>
          <div className="text-white/60 text-xs">
            {new Date(current.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition"
            aria-label={playing ? 'Pause' : 'Lecture'}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-wide">
        {index + 1} / {photos.length}
      </div>
    </div>
  );
};

export default ConvivialiteSlideshow;
