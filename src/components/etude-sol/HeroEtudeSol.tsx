import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Mail, Sprout } from 'lucide-react';
import { CountUp } from './CountUp';

interface HeroStat {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
}

export const HeroEtudeSol: React.FC<{
  stats: HeroStat[];
  contactHref: string;
  onDiscover: () => void;
}> = ({ stats, contactHref, onDiscover }) => (
  <header className="relative overflow-hidden bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
    {/* Strates de sol en fond */}
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]">
      <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="sky-etude" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--ds-forest))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--ds-forest-deep))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1200" height="600" fill="url(#sky-etude)" />
        {[0, 1, 2, 3].map((i) => (
          <motion.path
            key={i}
            d={`M0 ${380 + i * 55} q300 ${i % 2 === 0 ? -34 : 30} 600 0 t600 0 V600 H0 Z`}
            fill="hsl(var(--ds-cream))"
            fillOpacity={0.035 + i * 0.022}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.15 * i, ease: 'easeOut' }}
          />
        ))}
      </svg>
    </div>

    <div className="relative mx-auto max-w-5xl px-5 py-20 text-center sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/25 bg-[hsl(var(--ds-cream))]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em]"
      >
        <Sprout className="h-3.5 w-3.5" /> Fréquence Jardin
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mx-auto mt-6 max-w-3xl font-serif text-4xl leading-[1.08] sm:text-6xl"
      >
        L’étude de sol vivante
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mx-auto mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[hsl(var(--ds-cream))]/85 sm:text-lg"
      >
        Douze méthodes de terrain, reproductibles et sans laboratoire, pour savoir ce que votre sol
        peut porter — avant de planter, avant de dessiner, avant de dépenser.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          onClick={onDiscover}
          className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-cream))] px-6 py-3 text-sm font-bold text-[hsl(var(--ds-forest-deep))] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          Découvrir la méthode <ArrowDown className="h-4 w-4" />
        </button>
        <a
          href={contactHref}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/45 px-6 py-3 text-sm font-bold text-[hsl(var(--ds-cream))] transition hover:bg-[hsl(var(--ds-cream))]/12"
        >
          <Mail className="h-4 w-4" /> Nous contacter
        </a>
      </motion.div>

      <motion.dl
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[hsl(var(--ds-cream))]/18 bg-[hsl(var(--ds-cream))]/[0.07] px-3 py-4 backdrop-blur-sm"
          >
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <span className="font-serif text-3xl sm:text-4xl">
                <CountUp value={s.value} decimals={s.decimals ?? 0} />
                {s.suffix}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--ds-cream))]/65">
                {s.label}
              </span>
            </dd>
          </div>
        ))}
      </motion.dl>
    </div>
  </header>
);

export default HeroEtudeSol;
