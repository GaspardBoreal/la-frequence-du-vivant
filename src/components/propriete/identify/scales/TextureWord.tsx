import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TEXTURE_PART_LABEL, type TextureReading, type TextureKey } from '@/lib/soilFloraScales';

const PART_TOKEN: Record<TextureKey, string> = {
  argile: '--ds-eco-texture',
  limon: '--ds-eco-eau',
  sable: '--ds-gold',
};

/** La texture énoncée en un mot, appuyée par trois jauges de fréquence. */
export const TextureWord: React.FC<{ reading: TextureReading; print?: boolean }> = ({
  reading,
  print = false,
}) => {
  const reduce = useReducedMotion();
  const animate = !print && !reduce;

  return (
    <div className="soil-flora-scale-row py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: 'hsl(var(--ds-eco-texture))' }}
        >
          Texture
        </span>
        <span className="text-[12.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
          {reading.word ? `« ${reading.word} »` : 'Pas encore relevée'}
        </span>
      </div>

      {reading.samples > 0 ? (
        <>
          <div className="mt-2 space-y-1.5">
            {reading.shares.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2.5">
                <span className="w-[74px] shrink-0 text-right text-[10.5px] text-[hsl(var(--ds-forest-deep))]/60">
                  {TEXTURE_PART_LABEL[s.key]}
                </span>
                <div className="h-[9px] flex-1 min-w-0 overflow-hidden rounded-full bg-[hsl(var(--ds-line))]/50">
                  <motion.div
                    initial={animate ? { width: 0 } : false}
                    animate={animate ? { width: `${s.pct}%` } : undefined}
                    style={{
                      width: animate ? undefined : `${s.pct}%`,
                      background: `hsl(var(${PART_TOKEN[s.key]}) / 0.8)`,
                    }}
                    transition={{ duration: 0.6, delay: 0.1 * i, ease: 'easeOut' }}
                    className="h-full rounded-full"
                  />
                </div>
                <span className="w-[38px] shrink-0 text-[10.5px] tabular-nums text-[hsl(var(--ds-forest-deep))]/70">
                  {s.pct} %
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
            D’après vos {reading.samples} prélèvement{reading.samples > 1 ? 's' : ''} — une fréquence
            d’observation, pas une granulométrie mesurée.
          </p>
        </>
      ) : (
        <p className="mt-2 text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
          Renseignez le test de texture d’au moins un prélèvement à l’Étape 2 pour révéler ce mot.
        </p>
      )}
    </div>
  );
};
