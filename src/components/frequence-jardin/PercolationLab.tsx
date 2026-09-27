import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { FjSourceLink } from './FjSourceLink';

const VERDICTS = [
  { id: 'mal', test: (v: number) => v < 1.25, plage: 'moins de 1,25 cm/h', texte: 'Sol mal drainé : butte ou rocaille surélevée' },
  { id: 'ideal', test: (v: number) => v >= 2.5 && v <= 5, plage: '2,5 à 5 cm/h', texte: 'Idéal pour un potager' },
  { id: 'ciste', test: (v: number) => v >= 30, plage: '30 cm/h et plus', texte: 'Seuil ciste : drainage exemplaire pour les plantes de jardin sec' },
];

const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/** « Percolation : un test, deux lectures » — curseur de vitesse, trou qui se vide, verdicts sourcés. */
const PercolationLab: React.FC = () => {
  const reduce = useReducedMotion();
  const [v, setV] = useState(3);
  const actif = VERDICTS.find((x) => x.test(v));
  // Durée d'un cycle de vidange inversement proportionnelle à la vitesse.
  const cycle = v > 0 ? Math.min(20, Math.max(0.8, 40 / v)) : 0;

  return (
    <div className="grid items-center gap-8 md:grid-cols-[240px_1fr]">
      <svg viewBox="0 0 240 220" className="mx-auto h-auto w-full max-w-[240px]" role="img" aria-label={`Trou de plantation, l’eau baisse de ${fmt(v)} cm par heure`}>
        <rect x="0" y="30" width="240" height="190" fill="hsl(28 30% 34%)" />
        <rect x="0" y="22" width="240" height="10" fill="hsl(var(--ds-forest-soft))" />
        <defs>
          <clipPath id="pl-trou">
            <path d="M70 30 L170 30 L160 200 Q120 212 80 200 Z" />
          </clipPath>
        </defs>
        <path d="M70 30 L170 30 L160 200 Q120 212 80 200 Z" fill="hsl(26 26% 20%)" />
        <g clipPath="url(#pl-trou)">
          <motion.rect
            key={`${cycle}-${reduce}`}
            x="60"
            width="120"
            y="40"
            height="175"
            fill="hsl(var(--ds-eco-eau))"
            opacity="0.85"
            style={{ originY: 1, transformBox: 'fill-box' }}
            initial={{ scaleY: 1 }}
            animate={reduce || cycle === 0 ? { scaleY: cycle === 0 ? 1 : 0.5 } : { scaleY: [1, 0.04, 1] }}
            transition={reduce || cycle === 0 ? { duration: 0 } : { duration: cycle, times: [0, 0.92, 1], repeat: Infinity, ease: 'linear' }}
          />
        </g>
      </svg>

      <div>
        <label id="perco-label" className="text-[14px] font-medium text-[hsl(var(--ds-ink))]">
          Vitesse de baisse de l’eau : <span className="font-serif text-[22px] text-[hsl(var(--ds-forest))]">{fmt(v)} cm/h</span>
        </label>
        <Slider
          className="mt-4"
          min={0}
          max={40}
          step={0.25}
          value={[v]}
          onValueChange={([n]) => setV(n)}
          aria-labelledby="perco-label"
        />
        <ul className="mt-6 space-y-2" aria-live="polite">
          {VERDICTS.map((x) => {
            const on = actif?.id === x.id;
            return (
              <li
                key={x.id}
                className={`rounded-xl border px-4 py-2.5 text-[14px] transition ${
                  on
                    ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                    : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-ink-soft))]'
                }`}
              >
                <span className="text-[12px] opacity-80">{x.plage} · </span>
                {x.texte}
              </li>
            );
          })}
          {!actif && (
            <li className="rounded-xl border border-dashed border-[hsl(var(--ds-line))] px-4 py-2.5 text-[14px] text-[hsl(var(--ds-ink))]">
              Zone intermédiaire
            </li>
          )}
        </ul>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[hsl(var(--ds-ink-soft))]">
          <FjSourceLink href="https://northerngardener.org/how-to-do-a-soil-percolation-test/">Repères potager</FjSourceLink>
          <FjSourceLink href="https://www.senteursduquercy.com/content/81-cistus-guide-de-culture-taille-et-avantages-des-cistes-en-jardin-sec#plantation-entretien-ciste">
            Seuil ciste
          </FjSourceLink>
        </p>
      </div>
    </div>
  );
};

export default PercolationLab;

/** Séparateur : une onde fine, rappel de l’écoute du sol. */
export const LigneEcoute: React.FC = () => {
  const reduce = useReducedMotion();
  const wave = 'M0 20 Q 25 5 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20 T 400 20 T 450 20 T 500 20 T 550 20 T 600 20 T 650 20 T 700 20 T 750 20 T 800 20';
  return (
    <figure className="my-14" aria-label="Un sol se lit avec les mains, les yeux… et les oreilles.">
      <div className="overflow-hidden">
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
          <motion.path
            d={wave}
            fill="none"
            stroke="hsl(var(--ds-forest-soft))"
            strokeWidth="1.5"
            animate={reduce ? undefined : { x: [0, -100] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      </div>
      <figcaption className="mt-2 text-center font-serif text-[15px] italic text-[hsl(var(--ds-earth))]">
        Un sol se lit avec les mains, les yeux… et les oreilles.
      </figcaption>
    </figure>
  );
};
