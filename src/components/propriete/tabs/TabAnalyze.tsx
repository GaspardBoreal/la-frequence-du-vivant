import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCheck, Loader2, Check, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { usePropertyGallery } from '@/hooks/propriete/usePropertyGallery';
import { useProprieteParcelles, centroidOfParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { useNearestStations } from '@/hooks/useNearestStations';
import { getStationByCode } from '@/utils/weatherStationDatabase';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { TerrainBlock } from '@/components/propriete/analyze/blocks/TerrainBlock';
import { SamplesMapBlock } from '@/components/propriete/analyze/blocks/SamplesMapBlock';
import { StructureBlock } from '@/components/propriete/analyze/blocks/StructureBlock';
import { TextureBlock } from '@/components/propriete/analyze/blocks/TextureBlock';
import { PhBlock } from '@/components/propriete/analyze/blocks/PhBlock';
import { LifeSignsBlock } from '@/components/propriete/analyze/blocks/LifeSignsBlock';
import { AnalyzeSummary, type AnalyzeBlockId } from '@/components/propriete/analyze/AnalyzeSummary';
import { PrintChoiceDialog, type PrintChoice } from '@/components/propriete/print/PrintChoiceDialog';
import { CombinedPrintLayout } from '@/components/propriete/print/CombinedPrintLayout';
import { AnalyzePrintLayout } from '@/components/propriete/print/AnalyzePrintLayout';
import { usePrintCombined } from '@/components/propriete/print/usePrintCombined';
import PrintPreparationOverlay from '@/components/propriete/print/PrintPreparationOverlay';
import { usePropertySpeciesCount } from '@/hooks/propriete/usePropertySpeciesCount';
import { KINGDOM_ORDER, KINGDOM_LABELS_FR } from '@/lib/kingdomLabels';
import { TestMediaBadge } from '@/components/propriete/analyze/media/TestMediaDrawer';
import { TestMediaRegistry } from '@/components/propriete/analyze/media/TestMediaRegistry';
import { SoilHistoryPanel } from '@/components/propriete/analyze/SoilHistoryPanel';
import { AnalyzeStickyBar } from '@/components/propriete/analyze/AnalyzeStickyBar';
import { AnalyzeExitRecapDialog } from '@/components/propriete/analyze/AnalyzeExitRecapDialog';

import {
  usePropertyTestMedias,
  useTestMediaIndex,
} from '@/hooks/propriete/usePropertyTestMedias';


const TOTAL = 7; // 6 blocs + synthèse

export const TabAnalyze: React.FC<{
  bio?: PropertyBiodiversity;
  proprieteId?: string;
  proprieteCenter?: [number, number] | null;
  propertyName?: string;
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
}> = ({
  bio,
  proprieteId,
  proprieteCenter,
  propertyName,
  proprieteVille,
  proprieteAdresse,
  proprieteCodePostal,
}) => {

  const {
    state,
    setLocal,
    saving,
    savedAt,
    completedAt,
    setField,
    toggleLifeSign,
    updateSample,
    addSample,
    removeSample,
    relabelSample,
    restoreSample,

    markComplete,
  } = usePropertySoil(proprieteId);

  const speciesCount = usePropertySpeciesCount(proprieteId);
  const { data: testMedias = [], refetch: refetchTestMedias } = usePropertyTestMedias(proprieteId);
  const mediaIndex = useTestMediaIndex(testMedias);

  const mediaBadge = (
    s: any,
    block: 'structure' | 'texture' | 'ph' | 'life',
    testId: string
  ) =>
    proprieteId ? (
      <TestMediaBadge
        target={{
          proprieteId,
          sampleId: s.id,
          sampleLabel: s.label,
          sampleLocation: s.location ?? null,
          block,
          testId: testId as any,
        }}
        medias={mediaIndex.get(`${testId}::${s.id}`) ?? []}
      />
    ) : null;

  const [submitting, setSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<'summary' | 'edit'>(
    completedAt ? 'summary' : 'edit'
  );

  React.useEffect(() => {
    if (completedAt) setMode('summary');
  }, [completedAt]);

  const scrollToBlock = (blockId: AnalyzeBlockId) => {
    setTimeout(() => {
      const el = document.getElementById(`analyze-block-${blockId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const filled =
    (state.terrain_status ? 1 : 0) +
    (state.samples.some((s) => (s.location ?? '').trim().length > 0) ? 1 : 0) +
    (state.samples.some((s) => s.structure_test && s.structure_result) ? 1 : 0) +
    (state.samples.some((s) => s.texture_test && s.texture_result) || state.boudin_shape ? 1 : 0) +
    (state.samples.some((s) => typeof s.ph_value === 'number') || state.ph != null ? 1 : 0) +
    (state.samples.some(
      (s) => (s.life_signs?.length ?? 0) > 0 || typeof s.worm_count === 'number'
    ) || state.life_signs.length > 0
      ? 1
      : 0) +
    ((state.synthesis ?? '').trim().length > 0 ? 1 : 0);

  // ─── Sortie du mode édition : jamais bloquante ──────────────────────────
  const [exitRecap, setExitRecap] = React.useState<null | { validated: boolean }>(null);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await markComplete();
      toast.success('Étape 2 marquée comme terminée ✓');
      setExitRecap({ validated: true });
    } catch (e: any) {
      toast.error("Échec de l'enregistrement", { description: e?.message ?? 'Réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitWithoutValidating = () => setExitRecap({ validated: false });

  const confirmExit = () => {
    setExitRecap(null);
    if (completedAt) {
      setMode('summary');
    } else {
      toast.success('Vos saisies sont enregistrées', {
        description: 'Vous pourrez reprendre cette étape à tout moment.',
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDone = !!completedAt;
  const doneDate = completedAt ? new Date(completedAt).toLocaleDateString('fr-FR') : null;
  const placedCount = state.samples.filter((s) => s.lat != null && s.lng != null).length;

  const exitRecapDialog = (
    <AnalyzeExitRecapDialog
      open={!!exitRecap}
      onOpenChange={(o) => !o && setExitRecap(null)}
      validated={exitRecap?.validated ?? false}
      samplesCount={state.samples.length}
      placedCount={placedCount}
      filled={filled}
      total={TOTAL}
      savedAt={savedAt}
      onConfirm={confirmExit}
    />
  );

  // ─── Impression : dialogue + portail cahier complet ─────────────────────
  const observation = usePropertyObservation(proprieteId);
  const { data: galleryPhotos = [] } = usePropertyGallery(proprieteId);
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const derivedCenter = React.useMemo<[number, number] | null>(
    () => proprieteCenter ?? centroidOfParcelles(parcelles),
    [proprieteCenter, parcelles],
  );
  const stationPoints = React.useMemo(
    () =>
      derivedCenter
        ? [{ id: 'property-center', latitude: derivedCenter[0], longitude: derivedCenter[1] }]
        : [],
    [derivedCenter],
  );
  const { stations, pointLinks } = useNearestStations(stationPoints, 60);
  const nearestStation = React.useMemo(() => {
    const link = pointLinks[0];
    if (!link) return null;
    const st = stations.find((s) => s.code === link.stationCode);
    if (!st) return null;
    const local = getStationByCode(st.code);
    return {
      code: st.code,
      name: st.name,
      lat: st.lat,
      lng: st.lng,
      distanceKm: link.distance,
      source: st.source,
      department: local?.department ?? null,
      region: local?.region ?? null,
      elevation: local?.elevation ?? null,
    };
  }, [pointLinks, stations]);

  const [printOpen, setPrintOpen] = React.useState(false);
  const [combinedPrinting, setCombinedPrinting] = React.useState(false);
  const [soloPrinting, setSoloPrinting] = React.useState(false);
  const combinedPrint = usePrintCombined({
    active: combinedPrinting,
    portalId: 'combined-print-portal',
    bodyClass: 'combined-printing',
    onDone: () => setCombinedPrinting(false),
    // URL signées valables 1 h : on les rafraîchit en parallèle du montage.
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
    portalId: 'analyze-print-portal',
    bodyClass: 'analyze-print-mode',
    onDone: () => setSoloPrinting(false),
  });
  const soloPortalRef = soloPrint.portalRef;

  /** Horodatage du dernier carnet imprimé (preuve papier hors ligne). */
  const printStampKey = proprieteId ? `soil-print-stamp:${proprieteId}` : null;
  const [printStamp, setPrintStamp] = React.useState<string | null>(null);
  React.useEffect(() => {
    setPrintStamp(printStampKey ? localStorage.getItem(printStampKey) : null);
  }, [printStampKey]);

  const handleConfirmPrint = (choice: PrintChoice) => {
    setPrintOpen(false);
    if (printStampKey) {
      const now = new Date().toISOString();
      localStorage.setItem(printStampKey, now);
      setPrintStamp(now);
    }
    if (choice === 'combined') {
      setCombinedPrinting(true);
      return;
    }
    setSoloPrinting(true);
  };

  const printOutdated =
    !!savedAt && (!printStamp || new Date(savedAt) > new Date(printStamp));



  const printDialogAndPortal = (
    <>
      <PrintChoiceDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onConfirm={handleConfirmPrint}
        portraitPhotoCount={galleryPhotos.length}
        origin="analyze"
        analyzeReady={isDone}
        observeReady={!!observation.completedAt}
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
        <AnalyzePrintLayout
          soil={state}
          completedAt={completedAt}
          propertyName={propertyName}
          parcelles={parcelles}
        />,
        soloPortalRef.current,
      )}
      {combinedPrinting && combinedPortalRef.current && createPortal(
        <CombinedPrintLayout
          answers={observation.state.answers}
          sensorial={observation.state.sensorial}
          completedAt={observation.completedAt}
          propertyName={propertyName}
          photos={galleryPhotos}
          proprieteVille={proprieteVille}
          proprieteAdresse={proprieteAdresse}
          proprieteCodePostal={proprieteCodePostal}
          proprieteCenter={derivedCenter}
          parcelles={parcelles}
          station={nearestStation}
          publicUrl={typeof window !== 'undefined' ? window.location.href : undefined}
          soil={state}
          soilCompletedAt={completedAt}
          testMedias={testMedias}
        />,
        combinedPortalRef.current,
      )}
    </>
  );


  // Vue synthèse (carnet scellé) — quand terminé et non en mode édition
  if (isDone && mode === 'summary') {
    return (
      <div className="space-y-6">
        <StepHeader
          current={2}
          savedAt={savedAt}
          saving={saving}
          title="J'analyse le sol"
          subtitle={
            <>
              Lire la terre par les mains et les yeux : texture, structure, pH, signes de vie.
              <span className="italic"> Toucher · Sentir · Comprendre.</span>
            </>
          }
        />
        <SoilHistoryPanel proprieteId={proprieteId} />
        <AnalyzeSummary

          proprieteId={proprieteId}
          state={state}

          completedAt={completedAt}
          propertyName={propertyName}
          parcelles={parcelles}
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
      <StepHeader
        current={2}
        savedAt={savedAt}
        saving={saving}
        title="J'analyse le sol"
        subtitle={
          <>
            Lire la terre par les mains et les yeux : texture, structure, pH, signes de vie.
            <span className="italic"> Toucher · Sentir · Comprendre.</span>
          </>
        }
      />

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

      {printOutdated && (
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-4 py-2 text-xs text-[hsl(var(--ds-forest-deep))]">
          Le registre a changé depuis votre dernier carnet imprimé
          {printStamp ? ` (${new Date(printStamp).toLocaleDateString('fr-FR')})` : ''} —
          pensez à réimprimer pour garder une preuve papier à jour.
        </div>
      )}

      <SoilHistoryPanel proprieteId={proprieteId} />



      {/* Blocs 1 → 4 : pleine largeur pour laisser respirer les cartes et pictos */}
      <div className="space-y-5">
        <div id="analyze-block-terrain" className="scroll-mt-24">
          <TerrainBlock
            value={state.terrain_status}
            onChange={(v) => setField('terrain_status', v)}
            index={0}
          />
        </div>
        <div id="etape2-prelevements" className="scroll-mt-24">
        <div id="analyze-block-prelevements" className="scroll-mt-24">
        <SamplesMapBlock
          proprieteId={proprieteId}
          proprieteCenter={proprieteCenter}
          samples={state.samples}
          onUpdate={updateSample}
          onAdd={addSample}
          onRemove={removeSample}
          onRelabel={relabelSample}
          onRestore={restoreSample}
          index={1}

        />
        </div>
        </div>
        <div id="analyze-block-structure" className="scroll-mt-24">
          <StructureBlock
            value={state.structure}
            onChange={(v) => setField('structure', v)}
            samples={state.samples}
            onUpdateSample={updateSample}
            renderSampleMedia={(s) => mediaBadge(s, 'structure', (s.structure_test as any) ?? 'beche')}
            index={2}
          />
        </div>
        <div id="analyze-block-texture" className="scroll-mt-24">
          <TextureBlock
            boudinShape={state.boudin_shape}
            texture={state.texture}
            onChangeBoudin={(v) => setField('boudin_shape', v)}
            onChangeTexture={(v) => setField('texture', v)}
            samples={state.samples}
            onUpdateSample={updateSample}
            renderSampleMedia={(s) =>
              proprieteId ? (
                <TestMediaBadge
                  target={{
                    proprieteId,
                    sampleId: s.id,
                    sampleLabel: s.label,
                    sampleLocation: s.location ?? null,
                    block: 'texture',
                    testId: (s.texture_test as any) ?? 'boudin',
                  }}
                  medias={
                    mediaIndex.get(`${(s.texture_test as any) ?? 'boudin'}::${s.id}`) ?? []
                  }
                />
              ) : null
            }
            index={3}
          />
        </div>


      </div>

      {/* Bloc 5 : pleine largeur — une mesure de pH par prélèvement */}
      <div id="analyze-block-ph" className="scroll-mt-24">
        <PhBlock
          value={state.ph}
          onChange={(v) => setField('ph', v)}
          samples={state.samples}
          onUpdateSample={updateSample}
          renderSampleMedia={(s) => mediaBadge(s, 'ph', (s.ph_test as any) ?? 'bandelette')}
          index={4}
        />
      </div>

      {/* Bloc 6 : pleine largeur — indices de vie par prélèvement */}
      <div id="analyze-block-life" className="scroll-mt-24">
        <LifeSignsBlock
          values={state.life_signs}
          onToggle={toggleLifeSign}
          onSetAll={(next) => setLocal((s) => ({ ...s, life_signs: next }))}
          samples={state.samples}
          onUpdateSample={updateSample}
          renderSampleMedia={(s) => mediaBadge(s, 'life', (s.life_test as any) ?? 'beche_vivante')}
          index={5}
        />
      </div>

      {/* Registre visuel — toutes les preuves de terrain */}
      <div id="analyze-block-medias" className="scroll-mt-24">
        <TestMediaRegistry medias={testMedias} index={6} />
      </div>






      {/* Synthèse */}
      <div id="analyze-block-synthesis" className="scroll-mt-24 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]">

        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          <BarChart3 className="w-3 h-3" /> Synthèse d'analyse
        </div>
        <textarea
          rows={3}
          value={state.synthesis ?? ''}
          onChange={(e) => setField('synthesis', e.target.value)}
          placeholder="Ce que ce sol raconte : forces, limites, points d'attention pour la suite du diagnostic…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </div>

      {/* Empreinte biodiversité (contexte) */}
      {speciesCount.total > 0 && (
        <div className="rounded-3xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-5 text-xs text-[hsl(var(--ds-forest-deep))]/80">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
              En appui — biodiversité connue
            </div>
            <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/60">
              <span className="font-semibold">{speciesCount.total}</span> espèces recensées
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {KINGDOM_ORDER.filter((k) => speciesCount.byKingdom[k] > 0).map((k) => (
              <span key={k} className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-3 py-1">
                <span className="font-semibold">{speciesCount.byKingdom[k]}</span>{' '}
                {KINGDOM_LABELS_FR[k]}
              </span>
            ))}
          </div>
        </div>
      )}


      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{filled}</span> / {TOTAL} blocs renseignés
          </span>
          {isDone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))]/15 text-[hsl(var(--ds-forest-deep))] px-2.5 py-0.5 text-xs font-semibold">
              <Check className="w-3 h-3" /> Terminée
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
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
            Étape suivante · J'identifie <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      {printDialogAndPortal}
    </div>

  );
};
