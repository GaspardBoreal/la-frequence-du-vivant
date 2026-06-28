import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { getSpeciesPhoto } from '../useDiscoverData';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

const DURATION = 4500;

function seededShuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  let h = arr.reduce((a, _, i) => a + i, 17);
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 9301 + 49297) % 233280;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const ImmersiveScreensaver: React.FC<Props> = ({ species, photoBy }) => {
  const ordered = useMemo(() => seededShuffle(species), [species]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => { setIdx(0); }, [ordered]);

  useEffect(() => {
    if (paused || ordered.length === 0) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % ordered.length), DURATION);
    return () => clearTimeout(t);
  }, [idx, paused, ordered.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % Math.max(ordered.length, 1));
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + ordered.length) % Math.max(ordered.length, 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [ordered.length]);

  if (ordered.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/50">
        Aucune espèce avec photo pour le mode Immersif.
      </div>
    );
  }

  const current = ordered[idx];
  const photo = getSpeciesPhoto(photoBy, current);
  const displayName = current.commonName?.trim() || current.scientificName;

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 60) {
      setIdx((i) =>
        dx < 0
          ? (i + 1) % ordered.length
          : (i - 1 + ordered.length) % ordered.length,
      );
    } else {
      setPaused((p) => !p);
    }
    touchStart.current = null;
  };

  return (
    <div
      className="absolute inset-0 bg-black overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + '-' + idx}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          {photo ? (
            <motion.img
              src={photo}
              alt={displayName}
              initial={{ scale: 1.0 }}
              animate={{ scale: paused ? 1.0 : 1.08 }}
              transition={{ duration: DURATION / 1000, ease: 'linear' }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Texte */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + '-text'}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="absolute bottom-0 inset-x-0 p-6 sm:p-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">
            {current.family || current.iconicTaxon || current.kingdom}
          </p>
          <h2 className="text-4xl sm:text-7xl font-light leading-none tracking-tight">{displayName}</h2>
          {current.commonName && current.commonName !== current.scientificName && (
            <p className="mt-2 text-lg sm:text-2xl italic text-white/70">{current.scientificName}</p>
          )}
          <p className="mt-4 text-sm text-white/50">
            {idx + 1} / {ordered.length} · {current.observations} observation{current.observations > 1 ? 's' : ''}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6">
        <button
          aria-label="Précédent"
          onClick={() => setIdx((i) => (i - 1 + ordered.length) % ordered.length)}
          className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6">
        <button
          aria-label="Suivant"
          onClick={() => setIdx((i) => (i + 1) % ordered.length)}
          className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <button
        aria-label={paused ? 'Reprendre' : 'Pause'}
        onClick={() => setPaused((p) => !p)}
        className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center"
      >
        {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
        <motion.div
          key={current.id + '-' + idx + '-bar'}
          className="h-full bg-white/80"
          initial={{ width: '0%' }}
          animate={{ width: paused ? '0%' : '100%' }}
          transition={{ duration: paused ? 0 : DURATION / 1000, ease: 'linear' }}
        />
      </div>
    </div>
  );
};

export default ImmersiveScreensaver;
