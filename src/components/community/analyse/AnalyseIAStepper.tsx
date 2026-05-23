import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Compass, Network, Gauge, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import EcologicalJourneyCarousel from '@/components/biodiversity/EcologicalJourneyCarousel';
import TrophicChainPanel from '@/components/community/synthese/TrophicChainPanel';
import TaxonsIndicesPanel from '@/components/community/synthese/TaxonsIndicesPanel';
import type { BiodiversitySpecies } from '@/types/biodiversity';

interface AnalyseIAStepperProps {
  explorationId?: string;
  species: BiodiversitySpecies[];
  totalSpecies: number;
}

type StepKey = 'decouverte' | 'trophique' | 'indicateurs';

interface StepDef {
  key: StepKey;
  emoji: string;
  short: string;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  ring: string;
  glow: string;
}

const STEPS: StepDef[] = [
  {
    key: 'decouverte',
    emoji: '🌿',
    short: 'Découverte',
    title: 'Partons à la découverte du vivant',
    subtitle: 'Des parcours sensibles révèlent les liens cachés entre les espèces de ce territoire.',
    Icon: Compass,
    gradient: 'from-emerald-500/15 via-amber-500/8 to-transparent',
    ring: 'ring-emerald-500/30',
    glow: 'bg-emerald-500/20',
  },
  {
    key: 'trophique',
    emoji: '🔗',
    short: 'Trophique',
    title: 'La chaîne du vivant',
    subtitle: 'Producteurs, consommateurs, prédateurs, décomposeurs — l’architecture d’un écosystème.',
    Icon: Network,
    gradient: 'from-violet-500/15 via-cyan-500/8 to-transparent',
    ring: 'ring-violet-500/30',
    glow: 'bg-violet-500/20',
  },
  {
    key: 'indicateurs',
    emoji: '📊',
    short: 'Indicateurs',
    title: 'Lecture écologique du peuplement',
    subtitle: 'Indices, équilibres et signatures qui racontent la santé du milieu.',
    Icon: Gauge,
    gradient: 'from-sky-500/15 via-emerald-500/8 to-transparent',
    ring: 'ring-sky-500/30',
    glow: 'bg-sky-500/20',
  },
];

const AnalyseIAStepper: React.FC<AnalyseIAStepperProps> = ({ explorationId, species, totalSpecies }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<StepKey, HTMLElement | null>>({
    decouverte: null,
    trophique: null,
    indicateurs: null,
  });
  const [activeIdx, setActiveIdx] = useState(0);

  const goTo = useCallback((idx: number) => {
    const step = STEPS[idx];
    if (!step) return;
    const el = stepRefs.current[step.key];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  // Detect active step via IntersectionObserver
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        entries.forEach((e) => {
          const idx = STEPS.findIndex((s) => s.key === (e.target as HTMLElement).dataset.step);
          if (idx < 0) return;
          if (!best || e.intersectionRatio > best.ratio) best = { idx, ratio: e.intersectionRatio };
        });
        if (best && best.ratio > 0.5) setActiveIdx(best.idx);
      },
      { root, threshold: [0.25, 0.5, 0.75] }
    );
    STEPS.forEach((s) => {
      const el = stepRefs.current[s.key];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(Math.min(activeIdx + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') goTo(Math.max(activeIdx - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, goTo]);

  const progressPct = useMemo(() => ((activeIdx + 1) / STEPS.length) * 100, [activeIdx]);

  return (
    <div className="relative -mx-4 sm:mx-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 sm:px-0 py-3 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div role="tablist" className="flex gap-1.5 p-1 bg-muted/60 rounded-full overflow-x-auto scrollbar-none">
            {STEPS.map((s, i) => {
              const active = i === activeIdx;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => goTo(i)}
                  className={`relative shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="stepper-pill-bg"
                      className="absolute inset-0 bg-background shadow-sm rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <span aria-hidden>{s.emoji}</span>
                    <span>{s.short}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            Module <span className="text-foreground font-semibold">{activeIdx + 1}</span> / {STEPS.length}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-sky-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          />
        </div>
      </div>

      {/* Horizontal snap scroller */}
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {STEPS.map((s, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <section
              key={s.key}
              ref={(el) => (stepRefs.current[s.key] = el)}
              data-step={s.key}
              role="tabpanel"
              aria-label={s.title}
              className="snap-start shrink-0 w-full px-4 sm:px-2 pt-6 pb-10"
            >
              <StepHero step={s} />
              <div className="mt-6">
                {s.key === 'decouverte' && <EcologicalJourneyCarousel explorationId={explorationId} />}
                {s.key === 'trophique' && (
                  <TrophicChainPanel species={species as any} explorationId={explorationId} />
                )}
                {s.key === 'indicateurs' && (
                  <TaxonsIndicesPanel
                    species={species as any}
                    explorationId={explorationId}
                    totalSpeciesAllRanks={totalSpecies}
                  />
                )}
              </div>

              {!isLast && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => goTo(i + 1)}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>{STEPS[i + 1].short} — module suivant</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Side arrows (desktop) */}
      <div className="hidden sm:block">
        {activeIdx > 0 && (
          <button
            onClick={() => goTo(activeIdx - 1)}
            aria-label="Module précédent"
            className="fixed left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {activeIdx < STEPS.length - 1 && (
          <button
            onClick={() => goTo(activeIdx + 1)}
            aria-label="Module suivant"
            className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const StepHero: React.FC<{ step: StepDef }> = ({ step }) => {
  const { Icon, title, subtitle, gradient, ring, glow, short } = step;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br ${gradient} px-5 py-8 sm:px-8 sm:py-10`}
    >
      {/* Background blob */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${glow} blur-3xl pointer-events-none`} aria-hidden />
      <div className={`absolute -bottom-24 -left-16 w-56 h-56 rounded-full ${glow} blur-3xl opacity-60 pointer-events-none`} aria-hidden />

      <div className="relative flex flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur ring-1 ${ring} text-[10px] font-semibold uppercase tracking-wider text-foreground/80`}>
            <span>{step.emoji}</span> {short}
          </span>
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-background/70 backdrop-blur border border-border/60 flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" />
        </motion.div>

        <div className="space-y-2 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyseIAStepper;
