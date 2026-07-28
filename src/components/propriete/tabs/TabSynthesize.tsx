import React from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  CheckCheck,
  Check,
  Compass,
  FileText,
  Wand2,
  Printer,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { Button } from '@/components/ui/button';

import { usePropertySynthesis } from '@/hooks/propriete/usePropertySynthesis';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { usePropertyFlora } from '@/hooks/propriete/usePropertyFlora';
import { usePropertyGallery } from '@/hooks/propriete/usePropertyGallery';
import { usePropertyTestMedias } from '@/hooks/propriete/usePropertyTestMedias';
import { useProprieteParcelles, centroidOfParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { usePropertySpeciesCount } from '@/hooks/propriete/usePropertySpeciesCount';

import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { SelectorRow } from '@/components/propriete/synthesize/SelectorRow';
import { ItemsEditor } from '@/components/propriete/synthesize/ItemsEditor';
import { IdentityCard } from '@/components/propriete/synthesize/IdentityCard';
import {
  SynthesisSummary,
  type SynthesizeBlockId,
} from '@/components/propriete/synthesize/SynthesisSummary';
import {
  buildSynthesisModel,
  deduceSelectors,
  EXPOSURE_OPTIONS,
  WIND_OPTIONS,
  HUMIDITY_OPTIONS,
} from '@/components/propriete/synthesize/synthesisModel';

import { PrintChoiceDialog, type PrintChoice } from '@/components/propriete/print/PrintChoiceDialog';
import { CombinedPrintLayout } from '@/components/propriete/print/CombinedPrintLayout';
import { SynthesizePrintLayout } from '@/components/propriete/print/SynthesizePrintLayout';
import { usePrintCombined } from '@/components/propriete/print/usePrintCombined';
import PrintPreparationOverlay from '@/components/propriete/print/PrintPreparationOverlay';

import { buildSoilReading } from '@/components/propriete/analyze/soilReading';
import { soilLiteFromState, soilLiteAvailable } from '@/lib/soilLiteFromState';
import {
  computePoleScores,
  computeConcordanceDetail,
  PLANT_INDICATORS,
  LEVEL_LABEL,
  ECO_AXES,
  ICG_BAND_LABEL,
} from '@/lib/plantIndicatorKb';

interface Props {
  proprieteNom: string;
  proprieteVille?: string | null;
  proprieteId?: string;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
  bio?: PropertyBiodiversity;
}

export const TabSynthesize: React.FC<Props> = ({
  proprieteNom,
  proprieteVille,
  proprieteId,
  proprieteAdresse,
  proprieteCodePostal,
  proprieteCenter,
  bio,
}) => {
  const {
    state,
    setLocal,
    saving,
    savedAt,
    completedAt,
    setField,
    markComplete,
  } = usePropertySynthesis(proprieteId);

  const observation = usePropertyObservation(proprieteId);
  const { state: soilState, completedAt: soilCompletedAt } = usePropertySoil(proprieteId);
  const flora = usePropertyFlora(proprieteId);
  const speciesCount = usePropertySpeciesCount(proprieteId);
  const { data: galleryPhotos = [] } = usePropertyGallery(proprieteId);
  const { data: testMedias = [] } = usePropertyTestMedias(proprieteId);
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const derivedCenter = React.useMemo<[number, number] | null>(
    () => proprieteCenter ?? centroidOfParcelles(parcelles),
    [proprieteCenter, parcelles],
  );

  const soilReading = React.useMemo(() => buildSoilReading(soilState), [soilState]);
  const soilLite = React.useMemo(() => soilLiteFromState(soilState), [soilState]);
  const soilAvailable = soilLiteAvailable(soilLite);
  const scores = React.useMemo(
    () => computePoleScores(flora.state.observed_plants),
    [flora.state.observed_plants],
  );
  const concordance = React.useMemo(
    () => computeConcordanceDetail(flora.state.observed_plants, soilLite),
    [flora.state.observed_plants, soilLite],
  );

  const suggestions = React.useMemo(
    () => deduceSelectors(observation.state, soilReading),
    [observation.state, soilReading],
  );

  const model = React.useMemo(
    () =>
      buildSynthesisModel({
        propertyName: proprieteNom,
        commune: proprieteVille,
        observation: observation.state,
        soil: soilReading,
        soilCompleted: !!soilCompletedAt,
        floraCompleted: !!flora.completedAt,
        observationCompleted: !!observation.completedAt,
        observedPlants: flora.state.observed_plants.length,
        poleScores: scores,
        concordance: soilAvailable ? concordance : null,
        speciesTotal: speciesCount.total || bio?.speciesTotal || null,
        exposure: state.exposure,
        wind: state.wind_level,
        humidity: state.humidity,
      }),
    [
      proprieteNom,
      proprieteVille,
      observation.state,
      observation.completedAt,
      soilReading,
      soilCompletedAt,
      flora.completedAt,
      flora.state.observed_plants,
      scores,
      concordance,
      soilAvailable,
      speciesCount.total,
      bio?.speciesTotal,
      state.exposure,
      state.wind_level,
      state.humidity,
    ],
  );

  const [mode, setMode] = React.useState<'summary' | 'edit'>(completedAt ? 'summary' : 'edit');
  React.useEffect(() => {
    if (completedAt) setMode('summary');
  }, [completedAt]);

  const [submitting, setSubmitting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const scrollToBlock = (id: SynthesizeBlockId) => {
    setTimeout(() => {
      document
        .getElementById(`synthesize-block-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  /* ---------------- Génération IA ---------------- */
  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('propriete-diagnostic-narration', {
        body: {
          mode: 'synthesis',
          propertyName: proprieteNom,
          commune: proprieteVille ?? null,
          speciesTotal: speciesCount.total || bio?.speciesTotal || null,
          plants: flora.state.observed_plants
            .map((id) => PLANT_INDICATORS.find((p) => p.id === id))
            .filter(Boolean)
            .map((p) => ({ name: p!.nom, latin: p!.latin, family: p!.famille })),
          poles: scores.map((s) => ({
            label: s.pole.label,
            axis: ECO_AXES[s.pole.axis].label,
            level: LEVEL_LABEL[s.level],
            points: s.points,
          })),
          soil: soilAvailable
            ? {
                lecture: soilReading.sentence,
                structure: soilLite.structure,
                texture: soilLite.texture,
                ph: soilLite.ph,
                signesDeVie: soilLite.life_signs,
                prelevements: soilReading.samples.length,
                incomplets: soilReading.incomplete,
              }
            : undefined,
          concordance: soilAvailable
            ? {
                icg: concordance.icg,
                band: ICG_BAND_LABEL[concordance.band],
                points: concordance.points,
                max: concordance.max,
                reliability: concordance.reliability,
                evaluated: concordance.evaluated,
                rows: concordance.rows.map((r) => ({
                  label: r.label,
                  soil: r.soil,
                  flora: r.flora,
                  match: r.match,
                })),
              }
            : undefined,
          observationNotes: observation.state.notes || null,
          context: {
            exposition: state.exposure,
            vent: state.wind_level,
            humidite: state.humidity,
            etapesManquantes: model.missing,
          },
          seeds: {
            atouts: model.ruleAtouts.map((i) => i.text),
            contraintes: model.ruleContraintes.map((i) => i.text),
            vigilances: model.ruleVigilances.map((i) => i.text),
          },
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setLocal((s) => ({
        ...s,
        portrait: (data as any).portrait || s.portrait,
        atouts: (data as any).atouts?.length ? (data as any).atouts : s.atouts,
        contraintes: (data as any).contraintes?.length ? (data as any).contraintes : s.contraintes,
        vigilances: (data as any).vigilances?.length ? (data as any).vigilances : s.vigilances,
      }));
      toast.success('Synthèse pré-rédigée par l’IA — à vous de l’affiner');
    } catch (e: any) {
      toast.error('Génération impossible', { description: e?.message ?? 'Réessayez.' });
    } finally {
      setGenerating(false);
    }
  };

  const applyRules = () => {
    setLocal((s) => ({
      ...s,
      atouts: s.atouts.length ? s.atouts : model.ruleAtouts,
      contraintes: s.contraintes.length ? s.contraintes : model.ruleContraintes,
      vigilances: s.vigilances.length ? s.vigilances : model.ruleVigilances,
      portrait: (s.portrait ?? '').trim() ? s.portrait : model.portraitFallback,
    }));
    toast.success('Propositions issues de vos données reportées');
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await markComplete();
      toast.success('Étape 4 marquée comme terminée ✓');
      setMode('summary');
    } catch (e: any) {
      toast.error("Échec de l'enregistrement", { description: e?.message ?? 'Réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Impression ---------------- */
  const [printOpen, setPrintOpen] = React.useState(false);
  const [combinedPrinting, setCombinedPrinting] = React.useState(false);
  const [soloPrinting, setSoloPrinting] = React.useState(false);

  const combinedPrint = usePrintCombined({
    active: combinedPrinting,
    portalId: 'combined-print-portal',
    bodyClass: 'combined-printing',
    onDone: () => setCombinedPrinting(false),
  });
  const soloPrint = usePrintCombined({
    active: soloPrinting,
    portalId: 'synthesize-print-portal',
    bodyClass: 'synthesize-print-mode',
    onDone: () => setSoloPrinting(false),
  });

  const handleConfirmPrint = (choice: PrintChoice) => {
    setPrintOpen(false);
    if (choice === 'combined') setCombinedPrinting(true);
    else setSoloPrinting(true);
  };

  const printDialogAndPortal = (
    <>
      <PrintChoiceDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onConfirm={handleConfirmPrint}
        portraitPhotoCount={galleryPhotos.length}
        origin="synthesize"
        observeReady={!!observation.completedAt}
        analyzeReady={!!soilCompletedAt}
        identifyReady={!!flora.completedAt}
        synthesizeReady={!!completedAt}
        floraCount={flora.state.observed_plants.length}
      />
      <PrintPreparationOverlay
        visible={combinedPrinting}
        progress={combinedPrint.progress}
        steps={combinedPrint.steps}
        skipped={combinedPrint.skipped}
        incomplete={combinedPrint.incomplete}
        onRetryMissing={combinedPrint.retryMissing}
        onPrintAnyway={combinedPrint.printAnyway}
        onCancel={combinedPrint.cancel}
      />
      <PrintPreparationOverlay
        visible={soloPrinting}
        progress={soloPrint.progress}
        steps={soloPrint.steps}
        skipped={soloPrint.skipped}
        incomplete={soloPrint.incomplete}
        onRetryMissing={soloPrint.retryMissing}
        onPrintAnyway={soloPrint.printAnyway}
        onCancel={soloPrint.cancel}
      />

      {soloPrinting &&
        soloPrint.portalRef.current &&
        createPortal(
          <SynthesizePrintLayout
            state={state}
            model={model}
            completedAt={completedAt}
            propertyName={proprieteNom}
            commune={proprieteVille}
          />,
          soloPrint.portalRef.current,
        )}
      {combinedPrinting &&
        combinedPrint.portalRef.current &&
        createPortal(
          <CombinedPrintLayout
            answers={observation.state.answers}
            sensorial={observation.state.sensorial}
            completedAt={observation.completedAt}
            propertyName={proprieteNom}
            photos={galleryPhotos}
            proprieteVille={proprieteVille}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
            proprieteCenter={derivedCenter}
            parcelles={parcelles}
            publicUrl={typeof window !== 'undefined' ? window.location.href : undefined}
            soil={soilCompletedAt ? soilState : null}
            soilCompletedAt={soilCompletedAt}
            testMedias={testMedias}
            flora={flora.completedAt ? flora.state : null}
            floraCompletedAt={flora.completedAt}
            floraSoil={soilLite}
            synthesis={state}
            synthesisModel={model}
            synthesisCompletedAt={completedAt}
            proprieteId={proprieteId}
          />,
          combinedPrint.portalRef.current,
        )}
    </>
  );

  const header = (
    <StepHeader
      current={4}
      savedAt={savedAt}
      saving={saving}
      title="Je synthétise"
      subtitle={
        <>
          Rassembler le contexte, le sol et la flore en un seul portrait du site.
          <span className="italic"> Relier · Nommer · Transmettre.</span>
        </>
      }
    />
  );

  /* ---------------- Vue scellée ---------------- */
  if (completedAt && mode === 'summary') {
    return (
      <div className="space-y-6">
        {header}
        <SynthesisSummary
          state={state}
          model={model}
          completedAt={completedAt}
          propertyName={proprieteNom}
          commune={proprieteVille}
          onEditBlock={(id) => {
            setMode('edit');
            scrollToBlock(id);
          }}
          onReopenAll={() => setMode('edit')}
          onPrint={() => setPrintOpen(true)}
        />
        {printDialogAndPortal}
      </div>
    );
  }

  /* ---------------- Vue édition ---------------- */
  const filled =
    (state.exposure ? 1 : 0) +
    (state.wind_level ? 1 : 0) +
    (state.humidity ? 1 : 0) +
    ((state.portrait ?? '').trim() ? 1 : 0) +
    (state.atouts.length ? 1 : 0) +
    (state.contraintes.length ? 1 : 0);

  return (
    <div className="space-y-6">
      {header}

      {completedAt && (
        <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-4 py-2 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
            Mode édition — les modifications seront réenregistrées.
          </span>
          <Button size="sm" variant="ghost" onClick={() => setMode('summary')} className="text-xs">
            Revenir à la synthèse
          </Button>
        </div>
      )}

      {model.missing.length > 0 && (
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50/50 px-4 py-3 text-[12px] text-amber-800">
          Lecture partielle : {model.missing.join(' · ')}. La synthèse reste possible, mais elle
          portera la mention de son incertitude.
        </div>
      )}

      {/* 01 — Contexte du site */}
      <section
        id="synthesize-block-context"
        className="scroll-mt-24 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 space-y-4 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]"
      >
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
            <Compass className="w-3 h-3" /> 01 · Contexte du site
          </div>
          <h3 className="mt-1 font-serif italic text-2xl text-[hsl(var(--ds-forest-deep))]">
            Trois questions pour caler l’ambiance du lieu
          </h3>
          <p className="mt-1 text-xs text-[hsl(var(--ds-forest-deep))]/65">
            L’Étape 1 a relevé les sources (murs, haies, gouttières). Ici, vous tranchez sur
            l’intensité. Une proposition vous est faite à partir de vos relevés — libre à vous de la
            corriger.
          </p>
        </div>

        <SelectorRow
          index={1}
          title="Exposition"
          question="Combien de soleil ce site reçoit-il ?"
          options={EXPOSURE_OPTIONS}
          value={state.exposure}
          onChange={(v) => setField('exposure', v)}
          suggestion={suggestions.exposure}
        />
        <SelectorRow
          index={2}
          title="Vent"
          question="Le site est-il abrité ou exposé ?"
          options={WIND_OPTIONS}
          value={state.wind_level}
          onChange={(v) => setField('wind_level', v)}
          suggestion={suggestions.wind}
        />
        <SelectorRow
          index={3}
          title="Humidité"
          question="Comment l’eau se comporte-t-elle ici ?"
          options={HUMIDITY_OPTIONS}
          value={state.humidity}
          onChange={(v) => setField('humidity', v)}
          suggestion={suggestions.humidity}
        />
      </section>

      {/* 02 — Carte d'identité écologique */}
      <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          02 · Carte d’identité écologique
        </div>
        <h3 className="mt-1 mb-4 font-serif italic text-2xl text-[hsl(var(--ds-forest-deep))]">
          Ce que les trois premières étapes ont déjà écrit
        </h3>
        <IdentityCard lines={model.identity} />
      </section>

      {/* 03 — Portrait + IA */}
      <section
        id="synthesize-block-portrait"
        className="scroll-mt-24 rounded-3xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-gold))]">
              03 · Portrait du site
            </div>
            <h3 className="mt-1 font-serif italic text-2xl text-[hsl(var(--ds-forest-deep))]">
              Le site en un paragraphe
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyRules}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/15"
            >
              <Wand2 className="w-3 h-3" /> Pré-remplir par règles
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--ds-cream))] hover:bg-[hsl(var(--ds-forest-deep))] disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {generating ? 'L’IA relit vos données…' : 'Pré-rédiger avec l’IA'}
            </button>
          </div>
        </div>

        <textarea
          rows={6}
          value={state.portrait ?? ''}
          onChange={(e) => setField('portrait', e.target.value)}
          placeholder={model.portraitFallback}
          className="mt-3 w-full rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 font-serif italic text-base text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-gold))] resize-y placeholder:not-italic placeholder:text-[hsl(var(--ds-forest-deep))]/35"
        />
        {!(state.portrait ?? '').trim() && (
          <p className="mt-1.5 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/50">
            Laissé vide, le portrait déduit de vos données sera imprimé.
          </p>
        )}
      </section>

      {/* 04 — Atouts / contraintes / vigilances */}
      <section
        id="synthesize-block-atouts"
        className="scroll-mt-24 flex flex-col gap-4"
      >
        <ItemsEditor
          eyebrow="04 · Ce qui porte"
          title="Atouts"
          tone="atout"
          placeholder="Un levier du site…"
          items={state.atouts}
          onChange={(v) => setField('atouts', v)}
          suggestions={model.ruleAtouts}
        />
        <ItemsEditor
          eyebrow="05 · Ce qui limite"
          title="Contraintes"
          tone="contrainte"
          placeholder="Une limite objective…"
          items={state.contraintes}
          onChange={(v) => setField('contraintes', v)}
          suggestions={model.ruleContraintes}
        />
        <ItemsEditor
          eyebrow="06 · Ce qui alerte"
          title="Vigilances"
          tone="vigilance"
          placeholder="Un point à vérifier…"
          items={state.vigilances}
          onChange={(v) => setField('vigilances', v)}
          suggestions={model.ruleVigilances}
        />
      </section>

      {/* 05 — Note libre */}
      <section
        id="synthesize-block-notes"
        className="scroll-mt-24 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6"
      >
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          <FileText className="w-3 h-3" /> 07 · Note libre
        </div>
        <textarea
          rows={3}
          value={state.notes ?? ''}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Ce que vous voulez transmettre au client, au-delà des données…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{Math.min(filled, 6)}</span> / 6 blocs renseignés
          </span>
          {completedAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))]/15 text-[hsl(var(--ds-forest-deep))] px-2.5 py-0.5 text-xs font-semibold">
              <Check className="w-3 h-3" /> Terminée
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setPrintOpen(true)}
            className="border-[hsl(var(--ds-forest))]/40 text-[hsl(var(--ds-forest-deep))]"
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
          <Button
            onClick={handleComplete}
            disabled={submitting}
            className={
              completedAt
                ? 'bg-[hsl(var(--ds-forest-deep))] text-white hover:bg-[hsl(var(--ds-forest))] border border-[hsl(var(--ds-forest))]/40'
                : 'bg-[hsl(var(--ds-forest))]/85 text-white hover:bg-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-forest))]/40'
            }
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            {completedAt
              ? `Synthèse scellée le ${new Date(completedAt).toLocaleDateString('fr-FR')} · Réenregistrer`
              : 'Sceller la synthèse'}
          </Button>
        </div>
      </div>

      {printDialogAndPortal}
    </div>
  );
};
