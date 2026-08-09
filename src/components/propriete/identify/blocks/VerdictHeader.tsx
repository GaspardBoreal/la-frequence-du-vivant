import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildScaleReadings,
  buildTextureReading,
  narrateScales,
  GAP_LABEL,
  GAP_TOKEN,
  type TextureKey,
} from '@/lib/soilFloraScales';
import type { ConcordanceDetail } from '@/lib/plantIndicatorKb';

export interface VerdictHeaderProps {
  detail: ConcordanceDetail;
  hasFlora: boolean;
  soilAvailable: boolean;
  textureCounts: Record<TextureKey, number>;
  loading?: boolean;
  error?: string | null;
}

interface WordCard {
  id: string;
  label: string;
  word: string | null;
  token: string;
  gapToken: string | null;
  gapLabel: string | null;
}

/**
 * Verdict en tête de « J'identifie » : quatre mots-clés, rien d'autre.
 * Lecture directe des curseurs à 5 crans — aucun recalcul.
 */
export const VerdictHeader: React.FC<VerdictHeaderProps> = ({
  detail,
  hasFlora,
  soilAvailable,
  textureCounts,
  loading = false,
  error = null,
}) => {
  const reduce = useReducedMotion();
  const animate = !reduce;

  const readings = React.useMemo(
    () =>
      buildScaleReadings(detail, hasFlora).map((r) =>
        soilAvailable ? r : { ...r, soil: null, gap: 'na' as const },
      ),
    [detail, hasFlora, soilAvailable],
  );
  const texture = React.useMemo(() => buildTextureReading(textureCounts), [textureCounts]);
  const sentence = React.useMemo(() => narrateScales(readings, texture), [readings, texture]);

  const cards: WordCard[] = React.useMemo(() => {
    const eau = readings.find((r) => r.axis.id === 'eau');
    const nutri = readings.find((r) => r.axis.id === 'nutri');
    const ph = readings.find((r) => r.axis.id === 'ph');
    const fromReading = (r?: typeof readings[number]): WordCard | null =>
      r
        ? {
            id: r.axis.id,
            label: r.axis.label,
            word: r.word,
            token: r.axis.token,
            gapToken: GAP_TOKEN[r.gap],
            gapLabel: GAP_LABEL[r.gap],
          }
        : null;

    return [
      fromReading(eau),
      {
        id: 'texture',
        label: 'Texture',
        word: texture.word ? texture.word.replace(' (à parts égales)', '') : null,
        token: '--ds-eco-texture',
        gapToken: null,
        gapLabel:
          texture.samples > 0
            ? `D’après ${texture.samples} prélèvement${texture.samples > 1 ? 's' : ''}`
            : 'Pas encore relevée',
      },
      fromReading(nutri),
      fromReading(ph),
    ].filter(Boolean) as WordCard[];
  }, [readings, texture]);

  const shell =
    'rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-7';

  if (loading) {
    return (
      <section className={shell} aria-busy>
        <Skeleton className="h-3 w-40" />
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-4 w-2/3" />
      </section>
    );
  }

  if (error) {
    return (
      <section className={shell} role="alert">
        <p className="text-sm text-[hsl(var(--ds-verdict-non))]">
          Le verdict n’a pas pu être établi : {error}
        </p>
      </section>
    );
  }

  const empty = !hasFlora && !soilAvailable;

  return (
    <section className={shell} aria-label="Verdict du site">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest-deep))]/55">
        Le verdict du site
      </p>

      {empty ? (
        <p className="mt-4 font-serif text-[15px] italic leading-relaxed text-[hsl(var(--ds-forest-deep))]/70">
          Rien à lire pour l’instant. Cochez les plantes observées ci-dessous, ou renseignez
          l’Étape 2 « J’analyse le sol » : les quatre mots apparaîtront aussitôt.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((c, i) => (
              <motion.article
                key={c.id}
                initial={animate ? { opacity: 0, y: 10 } : false}
                animate={animate ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.45, delay: 0.07 * i, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-paper))]/70 p-4"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: `hsl(var(${c.token}) / 0.75)` }}
                />
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: `hsl(var(${c.token}))` }}
                >
                  {c.label}
                </p>
                <p className="mt-2 font-serif text-[19px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[22px]">
                  {c.word ?? '—'}
                </p>
                {c.gapLabel && (
                  <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/60">
                    {c.gapToken && (
                      <span
                        aria-hidden
                        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                        style={{ background: `hsl(var(${c.gapToken}))` }}
                      />
                    )}
                    <span>{c.gapLabel}</span>
                  </p>
                )}
              </motion.article>
            ))}
          </div>

          {sentence && (
            <motion.p
              initial={animate ? { opacity: 0 } : false}
              animate={animate ? { opacity: 1 } : undefined}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-5 font-serif text-[16px] leading-relaxed text-[hsl(var(--ds-forest-deep))] md:text-[18px]"
            >
              {sentence}
            </motion.p>
          )}
        </>
      )}
    </section>
  );
};

export default VerdictHeader;
