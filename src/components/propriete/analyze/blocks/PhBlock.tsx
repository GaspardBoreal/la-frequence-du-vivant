import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowUp, Info, Leaf } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { PhCrossSection } from '../PhCrossSection';
import { PhProtocolCard } from '../PhProtocolCard';
import { PhSampleRow } from '../PhSampleRow';
import { PhResultsSummary } from '../PhResultsSummary';
import { PH_TESTS, aggregatePh, type PhTestId } from '../phTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const STEPS = ['Humidifier', 'Mesurer', 'Lire', 'Noter'];

export const PhBlock: React.FC<{
  value?: number | null;
  onChange: (v: number) => void;
  samples?: SoilSample[];
  onUpdateSample?: (id: string, patch: Partial<SoilSample>) => void;
  /** Pastille médias par prélèvement (preuves de terrain). */
  renderSampleMedia?: (sample: SoilSample) => React.ReactNode;
  index?: number;
}> = ({ value, onChange, samples = [], onUpdateSample, renderSampleMedia, index = 0 }) => {
  const agg = useMemo(
    () => aggregatePh(samples.map((s) => (typeof s.ph_value === 'number' ? s.ph_value : null))),
    [samples]
  );

  const testCounts = useMemo(() => {
    const c: Record<PhTestId, number> = { bandelette: 0, phmetre: 0 };
    samples.forEach((s) => {
      const t = s.ph_test as PhTestId | null | undefined;
      if (t && c[t] !== undefined) c[t] += 1;
    });
    return c;
  }, [samples]);

  // Le pH global du diagnostic est dérivé de la moyenne des prélèvements.
  useEffect(() => {
    if (agg.average == null) return;
    const rounded = Math.round(agg.average * 10) / 10;
    if (value !== rounded) onChange(rounded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg.average]);

  const heroValue = agg.average != null ? Math.round(agg.average * 10) / 10 : value ?? null;

  return (
    <AnalyzeCard
      number={5}
      category="Étape 2 · Acidité · pH du sol"
      title="Le pH, clé de la nutrition"
      subtitle="Une mesure par prélèvement humide, une lecture d'ensemble du site."
      index={index}
      hero={
        <div className="aspect-[16/7]">
          <PhCrossSection value={heroValue} classId={agg.dominant} />
        </div>
      }
    >
      <div className="space-y-5">
        {/* ① Consigne */}
        <div className="rounded-2xl border border-[hsl(var(--ds-gold))]/45 bg-[hsl(var(--ds-gold))]/[0.09] p-3.5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))]">
            <Compass className="w-3 h-3" /> Ce que vous devez faire
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/90">
            Mesurez le <span className="font-semibold">pH</span> sur un échantillon humide issu de{' '}
            <span className="font-semibold">chacun de vos prélèvements</span> (bloc 2), puis reportez
            la valeur lue en face du point correspondant.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-forest))]/25 px-2.5 py-0.5 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] text-[8px] flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="text-[hsl(var(--ds-forest))]/40 text-xs">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ① bis · Pourquoi le pH */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/[0.05] p-3.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/75">
              <Info className="w-3 h-3" /> Pourquoi c'est décisif
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
              Le pH influence directement la{' '}
              <span className="font-semibold">disponibilité des éléments nutritifs</span> et explique
              pourquoi certaines plantes prospèrent tandis que d'autres dépérissent sur un même
              terrain.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-gold))]/55 bg-[hsl(var(--ds-cream))]/70 p-3.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))]">
              <Leaf className="w-3 h-3" /> Nota bene
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
              La plupart des végétaux d'ornement apprécient un pH{' '}
              <span className="font-semibold">voisin de la neutralité</span>, mais certaines espèces
              recherchent des sols très acides ou très calcaires.
            </p>
          </div>
        </div>

        {/* ② Les deux tests */}
        <div className="grid md:grid-cols-2 gap-4">
          {PH_TESTS.map((t, i) => (
            <PhProtocolCard key={t.id} test={t} index={i} />
          ))}
        </div>

        {/* ③ Résultats par prélèvement */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
              Résultats par prélèvement
            </div>
            {samples.length > 0 && (
              <span className="text-[10.5px] text-[hsl(var(--ds-forest-deep))]/60">
                {agg.filled}/{samples.length} mesurés
              </span>
            )}
          </div>

          {samples.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-forest))]/35 bg-[hsl(var(--ds-cream))]/60 p-5 text-center">
              <p className="text-[12.5px] text-[hsl(var(--ds-forest-deep))]/80">
                Aucun prélèvement positionné pour l'instant.
              </p>
              <a
                href="#etape2-prelevements"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-forest))]/10 px-3 py-1 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/20 transition"
              >
                <ArrowUp className="w-3 h-3" /> Positionner mes prélèvements (étape 2 · bloc 2)
              </a>
            </div>
          ) : (
            <motion.div layout className="space-y-2">
              {samples.map((s, i) => (
                <PhSampleRow
                  key={s.id}
                  sample={s}
                  index={i}
                  onPatch={(patch) => onUpdateSample?.(s.id, patch)}
                  mediaSlot={renderSampleMedia?.(s)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ④ Synthèse */}
        {samples.length > 0 && (
          <PhResultsSummary agg={agg} total={samples.length} testCounts={testCounts} />
        )}
      </div>
    </AnalyzeCard>
  );
};
