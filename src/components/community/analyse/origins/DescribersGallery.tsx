import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Landmark, History, Feather, Calendar, MapPin } from 'lucide-react';
import type { DescriberAggregate } from '@/hooks/useExplorationBiogeography';

type ViewMode = 'grid' | 'pantheon' | 'timeline';
const STORAGE_KEY = 'origins.describersView';

interface Props {
  describers: DescriberAggregate[];
  onOpenDescriber: (name: string) => void;
}

const eraEmoji = (year?: number): string => {
  if (!year) return '🔬';
  if (year < 1800) return '📜';
  if (year < 1900) return '🎩';
  if (year < 1980) return '🔬';
  return '🧬';
};

const eraLabel = (year?: number): string => {
  if (!year) return '—';
  if (year < 1800) return 'XVIIIᵉ siècle';
  if (year < 1900) return 'XIXᵉ siècle';
  if (year < 2000) return 'XXᵉ siècle';
  return 'XXIᵉ siècle';
};

const eraGradient = (year?: number): string => {
  if (!year) return 'from-slate-500/15 to-slate-700/10';
  if (year < 1800) return 'from-amber-700/20 to-rose-700/10';
  if (year < 1900) return 'from-amber-500/20 to-orange-500/10';
  if (year < 1980) return 'from-emerald-500/20 to-teal-500/10';
  return 'from-cyan-500/20 to-blue-500/10';
};

