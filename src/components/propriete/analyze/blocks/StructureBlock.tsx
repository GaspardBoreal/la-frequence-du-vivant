import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowUp } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { StructureCrossSection } from '../StructureCrossSection';
import { StructureProtocolCard } from '../StructureProtocolCard';
import { StructureSampleRow } from '../StructureSampleRow';
import { StructureResultsSummary } from '../StructureResultsSummary';
import {
  STRUCTURE_TESTS,
  dominantResult,
  type StructureResultId,
  type StructureTestId,
} from '../structureTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const STEPS = ['Prélever', 'Tester', 'Noter'];

export const StructureBlock: React.FC<{
  value?: string | null;
  onChange: (v: string) => void;
  samples?: SoilSample[];
  onUpdateSample?: (id: string, patch: Partial<SoilSample>) => void;
  /** Pastille médias par prélèvement (preuves de terrain). */
  renderSampleMedia?: (sample: SoilSample) => React.ReactNode;
  index?: number;
}> = ({ value, onChange, samples = [], onUpdateSample, renderSampleMedia, index = 0 }) => {
  const { dominant, counts, filled, contrasted } = useMemo(
    () => dominantResult(samples.map((s) => s.structure_result as StructureResultId | null)),
    [samples]
  );

  const testCounts = useMemo(() => {
    const c: Record<StructureTestId, number> = { beche: 0, stabilite: 0 };
    samples.forEach((s) => {
      if (s.structure_test && c[s.structure_test as StructureTestId] !== undefined) {
        c[s.structure_test as StructureTestId] += 1;
      }
    });
    return c;
  }, [samples]);

  // La structure globale est dérivée de la dominante (plus de choix manuel).
  useEffect(() => {
    if (dominant && dominant !== value) onChange(dominant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dominant]);

  return (
    <AnalyzeCard
      number={3}
      category="Étape 2 · Structure du sol"
      title="Comment se tient une motte ?"
      subtitle="Un test par prélèvement, un résultat par prélèvement."
      index={index}
      hero={
        <div className="aspect-[16/7]">
          <StructureCrossSection value={(dominant ?? null) as any} />
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
            Sur <span className="font-semibold">chacun de vos prélèvements</span>, réalisez l’un des
            deux tests ci-dessous, puis notez le résultat observé : compacte, grumeleuse ou très
            meuble.
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

        {/* ② Les deux tests */}
        <div className="grid md:grid-cols-2 gap-4">
          {STRUCTURE_TESTS.map((t, i) => (
            <StructureProtocolCard key={t.id} test={t} index={i} />
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
                {filled}/{samples.length} complétés
              </span>
            )}
          </div>

          {samples.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-forest))]/35 bg-[hsl(var(--ds-cream))]/60 p-5 text-center">
              <p className="text-[12.5px] text-[hsl(var(--ds-forest-deep))]/80">
                Aucun prélèvement positionné pour l’instant.
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
                <StructureSampleRow
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
          <StructureResultsSummary
            counts={counts}
            filled={filled}
            total={samples.length}
            dominant={dominant}
            contrasted={contrasted}
            testCounts={testCounts}
          />
        )}
      </div>
    </AnalyzeCard>
  );
};
