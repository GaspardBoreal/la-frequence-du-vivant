import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  HeartPulse, CloudRain, Thermometer, Droplets, ShieldAlert, ChevronDown,
  Eye, Stethoscope, Sprout, Ban, Camera, Repeat, ListChecks,
} from 'lucide-react';
import { RISK_TONE, type RiskReading } from '@/lib/gardenRisk';
import { HEALTH_TONE, type GardenHealth } from '@/lib/gardenHealth';
import type { ConsultationStatus } from '@/hooks/propriete/useGardenClinique';
import { cn } from '@/lib/utils';

type WeatherLite = { tempMean?: number; precipSum?: number; humidityMean?: number } | null;

const COUNTERS: Array<{
  key: ConsultationStatus;
  label: string;
  icon: React.ElementType;
  field: keyof GardenHealth;
}> = [
  { key: 'observation', label: 'Sous surveillance', icon: Eye, field: 'observation' },
  { key: 'traitement', label: 'En traitement', icon: Stethoscope, field: 'traitement' },
  { key: 'gueri', label: 'Rétablis', icon: Sprout, field: 'gueri' },
  { key: 'perdu', label: 'Sujets perdus', icon: Ban, field: 'perdu' },
];

/** L'anneau du pouls : ce que disent réellement les fiches saisies. */
const PulseRing: React.FC<{ health: GardenHealth }> = ({ health }) => {
  const reduce = useReducedMotion();
  const tone = HEALTH_TONE[health.tone];
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-[120px] w-[120px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--ds-line))" strokeWidth="9" />
        <motion.circle
          cx="50" cy="50" r={R} fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={C}
          initial={reduce ? false : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (health.pulse / 100) * C }}
          transition={{ type: 'spring', stiffness: 50, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-3xl leading-none text-[hsl(var(--ds-forest-deep))]">
          {health.pulse}
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[hsl(var(--ds-forest))]/70">
          Pouls
        </div>
      </div>
    </div>
  );
};

