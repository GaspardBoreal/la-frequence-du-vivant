import React from 'react';
import { motion } from 'framer-motion';
import type { SentinelleBreakdown } from '@/lib/sentinelleIndex';

interface Row {
  icon: string;
  label: string;
  value: number;
  max: number;
  detail: string;
  color: string;
}

interface Props {
  breakdown: SentinelleBreakdown;
  total: number;
}

const ScoreBreakdown: React.FC<Props> = ({ breakdown, total }) => {
  const rows: Row[] = [
    {
      icon: '🌿',
      label: 'Détections précieuses',
      value: breakdown.sensible.value,
      max: breakdown.sensible.max,
      detail: `${breakdown.sensible.bio} bio · ${breakdown.sensible.aux} aux · ${breakdown.sensible.eee} EEE`,
      color: 'hsl(150 70% 55%)',
    },
    {
      icon: '🎙',
      label: 'Voix singulière',
      value: breakdown.voix.value,
      max: breakdown.voix.max,
      detail: `${breakdown.voix.textes} texte${breakdown.voix.textes > 1 ? 's' : ''} · ${breakdown.voix.sons} son${breakdown.voix.sons > 1 ? 's' : ''} · ${breakdown.voix.temoignage} témoignage`,
      color: 'hsl(280 60% 65%)',
    },
    {
      icon: '🪶',
      label: 'Variété des gestes',
      value: breakdown.pillars.value,
      max: breakdown.pillars.max,
      detail: `${breakdown.pillars.count} pilier${breakdown.pillars.count > 1 ? 's' : ''} sur ${breakdown.pillars.of}`,
      color: 'hsl(170 60% 60%)',
    },
    {
      icon: '📸',
      label: 'Volume',
      value: breakdown.volume.value,
      max: breakdown.volume.max,
      detail: `${breakdown.volume.raw} contribution${breakdown.volume.raw > 1 ? 's' : ''}`,
      color: 'hsl(190 60% 60%)',
    },
    {
      icon: '🦋',
      label: 'Diversité d\'espèces',
      value: breakdown.species.value,
      max: breakdown.species.max,
      detail: `${breakdown.species.count} espèce${breakdown.species.count > 1 ? 's' : ''}`,
      color: 'hsl(210 60% 65%)',
    },
    {
      icon: '🌾',
      label: 'Pratiques emblématiques',
      value: breakdown.pratiques.value,
      max: breakdown.pratiques.max,
      detail: breakdown.pratiques.count > 0
        ? `${breakdown.pratiques.count} pratique${breakdown.pratiques.count > 1 ? 's' : ''} portée${breakdown.pratiques.count > 1 ? 's' : ''}`
        : 'À relier par un curateur',
      color: 'hsl(40 75% 60%)',
    },
  ];

  return (
    <div className="w-full max-w-[320px] space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Votre Fréquence, expliquée</div>
      {rows.map((r, i) => {
        const pct = (r.value / r.max) * 100;
        return (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm leading-none">{r.icon}</span>
                <span className="text-[11px] font-medium text-white/90 truncate">{r.label}</span>
              </div>
              <div className="text-[11px] tabular-nums text-white/80 font-semibold flex-shrink-0">
                {r.value}<span className="text-white/40"> / {r.max}</span>
              </div>
            </div>
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: r.color, boxShadow: `0 0 8px ${r.color}80` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
              />
            </div>
            <div className="text-[10px] text-white/45 mt-1">{r.detail}</div>
          </motion.div>
        );
      })}
      <div className="flex items-center justify-between pt-1.5 px-1 border-t border-white/10 mt-2">
        <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">Total</span>
        <span className="text-base font-bold tabular-nums text-emerald-200">{total}<span className="text-xs text-white/40"> / 100</span></span>
      </div>
    </div>
  );
};

export default ScoreBreakdown;
