import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, CloudRain, Thermometer, Droplets, ShieldAlert } from 'lucide-react';
import { RISK_TONE, type RiskReading } from '@/lib/gardenRisk';

/**
 * Le baromètre du jour : une aiguille vivante qui dit, en un coup d'œil,
 * si le climat des trente derniers jours pousse le jardin vers la maladie.
 */
export const RiskBarometer: React.FC<{
  risk: RiskReading;
  weather?: { tempMean?: number; precipSum?: number; humidityMean?: number } | null;
}> = ({ risk, weather }) => {
  const reduce = useReducedMotion();
  const tone = RISK_TONE[risk.level];
  const angle = -90 + (risk.score / 100) * 180;

  return (
    <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]">
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative w-[176px] shrink-0">
          <svg viewBox="0 0 200 116" className="w-full">
            <defs>
              <linearGradient id="baro-arc" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--ds-forest))" />
                <stop offset="50%" stopColor="hsl(var(--ds-gold))" />
                <stop offset="100%" stopColor="hsl(4 68% 48%)" />
              </linearGradient>
            </defs>
            <path
              d="M14 104 A86 86 0 0 1 186 104"
              fill="none"
              stroke="url(#baro-arc)"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={0.85}
            />
            <motion.g
              initial={reduce ? false : { rotate: -90 }}
              animate={{ rotate: angle }}
              transition={{ type: 'spring', stiffness: 60, damping: 14 }}
              style={{ originX: '100px', originY: '104px' }}
            >
              <line x1="100" y1="104" x2="100" y2="34" stroke={tone} strokeWidth="4" strokeLinecap="round" />
            </motion.g>
            <circle cx="100" cy="104" r="7" fill={tone} />
          </svg>
          <div className="text-center -mt-1">
            <div className="font-serif text-3xl text-[hsl(var(--ds-forest-deep))]">{risk.score}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]/70">
              Pression / 100
            </div>
          </div>
        </div>

        <div className="min-w-[220px] flex-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
            <Activity className="h-3.5 w-3.5" /> Baromètre du jour
          </div>
          <h3 className="mt-1 font-serif italic text-2xl" style={{ color: tone }}>
            {risk.label}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[hsl(var(--ds-forest))]/80">
            <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
              <Thermometer className="h-3 w-3" />
              {weather?.tempMean != null ? `${weather.tempMean.toFixed(1)} °C moyens` : 'Température —'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
              <CloudRain className="h-3 w-3" />
              {weather?.precipSum != null ? `${weather.precipSum.toFixed(0)} mm / 30 j` : 'Pluie —'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
              <Droplets className="h-3 w-3" />
              {weather?.humidityMean != null ? `${weather.humidityMean.toFixed(0)} % d'humidité` : 'Humidité —'}
            </span>
          </div>

          <ul className="mt-3 space-y-1 text-sm leading-relaxed text-[hsl(var(--ds-forest))]/85">
            {risk.reasons.slice(0, 3).map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--ds-gold))]" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {risk.watchlist.length > 0 && (
        <div className="mt-4 border-t border-[hsl(var(--ds-line))] pt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]/80">
            <ShieldAlert className="h-3 w-3" /> Fenêtres de vigilance ouvertes ce mois-ci
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {risk.watchlist.slice(0, 8).map((p) => (
              <span
                key={p.id}
                title={p.signs ?? undefined}
                className="rounded-full border border-[hsl(var(--ds-gold))]/50 bg-white/60 px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))]"
              >
                {p.common_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskBarometer;
