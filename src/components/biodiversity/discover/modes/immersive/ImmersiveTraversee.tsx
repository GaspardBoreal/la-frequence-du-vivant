import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Rewind, FastForward, Compass } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { getSpeciesPhoto } from '../../useDiscoverData';
import { getKingdomAccent, speciesGps } from './kingdomAccent';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

interface PlacedSpecies {
  species: BiodiversitySpecies;
  /** normalized 0..1 x/y in the viewport */
  x: number;
  y: number;
  /** progress at which this species appears (0..1) */
  t: number;
}

/** Project species onto a stylized path. Uses GPS when available, otherwise a bezier. */
function placeSpecies(species: BiodiversitySpecies[]): PlacedSpecies[] {
  const gps = species.map((s) => ({ s, g: speciesGps(s) }));
  const withGps = gps.filter((x) => x.g !== null) as Array<{ s: BiodiversitySpecies; g: { lat: number; lon: number } }>;

  if (withGps.length >= 3) {
    const lats = withGps.map((x) => x.g.lat);
    const lons = withGps.map((x) => x.g.lon);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const spanLat = Math.max(maxLat - minLat, 0.0001);
    const spanLon = Math.max(maxLon - minLon, 0.0001);

    // Order by longitude (west→east) as pseudo-travel order
    const ordered = [...withGps].sort((a, b) => a.g.lon - b.g.lon);
    return ordered.map((x, i) => ({
      species: x.s,
      x: 0.08 + ((x.g.lon - minLon) / spanLon) * 0.84,
      y: 0.15 + (1 - (x.g.lat - minLat) / spanLat) * 0.7,
      t: i / Math.max(ordered.length - 1, 1),
    }));
  }

  // Fallback: distribute along a sine wave
  return species.map((s, i) => {
    const t = i / Math.max(species.length - 1, 1);
    return {
      species: s,
      x: 0.06 + t * 0.88,
      y: 0.5 + Math.sin(t * Math.PI * 2.5) * 0.28,
      t,
    };
  });
}

const BASE_DURATION_MS = 60000; // 1 min for full traversal at ×1

