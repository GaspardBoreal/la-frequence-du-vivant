import React from 'react';
import { motion } from 'framer-motion';
import { Globe2, Sparkles, Maximize2, MapPin, Feather } from 'lucide-react';
import type { BiogeographyAggregates } from '@/hooks/useExplorationBiogeography';

interface Props {
  data: BiogeographyAggregates;
  stats: { countries: number; describers: number; enriched: number; total: number };
  eventPoint: { lat: number; lng: number };
  onOpenCountry: (iso: string) => void;
  onOpenDescriber: (name: string) => void;
  onOpenFullscreen: () => void;
}

const OriginsMobileStory: React.FC<Props> = ({
  data, stats, onOpenCountry, onOpenDescriber, onOpenFullscreen,
}) => {
  const topOrigins = data.origins.slice(0, 8);
  const topDescribers = data.describers.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/15 via-rose-500/8 to-emerald-500/8 px-5 py-8"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="relative space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-2xl bg-background/70 backdrop-blur border border-border/60 flex items-center justify-center shadow-lg"
          >
            <Globe2 className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight leading-tight">
              Voyage vers les origines du vivant
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <span className="text-foreground font-semibold">{stats.total}</span> espèces venues de{' '}
              <span className="text-foreground font-semibold">{stats.countries}</span> pays,
              nommées par <span className="text-foreground font-semibold">{stats.describers}</span> naturalistes.
            </p>
          </div>
          {data.coverage < 0.9 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              <Sparkles className="w-3 h-3" /> Enrichissement en cours…
            </div>
          )}
        </div>
      </motion.section>

      {/* Top origins */}
      {topOrigins.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Pays d'origine</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scrollbar-none pb-2">
            {topOrigins.map((o, i) => (
              <motion.button
                key={o.country.code}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenCountry(o.country.code)}
                className="snap-start shrink-0 w-[220px] rounded-2xl border border-border/60 bg-gradient-to-br from-amber-500/8 to-transparent p-4 text-left hover:border-amber-500/40 transition-colors"
              >
                <div className="text-4xl mb-2">{o.country.flag}</div>
                <div className="text-sm font-semibold">{o.country.nameFr}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{o.species.length}</span> espèce{o.species.length > 1 ? 's' : ''}
                </div>
                {/* Mini arrow visual */}
                <svg className="mt-3 w-full h-6 opacity-60" viewBox="0 0 200 24" preserveAspectRatio="none">
                  <path d="M 5 18 Q 100 -8 195 18" stroke="url(#g1)" strokeWidth="2" fill="none" strokeDasharray="3 2" />
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Describers */}
      {topDescribers.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Feather className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold">Descripteurs historiques</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {topDescribers.map((d) => (
              <button
                key={d.name}
                onClick={() => onOpenDescriber(d.name)}
                className="rounded-2xl border border-border/60 bg-gradient-to-br from-rose-500/8 to-transparent p-3 text-left hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-lg mb-1">
                  <span>✒️</span>
                  {d.country && <span className="text-base">{d.country.flag}</span>}
                </div>
                <div className="text-xs font-semibold leading-tight italic">{d.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {d.year && <span>{d.year} · </span>}
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">{d.species.length}</span> esp.
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* CTA fullscreen map */}
      <button
        onClick={onOpenFullscreen}
        className="w-full rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-emerald-500/15 px-5 py-4 flex items-center justify-center gap-2 text-sm font-medium hover:from-amber-500/25 hover:to-emerald-500/25 transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
        Ouvrir la carte du monde
      </button>
    </div>
  );
};

export default OriginsMobileStory;
