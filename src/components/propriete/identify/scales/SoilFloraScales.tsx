import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScaleRow } from './ScaleRow';
import { TextureWord } from './TextureWord';
import {
  buildScaleReadings,
  buildTextureReading,
  narrateScales,
  type TextureKey,
} from '@/lib/soilFloraScales';
import type { ConcordanceDetail } from '@/lib/plantIndicatorKb';

export interface SoilFloraScalesProps {
  detail: ConcordanceDetail;
  /** Au moins une plante bio-indicatrice cochée à l'Étape 3 */
  hasFlora: boolean;
  /** L'Étape 2 est renseignée */
  soilAvailable: boolean;
  /** Répartition des textures dominantes des prélèvements */
  textureCounts: Record<TextureKey, number>;
  loading?: boolean;
  error?: string | null;
  /** Rendu sans animation, pour l'impression */
  print?: boolean;
  className?: string;
}

/**
 * « Ce que dit le site » : quatre curseurs, aucun chiffre agronomique.
 * Projection de lecture du détail de concordance — voir src/lib/soilFloraScales.ts.
 */
export const SoilFloraScales: React.FC<SoilFloraScalesProps> = ({
  detail,
  hasFlora,
  soilAvailable,
  textureCounts,
  loading = false,
  error = null,
  print = false,
  className = '',
}) => {
  const readings = React.useMemo(
    () => buildScaleReadings(detail, hasFlora).map((r) => (soilAvailable ? r : { ...r, soil: null, gap: 'na' as const })),
    [detail, hasFlora, soilAvailable]
  );
  const texture = React.useMemo(() => buildTextureReading(textureCounts), [textureCounts]);
  const sentence = React.useMemo(() => narrateScales(readings, texture), [readings, texture]);

  const shell = `soil-flora-scales rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4 md:p-5 ${className}`;

  if (loading) {
    return (
      <div className={shell} aria-busy>
        <Skeleton className="h-3 w-40" />
        <div className="mt-4 space-y-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-[9px] w-full" />
              <Skeleton className="h-2 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shell} role="alert">
        <p className="text-[12px] text-[hsl(var(--ds-verdict-non))]">
          La lecture du site n’a pas pu être chargée : {error}
        </p>
      </div>
    );
  }

  if (!hasFlora && !soilAvailable) {
    return (
      <div className={shell}>
        <p className="text-center text-[12px] italic text-[hsl(var(--ds-forest-deep))]/65">
          Renseignez l’Étape 2 « J’analyse le sol » ou cochez les plantes observées à l’Étape 3 :
          les quatre curseurs se dessineront aussitôt.
        </p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="font-serif text-[17px] text-[hsl(var(--ds-forest-deep))]">Ce que dit le site</h4>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/60">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-[10px] w-[10px] rounded-full"
              style={{ background: 'hsl(var(--ds-mineral))' }}
            />
            Le sol
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '8px solid hsl(var(--ds-chloro))',
              }}
            />
            La flore
          </span>
        </div>
      </div>

      <div className="mt-3 divide-y divide-[hsl(var(--ds-line))]/60">
        {readings.map((r, i) => (
          <ScaleRow key={r.axis.id} reading={r} delay={print ? 0 : 0.06 * i} print={print} />
        ))}
        <TextureWord reading={texture} print={print} />
      </div>

      {!hasFlora && (
        <p className="mt-3 text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
          Aucune plante observée pour l’instant : seule la voix du sol s’exprime.
        </p>
      )}
      {!soilAvailable && (
        <p className="mt-3 text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
          Le sol n’est pas encore renseigné : complétez l’Étape 2 pour confronter les deux voix.
        </p>
      )}

      {sentence && (
        <p className="mt-3 border-t border-[hsl(var(--ds-line))]/60 pt-3 font-serif text-[14px] leading-relaxed text-[hsl(var(--ds-forest-deep))]">
          {sentence}
        </p>
      )}
    </div>
  );
};
