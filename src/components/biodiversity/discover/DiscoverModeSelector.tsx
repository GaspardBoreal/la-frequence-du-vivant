import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Sparkles, Rocket } from 'lucide-react';
import type { DiscoverMode } from './DiscoverFullscreen';

interface Props {
  count: number;
  filtersLabel?: string;
  onPick: (m: DiscoverMode) => void;
}

const CARDS: Array<{
  key: DiscoverMode;
  title: string;
  subtitle: string;
  hotkey: string;
  Icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  ring: string;
}> = [
  {
    key: 'kids',
    title: 'Enfant',
    subtitle: '4 mini-jeux dessinés à la main, pour apprendre en jouant.',
    hotkey: '1',
    Icon: Baby,
    gradient: 'from-amber-200/30 via-rose-200/20 to-transparent',
    ring: 'ring-amber-300/40',
  },
  {
    key: 'immersive',
    title: 'Immersif',
    subtitle: 'Carrousel cinématique. Une espèce plein écran toutes les 4 secondes.',
    hotkey: '2',
    Icon: Sparkles,
    gradient: 'from-emerald-400/30 via-cyan-400/20 to-transparent',
    ring: 'ring-emerald-300/50',
  },
  {
    key: 'prospective',
    title: 'Prospectif 2100',
    subtitle: 'Et si on projetait ces espèces dans un climat +3°C ?',
    hotkey: '3',
    Icon: Rocket,
    gradient: 'from-fuchsia-500/30 via-cyan-500/20 to-transparent',
    ring: 'ring-fuchsia-300/50',
  },
];

const DiscoverModeSelector: React.FC<Props> = ({ count, filtersLabel, onPick }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black overflow-hidden">
      {/* Ambient halos */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 sm:mb-14"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Découvrir</p>
        <h2 className="text-3xl sm:text-5xl font-light tracking-tight">
          {count} <span className="text-white/50">espèce{count > 1 ? 's' : ''} à explorer</span>
        </h2>
        {filtersLabel && (
          <p className="mt-3 text-sm text-white/50">{filtersLabel}</p>
        )}
        <p className="mt-6 text-sm text-white/40">Choisissez un mode — ou tapez 1, 2, 3.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl">
        {CARDS.map((c, i) => (
          <motion.button
            key={c.key}
            type="button"
            onClick={() => onPick(c.key)}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 text-left ring-1 ${c.ring} hover:ring-2 transition`}
          >
            <div className={`pointer-events-none absolute -top-1/2 -right-1/3 h-[200%] w-[200%] bg-gradient-to-br ${c.gradient} blur-2xl opacity-70 group-hover:opacity-100 transition`} />
            <div className="relative flex items-start justify-between">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur">
                <c.Icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 rounded-md px-1.5 py-0.5">
                {c.hotkey}
              </span>
            </div>
            <h3 className="relative mt-5 text-2xl font-medium tracking-tight">{c.title}</h3>
            <p className="relative mt-2 text-sm text-white/60 leading-relaxed min-h-[3rem]">{c.subtitle}</p>
            <span className="relative mt-6 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition">
              Entrer →
            </span>
          </motion.button>
        ))}
      </div>

      <p className="mt-10 text-xs text-white/30">Esc pour fermer · H pour revenir ici</p>
    </div>
  );
};

export default DiscoverModeSelector;
