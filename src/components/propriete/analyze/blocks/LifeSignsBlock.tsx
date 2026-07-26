import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowUp, Info, Sprout } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { LifeCrossSection } from '../LifeCrossSection';
import { LifeProtocolCard } from '../LifeProtocolCard';
import { LifeSampleRow } from '../LifeSampleRow';
import { LifeResultsSummary } from '../LifeResultsSummary';
import { LIFE_TESTS, aggregateLife, type LifeTestId } from '../lifeTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const STEPS = ['Ouvrir', 'Observer', 'Compter', 'Cocher'];

export const LifeSignsBlock: React.FC<{
  values: string[];
  onToggle: (v: string) => void;
  onSetAll?: (next: string[]) => void;
  samples?: SoilSample[];
  onUpdateSample?: (id: string, patch: Partial<SoilSample>) => void;
  index?: number;
}> = ({ values, onToggle, onSetAll, samples = [], onUpdateSample, index = 0 }) => {
  const agg = useMemo(
    () =>
      aggregateLife(
        samples.map((s) => ({ signs: s.life_signs ?? [], worms: s.worm_count ?? null }))
      ),
    [samples]
  );

  const testCounts = useMemo(() => {
    const c: Record<LifeTestId, number> = { beche_vivante: 0, vinaigre: 0, sachet: 0 };
    samples.forEach((s) => {
      const t = s.life_test as LifeTestId | null | undefined;
      if (t && c[t] !== undefined) c[t] += 1;
    });
    return c;
  }, [samples]);

  // La liste globale du site est l'union des indices relevés par prélèvement.
  useEffect(() => {
    if (!onSetAll) return;
    const union = agg.union as string[];
    const same =
      union.length === values.length && union.every((u) => values.includes(u));
    if (!same) onSetAll(union);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg.union.join('|')]);

  return (
    <AnalyzeCard
      number={6}
      category="Étape 2 · Vie du sol"
      title="Ce que le sol laisse voir"
      subtitle="Un relevé d'indices biologiques par prélèvement, une lecture de vitalité pour le site."
      index={index}
      hero={
        <div className="aspect-[16/7]">
          <LifeCrossSection score={agg.averageScore} klass={agg.dominant} signs={agg.union} />
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
            Sur un échantillon humide issu de{' '}
            <span className="font-semibold">chacun de vos prélèvements</span> (bloc 2), cochez tous
            les <span className="font-semibold">indices visibles de vie biologique</span> et comptez
            les vers de terre. Chaque indice se commente au survol.
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

        {/* ① bis · Pourquoi / Nota bene */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/[0.05] p-3.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/75">
              <Info className="w-3 h-3" /> Pourquoi c'est décisif
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
              La vie du sol fabrique la <span className="font-semibold">fertilité</span> et la{' '}
              <span className="font-semibold">porosité</span> : elle recycle la matière organique,
              creuse les galeries qui laissent passer l'eau et l'air, et stabilise les agrégats
              observés au bloc 3.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-gold))]/55 bg-[hsl(var(--ds-cream))]/70 p-3.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))]">
              <Sprout className="w-3 h-3" /> Nota bene
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
              Observer par sol <span className="font-semibold">frais</span>, jamais en pleine
              sécheresse ni sur terre détrempée : la faune descend en profondeur et le relevé
              sous-estime la vitalité réelle.
            </p>
          </div>
        </div>

        {/* ② Les protocoles */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {LIFE_TESTS.map((t, i) => (
            <LifeProtocolCard key={t.id} test={t} index={i} />
          ))}
        </div>

        {/* ③ Résultats par prélèvement */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
              Relevé par prélèvement
            </div>
            {samples.length > 0 && (
              <span className="text-[10.5px] text-[hsl(var(--ds-forest-deep))]/60">
                {agg.filled}/{samples.length} renseignés
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
                <LifeSampleRow
                  key={s.id}
                  sample={s}
                  index={i}
                  total={samples.length}
                  onPatch={(patch) => onUpdateSample?.(s.id, patch)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ④ Synthèse */}
        {samples.length > 0 && (
          <LifeResultsSummary agg={agg} total={samples.length} testCounts={testCounts} />
        )}
      </div>
    </AnalyzeCard>
  );
};