export const HealthBanner: React.FC<{
  health: GardenHealth;
  risk: RiskReading;
  weather?: WeatherLite;
  statusFilter: ConsultationStatus | null;
  onStatusFilter: (s: ConsultationStatus | null) => void;
}> = ({ health, risk, weather, statusFilter, onStatusFilter }) => {
  const [climateOpen, setClimateOpen] = React.useState(false);
  const tone = HEALTH_TONE[health.tone];
  const hasWeather = weather?.tempMean != null || weather?.precipSum != null || weather?.humidityMean != null;

  // Les fenêtres de vigilance qui recoupent un foyer déjà suspecté sur place.
  const recurringNames = health.recurring.map((r) => r.name.toLowerCase());
  const activeNames = new Set(recurringNames);
  const watch = risk.watchlist.slice().sort((a, b) => {
    const A = activeNames.has(a.common_name.toLowerCase()) ? 0 : 1;
    const B = activeNames.has(b.common_name.toLowerCase()) ? 0 : 1;
    return A - B;
  });

  return (
    <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]">
      {/* 1 · Le pouls du lieu */}
      <div className="flex flex-wrap items-center gap-5">
        <PulseRing health={health} />
        <div className="min-w-[240px] flex-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
            <HeartPulse className="h-3.5 w-3.5" /> L'état sanitaire du jardin
          </div>
          <h3 className="mt-1 font-serif italic text-2xl" style={{ color: tone }}>
            {health.verdict}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/85">
            <span className="rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
              {health.active} sujet{health.active > 1 ? 's' : ''} suivi{health.active > 1 ? 's' : ''}
            </span>
            {health.severityMean != null && (
              <span className="rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
                Étendue moyenne {health.severityMean} / 5
              </span>
            )}
            {health.worst && (
              <span className="rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
                Le plus atteint · {health.worst.label} ({health.worst.severity}/5)
              </span>
            )}
            {health.recoveryRate != null && health.totalEver > 0 && (
              <span className="rounded-full border border-[hsl(var(--ds-line))] px-2 py-1">
                {health.recoveryRate} % rétablis
                {health.healingDays != null ? ` · ${health.healingDays} j en moyenne` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2 · Les compteurs cliniques */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COUNTERS.map((c, i) => {
          const value = health[c.field] as number;
          const on = statusFilter === c.key;
          const Icon = c.icon;
          return (
            <motion.button
              key={c.key}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -2 }}
              onClick={() => onStatusFilter(on ? null : c.key)}
              aria-pressed={on}
              className={cn(
                'rounded-2xl border px-3 py-2.5 text-left transition',
                on
                  ? 'border-[hsl(var(--ds-forest-deep))] bg-white'
                  : 'border-[hsl(var(--ds-line))] bg-white/60 hover:bg-white',
              )}
            >
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/70">
                <Icon className="h-3 w-3" /> {c.label}
              </div>
              <div className="mt-0.5 font-serif text-2xl leading-none text-[hsl(var(--ds-forest-deep))]">
                {value}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 3 · Les signaux d'action */}
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {/* Gestes en attente */}
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/70">
            <ListChecks className="h-3 w-3" /> Gestes de soin
          </div>
          <div className="mt-1 text-[13px] text-[hsl(var(--ds-forest-deep))]">
            {health.actionsTotal === 0
              ? 'Aucun geste proposé pour l’instant'
              : `${health.actionsDone} / ${health.actionsTotal} réalisés`}
          </div>
          {health.actionsTotal > 0 && (
            <>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--ds-line))]">
                <motion.div
                  className="h-full rounded-full bg-[hsl(var(--ds-forest))]"
                  initial={{ width: 0 }}
                  animate={{ width: `${health.actionsRatio ?? 0}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              {health.actionsDone === 0 && (
                <p className="mt-1.5 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/70">
                  Aucun geste engagé depuis l’ouverture.
                </p>
              )}
            </>
          )}
        </div>

        {/* Foyers récurrents */}
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/70">
            <Repeat className="h-3 w-3" /> Foyers récurrents
          </div>
          {health.recurring.length === 0 ? (
            <p className="mt-1 text-[12.5px] text-[hsl(var(--ds-forest-deep))]/80">
              Aucun pathogène ne revient sur plusieurs sujets.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {health.recurring.map((r) => (
                <span
                  key={r.name}
                  className="rounded-full border border-[hsl(4_68%_48%)]/45 bg-[hsl(4_68%_48%)]/10 px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))]"
                >
                  {r.name} · {r.count} sujets
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dernière revisite */}
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/70">
            <Camera className="h-3 w-3" /> Dernière revisite
          </div>
          <div className="mt-1 text-[13px] text-[hsl(var(--ds-forest-deep))]">
            {health.daysSinceLastMedia == null
              ? 'Aucune photo de suivi'
              : health.daysSinceLastMedia === 0
                ? 'Photographié aujourd’hui'
                : `Il y a ${health.daysSinceLastMedia} jour${health.daysSinceLastMedia > 1 ? 's' : ''}`}
          </div>
          {(health.daysSinceLastMedia == null || health.daysSinceLastMedia >= 7) && health.active > 0 && (
            <p className="mt-1.5 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/70">
              Photographier à nouveau pour mesurer l’évolution.
            </p>
          )}
        </div>
      </div>

      {/* Le climat, en second rideau */}
      <div className="mt-4 border-t border-[hsl(var(--ds-line))] pt-3">
        <button
          type="button"
          onClick={() => setClimateOpen((v) => !v)}
          aria-expanded={climateOpen}
          className="flex w-full items-center gap-2 text-left text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest-deep))]/80"
        >
          <ShieldAlert className="h-3 w-3" />
          Le climat pousse-t-il à la maladie ?
          <span className="ml-auto flex items-center gap-2 normal-case tracking-normal text-[11px] font-normal">
            {hasWeather ? (
              <span style={{ color: RISK_TONE[risk.level] }}>{risk.label} · {risk.score}/100</span>
            ) : (
              <span className="italic text-[hsl(var(--ds-forest-deep))]/60">
                Météo locale indisponible
              </span>
            )}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', climateOpen && 'rotate-180')} />
          </span>
        </button>

        {climateOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            {hasWeather ? (
              <>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/85">
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
                <ul className="mt-2 space-y-1 text-[12.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/85">
                  {risk.reasons.slice(0, 3).map((r) => (
                    <li key={r} className="flex gap-2">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--ds-gold))]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-[12.5px] italic leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
                Aucun relevé météo n’est disponible pour ce lieu : la pression climatique n’est pas
                calculée, seules les Observations de terrain font foi.
              </p>
            )}

            {watch.length > 0 && (
              <div className="mt-3">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest-deep))]/70">
                  Fenêtres de vigilance de ce mois-ci
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {watch.slice(0, 10).map((p) => {
                    const onSite = activeNames.has(p.common_name.toLowerCase());
                    return (
                      <span
                        key={p.id}
                        title={p.signs ?? undefined}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))]',
                          onSite
                            ? 'border-[hsl(4_68%_48%)]/50 bg-[hsl(4_68%_48%)]/12 font-medium'
                            : 'border-[hsl(var(--ds-line))] bg-white/60 opacity-70',
                        )}
                      >
                        {p.common_name}
                        {onSite && ' · déjà suspecté ici'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HealthBanner;
