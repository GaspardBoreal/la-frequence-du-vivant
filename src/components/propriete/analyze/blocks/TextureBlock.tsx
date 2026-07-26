import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowUp } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { TextureCrossSection } from '../TextureCrossSection';
import { TextureProtocolCard } from '../TextureProtocolCard';
import { TextureSampleRow } from '../TextureSampleRow';
import { TextureResultsSummary } from '../TextureResultsSummary';
import {
  TEXTURE_GLOBAL_VALUE,
  TEXTURE_TESTS,
  dominantTexture,
  type BoudinFormId,
  type TextureResultId,
  type TextureTestId,
} from '../textureTests';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const STEPS = ['Humidifier', 'Rouler', 'Courber', 'Noter'];

export const TextureBlock: React.FC<{
  boudinShape?: string | null;
  texture?: string | null;
  onChangeBoudin: (v: string) => void;
  onChangeTexture: (v: string) => void;
  samples?: SoilSample[];
  onUpdateSample?: (id: string, patch: Partial<SoilSample>) => void;
  index?: number;
}> = ({ boudinShape, texture, onChangeBoudin, onChangeTexture, samples = [], onUpdateSample, index = 0 }) => {
  const { dominant, counts, filled, contrasted } = useMemo(
    () => dominantTexture(samples.map((s) => s.texture_result as TextureResultId | null)),
    [samples]
  );

  const testCounts = useMemo(() => {
    const c: Record<TextureTestId, number> = { boudin: 0, sedimentation: 0 };
    samples.forEach((s) => {
      const t = s.texture_test as TextureTestId | null | undefined;
      if (t && c[t] !== undefined) c[t] += 1;
    });
    return c;
  }, [samples]);

  const formCounts = useMemo(() => {
    const c: Record<BoudinFormId, number> = { droit: 0, lune: 0, cercle: 0 };
    samples.forEach((s) => {
      const f = s.boudin_form as BoudinFormId | null | undefined;
      if (f && c[f] !== undefined) c[f] += 1;
    });
    return c;
  }, [samples]);

  // La texture globale est dérivée de la dominante des prélèvements.
  useEffect(() => {
    if (!dominant) return;
    if (boudinShape !== dominant) onChangeBoudin(dominant);
    const global = TEXTURE_GLOBAL_VALUE[dominant];
    if (texture !== global) onChangeTexture(global);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dominant]);

  return (
    <AnalyzeCard
      number={4}
      category="Étape 2 · Texture du sol · Test du boudin"
      title="Sable, limon ou argile ?"
      subtitle="Un test par prélèvement humide, une classe de texture par prélèvement."
      index={index}
      hero={
        <div className="aspect-[16/7]">
          <TextureCrossSection value={dominant} />
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
            Réalisez le <span className="font-semibold">test du boudin</span> avec un échantillon
            humide issu de <span className="font-semibold">chacun de vos prélèvements</span>, puis
            notez la classe de texture observée. Pour des résultats plus poussés, complétez avec le{' '}
            <span className="font-semibold">test de sédimentation</span> (optionnel).
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
          {TEXTURE_TESTS.map((t, i) => (
            <TextureProtocolCard key={t.id} test={t} index={i} />
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
                <TextureSampleRow
                  key={s.id}
                  sample={s}
                  index={i}
                  onPatch={(patch) => onUpdateSample?.(s.id, patch)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ④ Synthèse */}
        {samples.length > 0 && (
          <TextureResultsSummary
            counts={counts}
            filled={filled}
            total={samples.length}
            dominant={dominant}
            contrasted={contrasted}
            testCounts={testCounts}
            formCounts={formCounts}
          />
        )}
      </div>
    </AnalyzeCard>
  );
};
