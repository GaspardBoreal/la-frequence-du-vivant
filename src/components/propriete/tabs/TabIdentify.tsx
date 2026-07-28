import React, { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCheck, Loader2, Check, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertyFlora } from '@/hooks/propriete/usePropertyFlora';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { usePropertyGallery } from '@/hooks/propriete/usePropertyGallery';
import { useProprieteParcelles, centroidOfParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { usePropertyTestMedias } from '@/hooks/propriete/usePropertyTestMedias';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { BiodiversityEvidenceBlock } from '@/components/propriete/BiodiversityEvidenceBlock';
import { SkipBlock } from '@/components/propriete/identify/blocks/SkipBlock';
import { IdentifyBriefBlock } from '@/components/propriete/identify/blocks/IdentifyBriefBlock';
import { EcoMatrixBlock } from '@/components/propriete/identify/blocks/EcoMatrixBlock';
import { CortegeBlock } from '@/components/propriete/identify/blocks/CortegeBlock';
import { IntensitiesBlock } from '@/components/propriete/identify/blocks/IntensitiesBlock';
import { ConcordanceBlock } from '@/components/propriete/identify/blocks/ConcordanceBlock';
import { NarrativeBlock } from '@/components/propriete/identify/blocks/NarrativeBlock';
import { DeltaBlock } from '@/components/propriete/identify/blocks/DeltaBlock';
import { RevealMapBlock } from '@/components/propriete/identify/blocks/RevealMapBlock';
import { SentinellesBlock } from '@/components/propriete/identify/blocks/SentinellesBlock';
import { IdentifySummary, type IdentifyBlockId } from '@/components/propriete/identify/IdentifySummary';
import { PrintChoiceDialog, type PrintChoice } from '@/components/propriete/print/PrintChoiceDialog';
import { CombinedPrintLayout } from '@/components/propriete/print/CombinedPrintLayout';
import { IdentifyPrintLayout } from '@/components/propriete/print/IdentifyPrintLayout';
import { usePrintCombined } from '@/components/propriete/print/usePrintCombined';
import PrintPreparationOverlay from '@/components/propriete/print/PrintPreparationOverlay';
import {
  computeFloraProfile,
  computePoleScores,
  computeConcordanceDetail,
  narratePoleScores,
  PLANT_INDICATORS,
  LEVEL_LABEL,
  ECO_AXES,
} from '@/lib/plantIndicatorKb';


const TOTAL = 5; // Tableau + Cortège illustré + Somme des indices + Concordance + Narration

export const TabIdentify: React.FC<{
  proprieteId?: string;
  proprieteNom?: string;
  bio?: PropertyBiodiversity;
  proprieteCenter?: [number, number] | null;
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
}> = ({
  proprieteId,
  proprieteNom,
  bio,
  proprieteCenter,
  proprieteVille,
  proprieteAdresse,
  proprieteCodePostal,
}) => {
  const {
    state,
    saving,
    savedAt,
    completedAt,
    setField,
    togglePlant,
    markComplete,
  } = usePropertyFlora(proprieteId);

  const { state: soil, completedAt: soilCompletedAt } = usePropertySoil(proprieteId);
  const [submitting, setSubmitting] = React.useState(false);

  const profile = useMemo(() => computeFloraProfile(state.observed_plants), [state.observed_plants]);
  const soilAvailable = !!(soil.structure || soil.texture || soil.ph != null || (soil.life_signs?.length ?? 0) > 0);
  const scores = useMemo(() => computePoleScores(state.observed_plants), [state.observed_plants]);
  const detail = useMemo(
    () => computeConcordanceDetail(state.observed_plants, soil),
    [state.observed_plants, soil]
  );
  const autoNarrative = useMemo(() => narratePoleScores(scores), [scores]);

  // Persister ICG dans la base pour l'onglet Synthèse
  useEffect(() => {
    if (profile.count > 0 && soilAvailable) {
      setField('icg_score', detail.icg);
      setField('concordance', detail as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.icg, profile.count, soilAvailable]);

  const filled = state.skip_bioindication
    ? TOTAL
    : (profile.count > 0 ? 1 : 0) +
      (profile.count > 0 ? 1 : 0) +
      (profile.count > 0 ? 1 : 0) +
      (soilAvailable && profile.count > 0 ? 1 : 0) +
      ((state.flora_conclusion ?? '').trim().length > 0 ? 1 : 0);

  const isDone = !!completedAt;
  const doneDate = completedAt ? new Date(completedAt).toLocaleDateString('fr-FR') : null;

  const [mode, setMode] = React.useState<'summary' | 'edit'>(completedAt ? 'summary' : 'edit');
  React.useEffect(() => {
    if (completedAt) setMode('summary');
  }, [completedAt]);

  const scrollToBlock = (blockId: IdentifyBlockId) => {
    setTimeout(() => {
      const el = document.getElementById(`identify-block-${blockId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await markComplete();
      toast.success('Étape 3 marquée comme terminée ✓');
      setMode('summary');
    } catch (e: any) {
      toast.error("Échec de l'enregistrement", { description: e?.message ?? 'Réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Impression ────────────────────────────────────────────────────────
  const observation = usePropertyObservation(proprieteId);
  const { data: galleryPhotos = [] } = usePropertyGallery(proprieteId);
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const { data: testMedias = [], refetch: refetchTestMedias } = usePropertyTestMedias(proprieteId);
  const derivedCenter = React.useMemo<[number, number] | null>(
    () => proprieteCenter ?? centroidOfParcelles(parcelles),
    [proprieteCenter, parcelles],
  );

  const [printOpen, setPrintOpen] = React.useState(false);
  const [combinedPrinting, setCombinedPrinting] = React.useState(false);
  const [soloPrinting, setSoloPrinting] = React.useState(false);

  const combinedPrint = usePrintCombined({
    active: combinedPrinting,
    portalId: 'combined-print-portal',
    bodyClass: 'combined-printing',
    onDone: () => setCombinedPrinting(false),
    prepare: async () => {
      try {
        await refetchTestMedias();
      } catch {
        /* impression possible malgré tout */
      }
    },
    prepareLabel: 'Réveil des preuves de terrain (liens sécurisés)',
  });
  const combinedPortalRef = combinedPrint.portalRef;

  const soloPrint = usePrintCombined({
    active: soloPrinting,
    portalId: 'identify-print-portal',
    bodyClass: 'identify-print-mode',
    onDone: () => setSoloPrinting(false),
    prepareLabel: 'Réveil de l’atlas botanique (photos de référence)',
  });
  const soloPortalRef = soloPrint.portalRef;

  const handleConfirmPrint = (choice: PrintChoice) => {
    setPrintOpen(false);
    if (choice === 'combined') {
      setCombinedPrinting(true);
      return;
    }
    setSoloPrinting(true);
  };

  const printDialogAndPortal = (
    <>
      <PrintChoiceDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onConfirm={handleConfirmPrint}
        portraitPhotoCount={galleryPhotos.length}
        origin="identify"
        analyzeReady={!!soilCompletedAt}
        observeReady={!!observation.completedAt}
        identifyReady={isDone}
        floraCount={profile.count}
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

      {soloPrinting && soloPortalRef.current && createPortal(
        <IdentifyPrintLayout
          flora={state}
          soil={soil}
          soilAvailable={soilAvailable}
          completedAt={completedAt}
          propertyName={proprieteNom}
          proprieteId={proprieteId}
        />,
        soloPortalRef.current,
      )}
      {combinedPrinting && combinedPortalRef.current && createPortal(
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
          soil={soilCompletedAt ? soil : null}
          soilCompletedAt={soilCompletedAt}
          testMedias={testMedias}
          flora={state}
          floraCompletedAt={completedAt}
          floraSoil={soil}
          proprieteId={proprieteId}
        />,
        combinedPortalRef.current,
      )}
    </>
  );

  // ─── Vue synthèse (carnet scellé) ──────────────────────────────────────
  if (isDone && mode === 'summary' && !state.skip_bioindication) {
    return (
      <div className="space-y-6">
        <StepHeader current={3} savedAt={savedAt} saving={saving} />
        <IdentifySummary
          state={state}
          soil={soil}
          soilAvailable={soilAvailable}
          completedAt={completedAt}
          propertyName={proprieteNom}
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

  return (
    <div className="space-y-6">
      <BiodiversityEvidenceBlock bio={bio} proprieteId={proprieteId} proprieteNom={proprieteNom} />
      <StepHeader current={3} savedAt={savedAt} saving={saving} />

      {isDone && (
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

      <SkipBlock skip={state.skip_bioindication} onToggle={(v) => setField('skip_bioindication', v)} index={0} />

      {!state.skip_bioindication && (
        <>
          {/* Nouveautés depuis 30j — accroche de retour */}
          <DeltaBlock proprieteId={proprieteId} index={0} />

          {/* Preuve spatiale : carte des observations marcheurs */}
          <RevealMapBlock proprieteId={proprieteId} index={1} />

          <IdentifyBriefBlock index={2} />

          <div id="identify-block-cortege" className="scroll-mt-24 space-y-6">
            <EcoMatrixBlock
              observed={state.observed_plants}
              onToggle={togglePlant}
              index={3}
              proprieteId={proprieteId}
            />

            <CortegeBlock observed={state.observed_plants} onToggle={togglePlant} index={4} proprieteId={proprieteId} />
          </div>

          <div id="identify-block-poles" className="scroll-mt-24">
            <IntensitiesBlock
              scores={scores}
              plantCount={profile.count}
              narrative={autoNarrative}
              index={5}
              onUseNarrative={(t) =>
                setField(
                  'flora_conclusion',
                  (state.flora_conclusion ?? '').trim() ? `${state.flora_conclusion}\n${t}` : t
                )
              }
            />
          </div>

          <div id="identify-block-concordance" className="scroll-mt-24">
            <ConcordanceBlock detail={detail} soilAvailable={soilAvailable && profile.count > 0} index={6} />
          </div>

          <div id="identify-block-narration" className="scroll-mt-24">
            <NarrativeBlock
              conclusion={state.flora_conclusion ?? ''}
              onChangeConclusion={(v) => setField('flora_conclusion', v)}
              notes={state.notes ?? ''}
              onChangeNotes={(v) => setField('notes', v)}
              autoNarrative={autoNarrative}
              index={7}
            />
          </div>
          <div id="identify-block-notes" className="scroll-mt-24" />

          {/* Humains derrière la donnée */}
          <SentinellesBlock proprieteId={proprieteId} index={8} />
        </>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{Math.min(filled, TOTAL)}</span> / {TOTAL} blocs renseignés
          </span>
          {isDone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))]/15 text-[hsl(var(--ds-forest-deep))] px-2.5 py-0.5 text-xs font-semibold">
              <Check className="w-3 h-3" /> Terminée
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isDone && (
            <Button
              variant="outline"
              onClick={() => setPrintOpen(true)}
              className="border-[hsl(var(--ds-forest))]/40 text-[hsl(var(--ds-forest-deep))]"
            >
              <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
          )}
          <Button
            onClick={handleComplete}
            disabled={submitting}
            className={
              isDone
                ? 'bg-[hsl(var(--ds-forest-deep))] text-white hover:bg-[hsl(var(--ds-forest))] border border-[hsl(var(--ds-forest))]/40'
                : 'bg-[hsl(var(--ds-forest))]/85 text-white hover:bg-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-forest))]/40'
            }
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            {isDone
              ? `Étape terminée${doneDate ? ` le ${doneDate}` : ''} · Réenregistrer`
              : "Marquer l'étape comme terminée"}
          </Button>
          <Button className="bg-[hsl(var(--ds-forest))] hover:bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
            Étape suivante · Je synthétise <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {printDialogAndPortal}
    </div>
  );
};
