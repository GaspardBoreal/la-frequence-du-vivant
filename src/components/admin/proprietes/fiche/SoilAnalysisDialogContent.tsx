import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PropertySoilState, SoilSample } from '@/hooks/propriete/usePropertySoil';
import { buildSoilReading } from '@/components/propriete/analyze/soilReading';
import SampleCoreSvg, { type CoreStratum } from '@/components/propriete/analyze/sample/SampleCoreSvg';
import { StrataSeal, StrataCompletionLine } from '@/components/propriete/analyze/sample/StrataSeal';
import { strataState } from '@/components/propriete/analyze/sample/strataGlyphs';
import { RESULT_LABELS, READING, TEST_LABELS } from '@/components/propriete/analyze/structureTests';
import {
  BOUDIN_FORM_MAP,
  TEXTURE_LABELS,
  TEXTURE_READING,
  TEXTURE_TEST_LABELS,
} from '@/components/propriete/analyze/textureTests';
import { classifyPh, PH_TEST_LABELS, phPercent } from '@/components/propriete/analyze/phTests';
import {
  LIFE_CLASS_MAP,
  LIFE_SIGN_MAP,
  LIFE_TEST_LABELS,
  scoreLife,
  type LifeSignId,
} from '@/components/propriete/analyze/lifeTests';
import type { SoilBlockId } from '@/components/propriete/analyze/media/soilTestCatalog';

interface Props {
  state: PropertySoilState;
}

const isComplete = (sample: SoilSample) => {
  const lifeDone = (sample.life_signs?.length ?? 0) > 0 || typeof sample.worm_count === 'number';
  return !!sample.structure_result && !!sample.texture_result && typeof sample.ph_value === 'number' && lifeDone;
};

const SampleCard: React.FC<{ sample: SoilSample; index: number; onOpen: () => void }> = ({
  sample,
  index,
  onOpen,
}) => (
  <motion.li
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
  >
    <Button
      type="button"
      variant="outline"
      onClick={onOpen}
      className="group h-auto w-full justify-start whitespace-normal rounded-lg bg-card p-0 text-left hover:bg-muted/30"
      aria-label={`Voir la fiche Carotte de sol du prélèvement ${sample.label}`}
    >
      <span className="flex w-full items-stretch">
        <span className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 border-r border-border bg-primary/5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {sample.label}
          </span>
          <span className="text-[10px] uppercase text-muted-foreground">Point</span>
        </span>
        <span className="min-w-0 flex-1 p-3">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {sample.location?.trim() || `Prélèvement ${sample.label}`}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {sample.lat != null && sample.lng != null ? 'Point géolocalisé' : 'Emplacement non situé'}
              </span>
            </span>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-3 block overflow-x-auto pb-1">
            <StrataSeal sample={sample} size="popup" />
          </span>
          <StrataCompletionLine sample={sample} className="mt-2 block" />
        </span>
      </span>
    </Button>
  </motion.li>
);

const ResultBlock: React.FC<{
  title: string;
  value: string | null;
  test: string | null;
  reading: string | null;
  extra?: React.ReactNode;
}> = ({ title, value, test, reading, extra }) => (
  <section className="rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <span className="text-[11px] text-muted-foreground">{test ?? 'Test non réalisé'}</span>
    </div>
    {value ? (
      <>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
        {extra}
        {reading && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{reading}</p>}
      </>
    ) : (
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5" /> Résultat à compléter
      </p>
    )}
  </section>
);

