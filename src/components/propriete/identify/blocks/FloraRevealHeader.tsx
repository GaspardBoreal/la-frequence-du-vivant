import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Users, AlertCircle } from 'lucide-react';
import type { FloraMatchStats } from '@/lib/plantIndicatorMatcher';

const freshnessMeta: Record<
  FloraMatchStats['freshness'],
  { dot: string; label: string; ring: string }
> = {
  fresh: { dot: 'bg-emerald-500', label: 'Données fraîches (< 3 mois)', ring: 'ring-emerald-500/30' },
  aging: { dot: 'bg-amber-500', label: 'À rafraîchir (< 12 mois)', ring: 'ring-amber-500/30' },
  stale: { dot: 'bg-neutral-400', label: 'Données anciennes', ring: 'ring-neutral-400/30' },
};

export const FloraRevealHeader: React.FC<{
  stats: FloraMatchStats;
  hasWalkerData: boolean;
}> = ({ stats, hasWalkerData }) => {
  if (!hasWalkerData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/40 p-4 mb-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-[hsl(var(--ds-forest))]/60 shrink-0 mt-0.5" />
        <div className="text-[12px] text-[hsl(var(--ds-forest-deep))]/80 leading-relaxed">
          <div className="font-semibold text-[hsl(var(--ds-forest-deep))] mb-0.5">
            Aucune donnée marcheurs encore
          </div>
          Organisez une <span className="font-semibold">Marche du Vivant</span> pour révéler
          automatiquement le cortège floristique observé sur votre lieu.
        </div>
      </motion.div>
    );
  }

  const f = freshnessMeta[stats.freshness];
  const lastDate = stats.lastObservationDate
    ? new Date(stats.lastObservationDate).toLocaleDateString('fr-FR')
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--ds-forest))]/20 bg-gradient-to-br from-[hsl(var(--ds-forest))]/8 to-[hsl(var(--ds-cream))]/50 p-4 mb-4 ring-1 ${f.ring}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]">
          Ce que la Fréquence a déjà révélé
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          value={`${stats.revealed}`}
          suffix={` / ${stats.totalPlants}`}
          label="Bio-indicatrices confirmées"
          tone="strong"
        />
        <Stat value={`${stats.weak}`} label="Signaux faibles" tone="soft" />
        <Stat value={`${stats.totalObservations}`} label="Observations cumulées" icon={<Users className="w-3.5 h-3.5" />} />
        <Stat value={lastDate} label="Dernière observation" icon={<Clock className="w-3.5 h-3.5" />} tiny />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/75">
        <span className={`w-2 h-2 rounded-full ${f.dot} animate-pulse`} />
        <span>{f.label}</span>
      </div>
    </motion.div>
  );
};

const Stat: React.FC<{
  value: string;
  suffix?: string;
  label: string;
  icon?: React.ReactNode;
  tone?: 'strong' | 'soft';
  tiny?: boolean;
}> = ({ value, suffix, label, icon, tone, tiny }) => (
  <div className="rounded-xl bg-white/50 border border-[hsl(var(--ds-line))]/60 px-3 py-2">
    <div
      className={`flex items-baseline gap-1 ${
        tone === 'strong'
          ? 'text-[hsl(var(--ds-forest-deep))]'
          : tone === 'soft'
          ? 'text-amber-700'
          : 'text-[hsl(var(--ds-forest-deep))]'
      }`}
    >
      {icon}
      <span className={`font-bold ${tiny ? 'text-sm' : 'text-xl'} leading-none`}>{value}</span>
      {suffix && <span className="text-[11px] opacity-60">{suffix}</span>}
    </div>
    <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest-deep))]/60 mt-1">
      {label}
    </div>
  </div>
);
