import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, MapPin, Users, Sparkles } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { getSpeciesPhoto } from '../../useDiscoverData';
import { getKingdomAccent, speciesGps } from './kingdomAccent';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

const CYCLE = 3200;

const ImmersiveScan: React.FC<Props> = ({ species, photoBy }) => {
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const ordered = species;
  const stats = useMemo(() => {
    const families = new Set(species.map((s) => s.family).filter(Boolean));
    const kingdoms = new Set(species.map((s) => getKingdomAccent(s).key));
    const observers = new Set<string>();
    let totalObs = 0;
    for (const s of species) {
      totalObs += s.observations;
      for (const a of s.attributions || []) {
        if (a.observerLogin) observers.add(a.observerLogin);
        else if (a.observerName) observers.add(a.observerName);
      }
    }
    return { families: families.size, kingdoms: kingdoms.size, observers: observers.size, totalObs };
  }, [species]);

  const avgObs = stats.totalObs / Math.max(species.length, 1);

  useEffect(() => {
    if (paused || ordered.length === 0) return;
    const t = setTimeout(() => setFeaturedIdx((i) => (i + 1) % ordered.length), CYCLE);
    return () => clearTimeout(t);
  }, [featuredIdx, paused, ordered.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowRight') setFeaturedIdx((i) => (i + 1) % Math.max(ordered.length, 1));
      if (e.key === 'ArrowLeft') setFeaturedIdx((i) => (i - 1 + ordered.length) % Math.max(ordered.length, 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [ordered.length]);

  if (ordered.length === 0) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/50">Aucune espèce.</div>;
  }

  const current = ordered[featuredIdx];
  const photo = getSpeciesPhoto(photoBy, current);
  const accent = getKingdomAccent(current);
  const gps = speciesGps(current);
  const relFreq = current.observations / Math.max(avgObs, 1);
  const badge =
    current.observations >= avgObs * 2
      ? { text: 'emblématique', color: '#facc15' }
      : current.observations <= 1
        ? { text: 'pionnière', color: '#22d3ee' }
        : null;

  // Unique contributors for this species
  const contributors = new Set<string>();
  for (const a of current.attributions || []) {
    if (a.observerLogin) contributors.add(a.observerLogin);
    else if (a.observerName) contributors.add(a.observerName);
  }
  const nContrib = contributors.size;

  return (
    <div className="absolute inset-0 bg-[#05070a] overflow-hidden text-white font-mono">
      {/* Top HUD */}
      <div className="absolute top-0 inset-x-0 border-b border-white/10 bg-black/60 backdrop-blur px-6 py-3 flex items-center justify-between text-[11px] tracking-widest uppercase z-30">
        <div className="flex items-center gap-4 text-white/70">
          <span className="text-emerald-400">● LIVE SCAN</span>
          <span>{ordered.length} espèces</span>
          <span>{stats.families} familles</span>
          <span>{stats.kingdoms} règnes</span>
          <span>{stats.observers} contributeur·rices</span>
          <span>{stats.totalObs} obs</span>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex items-center gap-1.5 text-white/60 hover:text-white"
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span>{paused ? 'PLAY' : 'PAUSE'}</span>
        </button>
      </div>

      {/* Main split */}
      <div className="absolute inset-0 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-0">
        {/* Left: scrolling grid */}
        <div className="relative overflow-hidden border-r border-white/10">
          <ScrollingGrid
            species={ordered}
            photoBy={photoBy}
            featuredIdx={featuredIdx}
            onPick={(i) => setFeaturedIdx(i)}
            paused={paused}
          />
        </div>

        {/* Right: featured pane */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + '-' + featuredIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="relative flex-1 min-h-0">
                {photo ? (
                  <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 40%, ${accent.glow} 0%, transparent 60%)`,
                  }}
                />
                {/* Crosshair corners */}
                {[
                  'top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3',
                ].map((pos) => (
                  <div key={pos} className={`absolute ${pos} h-6 w-6`}>
                    <div className="absolute top-0 left-0 h-full w-[2px]" style={{ backgroundColor: accent.hex }} />
                    <div className="absolute top-0 left-0 h-[2px] w-full" style={{ backgroundColor: accent.hex }} />
                  </div>
                ))}
              </div>

              {/* Info block */}
              <div className="relative px-6 py-5 border-t border-white/10 bg-black/70 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">
                      {String(featuredIdx + 1).padStart(3, '0')} / {String(ordered.length).padStart(3, '0')} · {accent.label}
                      {current.family ? ` · ${current.family}` : ''}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white truncate">
                      {current.commonName?.trim() || current.scientificName}
                    </h3>
                    {current.commonName && current.commonName !== current.scientificName && (
                      <p className="italic text-white/50 text-sm truncate">{current.scientificName}</p>
                    )}
                  </div>
                  {badge && (
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-widest"
                      style={{ backgroundColor: `${badge.color}22`, border: `1px solid ${badge.color}88`, color: badge.color }}
                    >
                      <Sparkles className="h-3 w-3" /> {badge.text}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Metric label="Observations" value={String(current.observations)} accent={accent.hex} />
                  <Metric label="Contributeurs" value={String(nContrib)} accent={accent.hex} icon={<Users className="h-3 w-3" />} />
                  <Metric label="Fréquence" value={`×${relFreq.toFixed(1)}`} accent={accent.hex} />
                </div>

                {/* GPS mini locator */}
                {gps && (
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-white/60">
                    <MapPin className="h-3 w-3" style={{ color: accent.hex }} />
                    <span>{gps.lat.toFixed(4)}° · {gps.lon.toFixed(4)}°</span>
                    <span className="ml-auto text-white/30">{current.attributions?.length || 0} points GPS</span>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom progress */}
      <div className="absolute bottom-0 inset-x-0 h-16 border-t border-white/10 bg-black/70 backdrop-blur px-6 flex items-center gap-3 z-20">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Timeline</span>
        <div className="relative flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${((featuredIdx + 1) / ordered.length) * 100}%`,
              backgroundColor: accent.hex,
              boxShadow: `0 0 12px ${accent.hex}`,
            }}
          />
        </div>
        <motion.div
          key={'cycle-' + featuredIdx}
          className="h-2 w-16 rounded-full bg-white/10 overflow-hidden"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: paused ? '0%' : '100%' }}
            transition={{ duration: paused ? 0 : CYCLE / 1000, ease: 'linear' }}
            className="h-full bg-white/60"
          />
        </motion.div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; accent: string; icon?: React.ReactNode }> = ({ label, value, accent, icon }) => (
  <div className="rounded-sm border border-white/10 bg-white/[0.02] px-3 py-2">
    <div className="text-[9px] uppercase tracking-widest text-white/40 flex items-center gap-1">{icon}{label}</div>
    <div className="text-xl font-light tabular-nums" style={{ color: accent }}>{value}</div>
  </div>
);

const ScrollingGrid: React.FC<{
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
  featuredIdx: number;
  onPick: (i: number) => void;
  paused: boolean;
}> = ({ species, photoBy, featuredIdx, onPick, paused }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll so the featured item stays roughly centered
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const child = el.querySelector<HTMLElement>(`[data-idx="${featuredIdx}"]`);
    if (!child) return;
    const target = child.offsetTop - el.clientHeight / 2 + child.clientHeight / 2;
    el.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [featuredIdx]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-y-auto p-3 no-scrollbar">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {species.map((s, i) => {
          const p = getSpeciesPhoto(photoBy, s);
          const active = i === featuredIdx;
          const a = getKingdomAccent(s);
          return (
            <button
              key={s.id}
              data-idx={i}
              onClick={() => onPick(i)}
              className="relative aspect-square rounded-sm overflow-hidden border transition-all"
              style={{
                borderColor: active ? a.hex : 'rgba(255,255,255,0.08)',
                boxShadow: active ? `0 0 20px ${a.glow}` : 'none',
                transform: active ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {p ? (
                <img
                  src={p} alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: active ? 'none' : 'grayscale(0.6) brightness(0.85)' }}
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-800" />
              )}
              <div className="absolute inset-0 bg-black/30" />
              <span
                className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: a.hex, boxShadow: `0 0 6px ${a.hex}` }}
              />
              <span className="absolute bottom-1 right-1 text-[9px] font-mono text-white/70">
                {String(s.observations).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ImmersiveScan;