const ImmersiveTraversee: React.FC<Props> = ({ species, photoBy }) => {
  const placed = useMemo(() => placeSpecies(species), [species]);
  const [progress, setProgress] = useState(0); // 0..1
  const [speed, setSpeed] = useState<0 | 1 | 2>(1);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [finalMandala, setFinalMandala] = useState(false);

  useEffect(() => {
    if (speed === 0) return;
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setProgress((p) => {
        const next = p + (dt * speed) / BASE_DURATION_MS;
        if (next >= 1) { setFinalMandala(true); return 1; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [speed]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setSpeed((s) => (s === 0 ? 1 : 0)); }
      if (e.key === 'ArrowRight') setProgress((p) => Math.min(1, p + 0.05));
      if (e.key === 'ArrowLeft') { setProgress((p) => Math.max(0, p - 0.05)); setFinalMandala(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const visible = placed.filter((p) => p.t <= progress + 0.005);

  if (placed.length === 0) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/50">Aucune espèce.</div>;
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a1628] text-white">
      {/* Sky/terrain gradient background */}
      <div className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.15) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.18) 0%, transparent 55%),' +
            'linear-gradient(180deg, #0a1628 0%, #061019 100%)',
        }}
      />

      {/* Terrain grid */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0 L0 0 0 60" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Path */}
      <PathOverlay placed={placed} progress={progress} />

      {/* Species markers */}
      <AnimatePresence>
        {!finalMandala && visible.map((p) => (
          <SpeciesMarker key={p.species.id} placed={p} photoBy={photoBy} />
        ))}
      </AnimatePresence>

      {/* Final mandala */}
      <AnimatePresence>
        {finalMandala && (
          <FinalMandala placed={placed} photoBy={photoBy} onReplay={() => { setProgress(0); setFinalMandala(false); setSpeed(1); }} />
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/10 text-xs">
        <Compass className="h-3.5 w-3.5 text-emerald-400" />
        <span className="tabular-nums">{Math.round(progress * 100)}%</span>
        <span className="text-white/50">·</span>
        <span className="text-white/70">{visible.length} / {placed.length} rencontres</span>
      </div>

      {/* Controls */}
      {!finalMandala && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 backdrop-blur border border-white/10">
          <button onClick={() => { setProgress(0); setFinalMandala(false); }} className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Recommencer">
            <Rewind className="h-4 w-4" />
          </button>
          <button onClick={() => setSpeed(speed === 0 ? 1 : 0)} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label={speed === 0 ? 'Reprendre' : 'Pause'}>
            {speed === 0 ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button onClick={() => setSpeed(speed === 2 ? 1 : 2)} className="h-9 px-3 rounded-full hover:bg-white/10 flex items-center gap-1 text-xs" aria-label="Vitesse">
            <FastForward className="h-3.5 w-3.5" />
            ×{speed}
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-20">
        <div className="h-full bg-emerald-400" style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(52,211,153,0.7)' }} />
      </div>
    </div>
  );
};

const PathOverlay: React.FC<{ placed: PlacedSpecies[]; progress: number }> = ({ placed, progress }) => {
  if (placed.length < 2) return null;
  const d = placed.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${p.y * 100}`).join(' ');
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={d} stroke="rgba(148,163,184,0.25)" strokeWidth="0.3" fill="none" strokeDasharray="0.6 0.6" />
      <path
        d={d}
        stroke="rgba(52,211,153,0.9)"
        strokeWidth="0.4"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 1.5px rgba(52,211,153,0.8))' }}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
};

const SpeciesMarker: React.FC<{ placed: PlacedSpecies; photoBy: Map<string, string> }> = ({ placed, photoBy }) => {
  const { species, x, y } = placed;
  const accent = getKingdomAccent(species);
  const photo = getSpeciesPhoto(photoBy, species);
  const name = species.commonName?.trim() || species.scientificName;
  // Deterministic slight rotation
  const rot = ((species.id.charCodeAt(0) + species.id.charCodeAt(species.id.length - 1)) % 12) - 6;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: rot * 3, y: 20 }}
      animate={{ scale: 1, opacity: 1, rotate: rot, y: 0 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 1.2, 0.4, 1] }}
      className="absolute z-10"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translate(-50%,-50%)' }}
    >
      {/* Pulse ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0.9 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: `0 0 0 2px ${accent.hex}` }}
      />
      {/* Polaroid */}
      <div
        className="relative w-[110px] sm:w-[130px] bg-white/95 p-1.5 shadow-2xl"
        style={{ boxShadow: `0 8px 30px ${accent.glow}, 0 0 0 1px rgba(0,0,0,0.1)` }}
      >
        {photo ? (
          <div className="w-full aspect-square overflow-hidden">
            <img src={photo} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-square bg-zinc-200" />
        )}
        <div className="pt-1.5 pb-1 px-1 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{accent.label}</div>
          <div className="text-[11px] font-medium text-zinc-900 leading-tight truncate">{name}</div>
        </div>
      </div>
    </motion.div>
  );
};

const FinalMandala: React.FC<{
  placed: PlacedSpecies[];
  photoBy: Map<string, string>;
  onReplay: () => void;
}> = ({ placed, photoBy, onReplay }) => {
  const n = placed.length;
  const radius = 38; // in vmin-ish units via %
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur"
    >
      <div className="relative w-[92vmin] h-[92vmin]">
        {placed.map((p, i) => {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const cx = 50 + Math.cos(ang) * radius;
          const cy = 50 + Math.sin(ang) * radius;
          const photo = getSpeciesPhoto(photoBy, p.species);
          const a = getKingdomAccent(p.species);
          return (
            <motion.div
              key={p.species.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + (i / n) * 1.5, duration: 0.5, ease: [0.2, 1.3, 0.4, 1] }}
              className="absolute rounded-full overflow-hidden border-2"
              style={{
                left: `${cx}%`,
                top: `${cy}%`,
                width: 44,
                height: 44,
                transform: 'translate(-50%,-50%)',
                borderColor: a.hex,
                boxShadow: `0 0 12px ${a.glow}`,
              }}
              title={p.species.commonName || p.species.scientificName}
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-700" />
              )}
            </motion.div>
          );
        })}
        {/* Center label */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
        >
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-3">Vous avez traversé</div>
          <div className="text-5xl sm:text-7xl font-light">{n}</div>
          <div className="text-lg sm:text-2xl italic text-white/70 font-serif mt-1">formes de vivant</div>
        </motion.div>
        {/* Replay */}
        <button
          onClick={onReplay}
          className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-16 pointer-events-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm backdrop-blur"
        >
          Reprendre la traversée
        </button>
      </div>
    </motion.div>
  );
};

export default ImmersiveTraversee;
