import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Worm, Layers, Flower2, AlertTriangle } from 'lucide-react';
import { ENJEUX, SANS_DIAGNOSTIC } from '@/content/etudeDeSolMethodes';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  eau: Droplets,
  vie: Worm,
  structure: Layers,
  palette: Flower2,
};

export const EnjeuxSection: React.FC = () => (
  <section id="enjeux" className="scroll-mt-16 bg-[hsl(var(--ds-cream))] py-16 sm:py-24">
    <div className="mx-auto max-w-6xl px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]/70">
        01 — Les enjeux
      </p>
      <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-[hsl(var(--ds-forest-deep))] sm:text-4xl">
        Tout ce qui pousse au-dessus se joue en dessous
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
        Le sol n’est pas un support inerte : c’est un organisme qui filtre l’eau, nourrit les
        plantes et porte les racines. Quatre questions suffisent à en prendre la mesure.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENJEUX.map((e, i) => {
          const Icon = ICONS[e.id] ?? Layers;
          return (
            <motion.article
              key={e.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--ds-forest))]/18 bg-white/70 p-6 shadow-[0_2px_20px_hsl(var(--ds-forest-deep)/0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_40px_hsl(var(--ds-forest-deep)/0.14)]"
            >
              <span
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[hsl(var(--ds-forest))]/8 transition group-hover:scale-125"
              />
              <Icon className="relative h-7 w-7 text-[hsl(var(--ds-forest))]" />
              <h3 className="relative mt-4 font-serif text-xl text-[hsl(var(--ds-forest-deep))]">
                {e.title}
              </h3>
              <p className="relative mt-1 text-[12.5px] font-semibold uppercase tracking-wide text-[hsl(var(--ds-gold))]">
                {e.claim}
              </p>
              <p className="relative mt-3 text-[14px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
                {e.text}
              </p>
            </motion.article>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="mt-10 rounded-3xl border border-[hsl(var(--ds-gold))]/35 bg-[hsl(var(--ds-gold))]/10 p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-[hsl(var(--ds-forest-deep))]">
          <AlertTriangle className="h-4.5 w-4.5" />
          <h3 className="font-serif text-xl">Sans diagnostic, ce que l’on répète</h3>
        </div>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {SANS_DIAGNOSTIC.map((s) => (
            <li
              key={s}
              className="flex items-start gap-2 text-[14px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--ds-gold))]" />
              {s}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  </section>
);

export default EnjeuxSection;