const SampleDetail: React.FC<{
  sample: SoilSample;
  index: number;
  total: number;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
}> = ({ sample, index, total, onBack, onPrevious, onNext }) => {
  const [active, setActive] = React.useState<SoilBlockId | null>(null);
  const strata = strataState(sample);
  const coreStrata: CoreStratum[] = strata.map((s) => ({
    id: s.id,
    label: s.label,
    value: s.short,
    color: s.color,
  }));
  const ph = typeof sample.ph_value === 'number' ? classifyPh(sample.ph_value) : null;
  const hasLife = (sample.life_signs?.length ?? 0) > 0 || typeof sample.worm_count === 'number';
  const life = hasLife ? scoreLife(sample.life_signs, sample.worm_count) : null;
  const lifeClass = life ? LIFE_CLASS_MAP[life.klass] : null;
  const signs = (sample.life_signs ?? [])
    .map((id) => LIFE_SIGN_MAP[id as LifeSignId]?.label)
    .filter(Boolean);

  return (
    <motion.div
      key={sample.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="space-y-4"
    >
      <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 bg-background/95 px-1 py-2 backdrop-blur-sm">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft /> Synthèse
        </Button>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{index + 1} / {total}</span>
        <Button type="button" variant="outline" size="icon" onClick={onPrevious} aria-label="Carotte précédente">
          <ChevronLeft />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onNext} aria-label="Carotte suivante">
          <ChevronRight />
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {sample.label}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {sample.location?.trim() || `Prélèvement ${sample.label}`}
            </h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {sample.lat != null && sample.lng != null ? 'Point géolocalisé' : 'Emplacement non situé'}
            </p>
          </div>
          <span className="ml-auto hidden sm:block">
            {isComplete(sample) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                <Check className="h-3 w-3" /> Complet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" /> À compléter
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="hidden rounded-lg border border-border bg-muted/20 p-3 md:block">
          <SampleCoreSvg strata={coreStrata} active={active} onSelect={setActive} height={390} />
        </div>
        <div className="grid gap-3">
          <ResultBlock
            title="Structure"
            value={sample.structure_result ? RESULT_LABELS[sample.structure_result] : null}
            test={sample.structure_test ? TEST_LABELS[sample.structure_test] : null}
            reading={sample.structure_result ? READING[sample.structure_result] : null}
          />
          <ResultBlock
            title="Texture"
            value={sample.texture_result ? TEXTURE_LABELS[sample.texture_result] : null}
            test={sample.texture_test ? TEXTURE_TEST_LABELS[sample.texture_test] : null}
            reading={sample.texture_result ? TEXTURE_READING[sample.texture_result] : null}
            extra={sample.boudin_form ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {BOUDIN_FORM_MAP[sample.boudin_form].label} · {BOUDIN_FORM_MAP[sample.boudin_form].clay}
              </p>
            ) : null}
          />
          <ResultBlock
            title="Acidité"
            value={ph && typeof sample.ph_value === 'number' ? `pH ${sample.ph_value.toFixed(1)} · ${ph.label}` : null}
            test={sample.ph_test ? PH_TEST_LABELS[sample.ph_test] : null}
            reading={ph?.advice ?? null}
            extra={ph && typeof sample.ph_value === 'number' ? (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-label={`pH ${sample.ph_value.toFixed(1)} sur une échelle de 4 à 9`}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${phPercent(sample.ph_value)}%` }} />
              </div>
            ) : null}
          />
          <ResultBlock
            title="Vie du sol"
            value={lifeClass ? `${lifeClass.label} · indice ${life?.score ?? 0}/100` : null}
            test={sample.life_test ? LIFE_TEST_LABELS[sample.life_test] : null}
            reading={lifeClass?.reading ?? null}
            extra={lifeClass ? (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {typeof sample.worm_count === 'number' && <p>{sample.worm_count} ver{sample.worm_count > 1 ? 's' : ''} dans une bêchée 20 × 20 × 20 cm</p>}
                {signs.length > 0 && <p>Indices observés : {signs.join(' · ')}</p>}
              </div>
            ) : null}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const SoilAnalysisDialogContent: React.FC<Props> = ({ state }) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const reading = React.useMemo(() => buildSoilReading(state), [state]);
  const samples = state.samples ?? [];
  const selectedIndex = selectedId ? samples.findIndex((sample) => sample.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? samples[selectedIndex] : null;
  const complete = samples.filter(isComplete).length;

  if (samples.length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <SampleDetail
          sample={selected}
          index={selectedIndex}
          total={samples.length}
          onBack={() => setSelectedId(null)}
          onPrevious={() => setSelectedId(samples[(selectedIndex - 1 + samples.length) % samples.length].id)}
          onNext={() => setSelectedId(samples[(selectedIndex + 1) % samples.length].id)}
        />
      ) : (
        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-lg font-semibold text-foreground">{reading.sentence}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div><p className="text-xl font-semibold tabular-nums text-foreground">{samples.length}</p><p className="text-[11px] text-muted-foreground">prélèvements</p></div>
              <div><p className="text-xl font-semibold tabular-nums text-foreground">{complete}</p><p className="text-[11px] text-muted-foreground">complets</p></div>
              <div><p className="text-xl font-semibold tabular-nums text-foreground">{reading.placedSamples}</p><p className="text-[11px] text-muted-foreground">géolocalisés</p></div>
            </div>
            {reading.incomplete.length > 0 && (
              <p className="mt-3 flex items-start gap-1.5 border-t border-primary/15 pt-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Points à compléter : {reading.incomplete.join(', ')}. Les mesures absentes ne sont pas interprétées.
              </p>
            )}
          </section>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Fiches Carotte de sol</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {samples.map((sample, index) => (
                <SampleCard key={sample.id} sample={sample} index={index} onOpen={() => setSelectedId(sample.id)} />
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SoilAnalysisDialogContent;