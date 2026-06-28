import React from 'react';
import { motion } from 'framer-motion';
import { X, Home, Baby, Sparkles, Rocket } from 'lucide-react';
import type { DiscoverMode } from './DiscoverFullscreen';

interface Props {
  mode: DiscoverMode;
  count: number;
  filtersLabel?: string;
  onModeChange: (m: DiscoverMode) => void;
  onClose: () => void;
}

const TABS: Array<{ key: DiscoverMode; label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { key: 'kids',        label: 'Enfant',    Icon: Baby,     color: 'from-amber-400/30 to-rose-400/30' },
  { key: 'immersive',   label: 'Immersif',  Icon: Sparkles, color: 'from-emerald-400/30 to-cyan-400/30' },
  { key: 'prospective', label: '2100',      Icon: Rocket,   color: 'from-fuchsia-400/30 to-cyan-400/30' },
];

const DiscoverHeader: React.FC<Props> = ({ mode, count, filtersLabel, onModeChange, onClose }) => {
  return (
    <header className="absolute top-0 inset-x-0 h-14 z-20 flex items-center justify-between px-3 sm:px-5 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => onModeChange('hub')}
          aria-label="Retour au hub"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <Home className="h-4 w-4" />
        </button>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-xs uppercase tracking-widest text-white/60">Découverte</span>
          <span className="text-sm font-medium truncate">
            {count} espèces{filtersLabel ? ` · ${filtersLabel}` : ''}
          </span>
        </div>
      </div>

      {mode !== 'hub' && (
        <nav className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          {TABS.map((t) => {
            const active = mode === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onModeChange(t.key)}
                className={`relative px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="discover-tab-indicator"
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${t.color} border border-white/15`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <t.Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le mode Découverte"
        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
};

export default DiscoverHeader;
