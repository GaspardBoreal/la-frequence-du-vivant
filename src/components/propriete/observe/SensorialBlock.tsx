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
          <div className="mt-2 flex items-center gap-1">
            <div className="h-[2px] w-14 bg-[hsl(var(--ds-forest))] rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ds-forest))]" />
          </div>
        </div>
      </header>

      <div className="mx-5 md:mx-6 mb-4 aspect-[16/6] rounded-2xl overflow-hidden bg-[hsl(var(--ds-cream))]/70 border border-[hsl(var(--ds-line))]/70">
        <img
          src={SENSORIAL_HERO}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      <p className="mx-5 md:mx-6 mb-4 text-[13px] italic text-[hsl(var(--ds-forest))]/85 leading-relaxed">
        « Un jardin ne se résume pas à des données techniques. Sons, odeurs, textures, vues
        et ambiances ressenties orientent un projet plus juste et plus vivant. »
      </p>

      <div className="p-5 md:p-6 pt-0 space-y-3">
        {SENSORIAL_FIELDS.map((f) => (
          <div
            key={f.key}
            className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 focus-within:border-[hsl(var(--ds-forest))]/60 transition-colors"
          >
            <label className="flex items-start gap-3 p-3">
              <span className="text-xl leading-none mt-0.5" aria-hidden>
                {f.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/80">
                  {f.label}
                </div>
                <textarea
                  rows={2}
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1 w-full bg-transparent border-none resize-none outline-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
                />
              </div>
            </label>
          </div>
        ))}

        {/* Intensity slider */}
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-4">
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
