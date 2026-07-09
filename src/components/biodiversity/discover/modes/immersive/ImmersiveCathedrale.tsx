import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { getSpeciesPhoto } from '../../useDiscoverData';
import { getChapter, getKingdomAccent, speciesGps } from './kingdomAccent';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

const DURATION = 5500;

type Slide =
  | { kind: 'species'; species: BiodiversitySpecies }
  | { kind: 'chapter'; chapter: { id: string; label: string; tagline: string }; count: number };

function buildSlides(species: BiodiversitySpecies[]): Slide[] {
  // Group by chapter, keep order deterministic
  const byChap = new Map<string, { label: string; tagline: string; items: BiodiversitySpecies[] }>();
  for (const s of species) {
    const c = getChapter(s);
    if (!byChap.has(c.id)) byChap.set(c.id, { label: c.label, tagline: c.tagline, items: [] });
    byChap.get(c.id)!.items.push(s);
  }
  const out: Slide[] = [];
  for (const [id, group] of byChap) {
    out.push({ kind: 'chapter', chapter: { id, label: group.label, tagline: group.tagline }, count: group.items.length });
    for (const s of group.items) out.push({ kind: 'species', species: s });
  }
  return out;
}

const ImmersiveCathedrale: React.FC<Props> = ({ species, photoBy }) => {
  const slides = useMemo(() => buildSlides(species), [species]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => { setIdx(0); }, [slides]);

  useEffect(() => {
    if (paused || slides.length === 0) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % slides.length), DURATION);
    return () => clearTimeout(t);
  }, [idx, paused, slides.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % Math.max(slides.length, 1));
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + slides.length) % Math.max(slides.length, 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/50">
        Aucune espèce avec photo.
      </div>
    );
  }

  const slide = slides[idx];
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 60) {
      setIdx((i) => (dx < 0 ? (i + 1) % slides.length : (i - 1 + slides.length) % slides.length));
    } else setPaused((p) => !p);
    touchStart.current = null;
  };

  return (
    <div
      className="absolute inset-0 bg-black overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait">
        {slide.kind === 'chapter' ? (
          <motion.div
            key={'chap-' + idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black text-center px-8"
          >
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.5 }}
              transition={{ delay: 0.3, duration: 0.9 }}
              className="text-xs uppercase tracking-[0.5em] text-white/40 mb-8"
            >
              Acte {Math.floor(idx / 2) + 1}
            </motion.p>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-5xl sm:text-8xl font-light tracking-tight text-white"
            >
              {slide.chapter.label}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.7 }}
              transition={{ delay: 1.0, duration: 0.9 }}
              className="mt-6 text-lg sm:text-2xl italic text-white/60 font-serif"
            >
              {slide.chapter.tagline}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="mt-10 text-sm tracking-widest uppercase text-white/40"
            >
              {slide.count} présence{slide.count > 1 ? 's' : ''} recensée{slide.count > 1 ? 's' : ''}
            </motion.p>
          </motion.div>
        ) : (
          <CathedraleSpeciesSlide key={'sp-' + slide.species.id + '-' + idx} species={slide.species} photoBy={photoBy} paused={paused} />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 z-20">
        <button aria-label="Précédent" onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
          className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 z-20">
        <button aria-label="Suivant" onClick={() => setIdx((i) => (i + 1) % slides.length)}
          className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <button aria-label={paused ? 'Reprendre' : 'Pause'} onClick={() => setPaused((p) => !p)}
        className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center z-20">
        {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </button>

      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/10 z-20">
        <motion.div key={'bar-' + idx} className="h-full bg-white/80"
          initial={{ width: '0%' }} animate={{ width: paused ? '0%' : '100%' }}
          transition={{ duration: paused ? 0 : DURATION / 1000, ease: 'linear' }} />
      </div>
    </div>
  );
};

const CathedraleSpeciesSlide: React.FC<{ species: BiodiversitySpecies; photoBy: Map<string, string>; paused: boolean }> = ({
  species, photoBy, paused,
}) => {
  const accent = getKingdomAccent(species);
  const photo = getSpeciesPhoto(photoBy, species);
  const name = species.commonName?.trim() || species.scientificName;
  const gps = speciesGps(species);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
      className="absolute inset-0"
    >
      {/* Background: blurred, zoomed, slow-drifting */}
      {photo && (
        <motion.img
          src={photo} alt=""
          aria-hidden
          initial={{ scale: 1.4 }}
          animate={{ scale: 1.55 }}
          transition={{ duration: DURATION / 1000, ease: 'linear' }}
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-black/30" />

      {/* Halo tinted by kingdom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${accent.glow} 0%, rgba(0,0,0,0) 55%)`,
        }}
      />

      {/* Foreground image */}
      {photo ? (
        <motion.img
          src={photo} alt={name}
          initial={{ scale: 1.0 }}
          animate={{ scale: paused ? 1.0 : 1.09 }}
          transition={{ duration: DURATION / 1000, ease: 'linear' }}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ filter: `drop-shadow(0 0 40px ${accent.glow})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      {/* Gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40 pointer-events-none" />

      {/* Text */}
      <div className="absolute bottom-0 inset-x-0 p-6 sm:p-14 z-10">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.25em] backdrop-blur"
            style={{ backgroundColor: `${accent.hex}22`, border: `1px solid ${accent.hex}55`, color: '#fff' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent.hex }} />
            {accent.label}
          </span>
          {species.family && (
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">{species.family}</span>
          )}
        </div>
        <StaggeredHeadline text={name} />
        {species.commonName && species.commonName !== species.scientificName && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 0.75 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-3 text-lg sm:text-2xl italic text-white/70 font-serif"
          >
            {species.scientificName}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-5 text-xs sm:text-sm text-white/50"
        >
          {species.observations} observation{species.observations > 1 ? 's' : ''}
          {gps && ` · ${gps.lat.toFixed(3)}°, ${gps.lon.toFixed(3)}°`}
        </motion.p>
      </div>
    </motion.div>
  );
};

const StaggeredHeadline: React.FC<{ text: string }> = ({ text }) => {
  const letters = Array.from(text);
  return (
    <h2 className="text-4xl sm:text-7xl font-light leading-[0.95] tracking-tight text-white">
      {letters.map((c, i) => (
        <motion.span
          key={i}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.025, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block"
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </h2>
  );
};

export default ImmersiveCathedrale;