// ---------- Mode A : Grid ----------
const GridMode: React.FC<{ items: DescriberAggregate[]; onOpen: (n: string) => void }> = ({ items, onOpen }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    {items.map((d, i) => (
      <motion.button
        key={d.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.03, 0.4) }}
        onClick={() => onOpen(d.name)}
        className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${eraGradient(d.year)} p-4 text-left hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-300`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="text-3xl">{eraEmoji(d.year)}</div>
          {d.country && <div className="text-xl" title={d.country.nameFr}>{d.country.flag}</div>}
        </div>
        <div className="text-sm font-semibold italic leading-tight line-clamp-2">{d.name}</div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {d.birthYear && <span>* {d.birthYear}</span>}
          {d.year && <span>· décrit en {d.year}</span>}
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 ring-1 ring-rose-500/30 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
          <Feather className="w-2.5 h-2.5" />
          {d.species.length} espèce{d.species.length > 1 ? 's' : ''}
        </div>
      </motion.button>
    ))}
  </div>
);

// ---------- Mode B : Pantheon ----------
const PantheonMode: React.FC<{ items: DescriberAggregate[]; onOpen: (n: string) => void }> = ({ items, onOpen }) => (
  <div className="relative rounded-3xl bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 p-6 sm:p-10 overflow-hidden">
    {/* Subtle museum-floor glow */}
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

    <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {items.map((d, i) => (
        <motion.button
          key={d.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.05, 0.6), duration: 0.6 }}
          onClick={() => onOpen(d.name)}
          className="group relative text-left"
        >
          {/* Gilded frame */}
          <div className="relative rounded-lg p-[3px] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_10px_40px_-15px_rgba(245,158,11,0.5)] group-hover:shadow-[0_15px_60px_-10px_rgba(245,158,11,0.7)] transition-shadow duration-500">
            <div className="rounded-md bg-gradient-to-b from-stone-800 to-stone-900 aspect-[3/4] flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {/* Light beam */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-40 bg-amber-200/10 blur-2xl rounded-full" />
              <div className="relative text-7xl mb-3 group-hover:scale-110 transition-transform duration-500">
                {eraEmoji(d.year)}
              </div>
              {d.country && (
                <div className="absolute top-3 right-3 text-2xl drop-shadow-lg">{d.country.flag}</div>
              )}
              <div className="absolute top-3 left-3 text-[9px] uppercase tracking-widest text-amber-400/70 font-semibold">
                {eraLabel(d.year)}
              </div>
            </div>
          </div>

          {/* Engraved plaque */}
          <div className="mt-3 mx-2 rounded-md bg-gradient-to-b from-stone-200 to-stone-400 dark:from-stone-300 dark:to-stone-500 px-3 py-2 shadow-inner border border-stone-500/40">
            <div className="text-xs font-serif italic text-stone-900 text-center leading-tight line-clamp-2">
              {d.name}
            </div>
            <div className="mt-0.5 text-[10px] text-stone-700 text-center font-medium">
              {d.birthYear && <span>{d.birthYear}</span>}
              {d.birthYear && d.year && <span> – </span>}
              {!d.birthYear && d.year && <span>fl. </span>}
              {d.year && <span>{d.year}</span>}
            </div>
            <div className="mt-1 text-center text-[10px] text-amber-700 font-bold uppercase tracking-wider">
              {d.species.length} esp.
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

// ---------- Mode C : Timeline ----------
const TimelineMode: React.FC<{ items: DescriberAggregate[]; onOpen: (n: string) => void }> = ({ items, onOpen }) => {
  const withYear = items.filter((d) => d.year);
  const minYear = Math.min(1750, ...withYear.map((d) => d.year!));
  const maxYear = Math.max(2026, ...withYear.map((d) => d.year!));
  const span = maxYear - minYear;
  const maxSp = Math.max(1, ...items.map((d) => d.species.length));

  const decades = useMemo(() => {
    const arr: number[] = [];
    const start = Math.floor(minYear / 50) * 50;
    for (let y = start; y <= maxYear; y += 50) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const centuryColor = (y?: number) => {
    if (!y) return '#94a3b8';
    if (y < 1800) return '#b45309';
    if (y < 1900) return '#d97706';
    if (y < 2000) return '#10b981';
    return '#06b6d4';
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/5 to-transparent p-4 sm:p-6">
      {/* Desktop / tablet : horizontal */}
      <div className="hidden sm:block">
        <div className="relative overflow-x-auto pb-4">
          <div className="relative min-w-[800px] h-[280px]">
            {/* axis line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
            {/* decade labels */}
            {decades.map((y) => {
              const x = ((y - minYear) / span) * 100;
              return (
                <div
                  key={y}
                  className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${x}%` }}
                >
                  <div className="w-px h-3 bg-border" />
                  <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">{y}</div>
                </div>
              );
            })}
            {/* dots */}
            {withYear.map((d, i) => {
              const x = ((d.year! - minYear) / span) * 100;
              const size = 18 + (d.species.length / maxSp) * 36;
              const above = i % 2 === 0;
              return (
                <button
                  key={d.name}
                  onClick={() => onOpen(d.name)}
                  className="absolute -translate-x-1/2 group"
                  style={{
                    left: `${x}%`,
                    top: above ? `calc(50% - ${size / 2 + 10}px)` : `calc(50% + 10px)`,
                  }}
                  title={`${d.name} · ${d.year} · ${d.species.length} esp.`}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg ring-2 ring-background hover:scale-110 transition-transform"
                    style={{
                      width: size, height: size, background: centuryColor(d.year),
                    }}
                  >
                    {d.species.length}
                  </div>
                  <div className={`absolute left-1/2 -translate-x-1/2 ${above ? 'top-full mt-1' : 'bottom-full mb-1'} whitespace-nowrap text-[10px] italic text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-1.5 py-0.5 rounded`}>
                    {d.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile : vertical */}
      <div className="sm:hidden relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/40 via-amber-500/30 to-amber-500/0" />
        <ul className="space-y-3">
          {withYear.map((d) => {
            const size = 30 + (d.species.length / maxSp) * 20;
            return (
              <li key={d.name} className="relative">
                <button
                  onClick={() => onOpen(d.name)}
                  className="absolute -left-[26px] top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-background shadow"
                  style={{ width: size, height: size, background: centuryColor(d.year) }}
                >
                  {d.species.length}
                </button>
                <button
                  onClick={() => onOpen(d.name)}
                  className="ml-4 w-full text-left rounded-xl border border-border/60 bg-card/60 p-3 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                    <Calendar className="w-3 h-3" /> {d.year}
                  </div>
                  <div className="text-sm font-semibold italic leading-tight mt-0.5">{d.name}</div>
                  {d.country && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="w-2.5 h-2.5" />
                      {d.country.flag} {d.country.nameFr}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// ---------- Main switcher ----------
const DescribersGallery: React.FC<Props> = ({ describers, onOpenDescriber }) => {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'grid';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  if (!describers.length) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
        Aucun descripteur identifié pour le moment.
      </div>
    );
  }

  const tabs: { id: ViewMode; label: string; icon: any }[] = [
    { id: 'grid', label: 'Grille', icon: LayoutGrid },
    { id: 'pantheon', label: 'Panthéon', icon: Landmark },
    { id: 'timeline', label: 'Frise', icon: History },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-rose-500" />
          <h4 className="text-sm font-semibold">
            Galerie des découvreurs ·{' '}
            <span className="text-muted-foreground font-normal">{describers.length}</span>
          </h4>
        </div>
        <div className="inline-flex items-center rounded-full border border-border bg-background/80 p-0.5 backdrop-blur">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {view === 'grid' && <GridMode items={describers} onOpen={onOpenDescriber} />}
          {view === 'pantheon' && <PantheonMode items={describers} onOpen={onOpenDescriber} />}
          {view === 'timeline' && <TimelineMode items={describers} onOpen={onOpenDescriber} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default DescribersGallery;
