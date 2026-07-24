import React from 'react';
import { motion } from 'framer-motion';
import { SENSORIAL_FIELDS, SENSORIAL_HERO } from './observeConfig';

export const SensorialBlock: React.FC<{
  values: Record<string, any>;
  onChange: (key: string, value: string | number) => void;
}> = ({ values, onChange }) => {
  const intensity = typeof values.intensity === 'number' ? values.intensity : 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]"
    >
      {/* Header — identique aux cartes 1-7 */}
      <header className="flex items-start gap-4 p-5 md:p-6 pb-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif text-xl shadow-md ring-2 ring-[hsl(var(--ds-gold))]/30">
          8
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Analyse sensorielle du site
          </div>
          <h3 className="mt-1 font-serif italic text-xl md:text-2xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            Ce que le lieu murmure
          </h3>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-2 flex items-center gap-1 origin-left"
          >
            <div className="h-[2px] w-14 bg-[hsl(var(--ds-forest))] rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ds-forest))]" />
          </motion.div>
        </div>
      </header>

      {/* Illustration — ratio 16/7 comme les autres cartes */}
      <div className="mx-5 md:mx-6 mb-4 aspect-[16/7] rounded-2xl overflow-hidden bg-[hsl(var(--ds-cream))]/70 border border-[hsl(var(--ds-line))]/70">
        <img
          src={SENSORIAL_HERO}
          alt=""
          loading="lazy"
          width={768}
          height={336}
          className="w-full h-full object-cover transition-transform duration-[6000ms] hover:scale-105"
        />
      </div>

      {/* Grille tuilée — même rythme que ChoicePicto */}
      <div
        role="group"
        aria-label="Analyse sensorielle du site"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-5 md:p-6 pt-2"
      >
        {SENSORIAL_FIELDS.map((f) => (
          <div
            key={f.key}
            className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 flex flex-col gap-1.5 focus-within:border-[hsl(var(--ds-forest))]/60 hover:border-[hsl(var(--ds-forest))]/40 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none" aria-hidden>
                {f.icon}
              </span>
              <label
                htmlFor={`sensorial-${f.key}`}
                className="text-[10px] font-bold tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/80"
              >
                {f.label}
              </label>
            </div>
            <textarea
              id={`sensorial-${f.key}`}
              rows={3}
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="flex-1 w-full bg-transparent border-none resize-none outline-none text-xs text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40 min-h-[60px]"
            />
          </div>
        ))}

        {/* Slider d'intensité — pleine largeur dans la même grille */}
        <div className="col-span-2 sm:col-span-3 md:col-span-4 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-4">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/80">
            <span>Ambiance ressentie</span>
            <span className="text-[hsl(var(--ds-forest-deep))]">{intensity}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => onChange('intensity', parseInt(e.target.value, 10))}
            className="mt-3 w-full accent-[hsl(var(--ds-forest))]"
          />
          <div className="mt-1 flex justify-between text-[10px] italic text-[hsl(var(--ds-forest))]/70">
            <span>calme silencieux</span>
            <span>vivant foisonnant</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
