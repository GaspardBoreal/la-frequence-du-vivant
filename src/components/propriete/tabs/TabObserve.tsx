import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCheck, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { usePropertyGallery } from '@/hooks/propriete/usePropertyGallery';
import { useProprieteParcelles, centroidOfParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { useNearestStations } from '@/hooks/useNearestStations';
import { getStationByCode } from '@/utils/weatherStationDatabase';
import { OBSERVE_BLOCKS } from '@/components/propriete/observe/observeConfig';
import { ObservationCard } from '@/components/propriete/observe/ObservationCard';
import { SensorialBlock } from '@/components/propriete/observe/SensorialBlock';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { ObserveSummary } from '@/components/propriete/observe/ObserveSummary';
import { PortraitTeaser } from '@/components/propriete/portrait/PortraitTeaser';
import { PrintChoiceDialog, type PrintChoice } from '@/components/propriete/print/PrintChoiceDialog';
import { CombinedPrintLayout } from '@/components/propriete/print/CombinedPrintLayout';
import { usePrintCombined } from '@/components/propriete/print/usePrintCombined';
import { Button } from '@/components/ui/button';

export const TabObserve: React.FC<{
  bio?: PropertyBiodiversity;
  proprieteId?: string;
  propertyName?: string;
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
}> = ({
  bio,
  proprieteId,
  propertyName,
  proprieteVille,
  proprieteAdresse,
  proprieteCodePostal,
  proprieteCenter,
}) => {
  const { state, saving, savedAt, completedAt, toggleChoice, setSensorial, setNotes, markComplete } =
    usePropertyObservation(proprieteId);
  const [submitting, setSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<'summary' | 'edit'>(
    completedAt ? 'summary' : 'edit'
  );

  // Repasse en summary quand une nouvelle validation intervient
  React.useEffect(() => {
    if (completedAt) setMode('summary');
  }, [completedAt]);

  const scrollToBlock = (blockId: string) => {
    setTimeout(() => {
      const el = document.getElementById(`observe-block-${blockId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const blocksAnswered = Object.values(state.answers).reduce(
    (n, arr) => n + (arr?.length ? 1 : 0),
    0
  );
  const sensorialFilled = Object.entries(state.sensorial ?? {}).some(
    ([k, v]) => k !== 'intensity' && typeof v === 'string' && v.trim().length > 0
  );
  const totalAnswered = blocksAnswered + (sensorialFilled ? 1 : 0);
  const totalBlocks = OBSERVE_BLOCKS.length + 1;

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await markComplete();
      toast.success("Étape 1 marquée comme terminée ✓");
      setMode('summary');
    } catch (e: any) {
      toast.error("Échec de l'enregistrement", { description: e?.message ?? 'Réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isDone = !!completedAt;
  const doneDate = completedAt ? new Date(completedAt).toLocaleDateString('fr-FR') : null;

  // ─── Impression : dialogue + portail combiné ────────────────────────────
  const { data: galleryPhotos = [] } = usePropertyGallery(proprieteId);
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const derivedCenter = React.useMemo<[number, number] | null>(
    () => proprieteCenter ?? centroidOfParcelles(parcelles),
    [proprieteCenter, parcelles],
  );
  const stationPoints = React.useMemo(
    () => (derivedCenter ? [{ id: 'property-center', latitude: derivedCenter[0], longitude: derivedCenter[1] }] : []),
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
  const combinedPortalRef = usePrintCombined({
    active: combinedPrinting,
    portalId: 'combined-print-portal',
    bodyClass: 'combined-printing',
    onDone: () => setCombinedPrinting(false),
  });

  const handleConfirmPrint = (choice: PrintChoice) => {
    setPrintOpen(false);
    if (choice === 'observe') {
      document.body.classList.add('observe-printing');
      const cleanup = () => {
        document.body.classList.remove('observe-printing');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(() => window.print(), 60);
    } else {
      setCombinedPrinting(true);
    }
  };

  const printDialogAndPortal = (
    <>
      <PrintChoiceDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        onConfirm={handleConfirmPrint}
        portraitPhotoCount={galleryPhotos.length}
      />
      {combinedPrinting && combinedPortalRef.current && createPortal(
        <CombinedPrintLayout
          answers={state.answers}
          sensorial={state.sensorial}
          completedAt={completedAt}
          propertyName={propertyName}
          photos={galleryPhotos}
          publicUrl={typeof window !== 'undefined' ? window.location.href : undefined}
        />,
        combinedPortalRef.current,
      )}
    </>
  );

  // Vue synthèse (carnet scellé) — quand terminé et non en mode édition
  if (isDone && mode === 'summary') {
    return (
      <div className="space-y-6">
        <StepHeader current={1} savedAt={savedAt} saving={saving} />
        <PortraitTeaser
          proprieteId={proprieteId}
          onOpen={() => window.dispatchEvent(new CustomEvent('propriete:goto-tab', { detail: 'portrait' }))}
        />
        <ObserveSummary
          answers={state.answers}
          sensorial={state.sensorial}
          completedAt={completedAt}
          onEditBlock={(id) => {
            setMode('edit');
            scrollToBlock(id);
          }}
          onReopenAll={() => setMode('edit')}
          propertyName={propertyName}
          onPrint={() => setPrintOpen(true)}
        />
        {printDialogAndPortal}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepHeader current={1} savedAt={savedAt} saving={saving} />

      <PortraitTeaser
        proprieteId={proprieteId}
        onOpen={() => window.dispatchEvent(new CustomEvent('propriete:goto-tab', { detail: 'portrait' }))}
      />


      {isDone && (
        <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-4 py-2 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
            Mode édition — les modifications seront réenregistrées.
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode('summary')}
            className="text-xs"
          >
            Revenir à la synthèse
          </Button>
        </div>
      )}

      {/* Grille des 8 cartes */}
      <div className="grid md:grid-cols-2 gap-5">
        {OBSERVE_BLOCKS.map((b, i) => (
          <div key={b.id} id={`observe-block-${b.id}`}>
            <ObservationCard
              block={b}
              selected={state.answers[b.id] ?? []}
              onToggle={(v) => toggleChoice(b.id, v)}
              index={i}
            />
          </div>
        ))}
        <div id="observe-block-sensorial">
          <SensorialBlock values={state.sensorial} onChange={setSensorial} />
        </div>
      </div>

      {/* Notes libres */}
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          Notes de terrain
        </div>
        <textarea
          rows={3}
          value={state.notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Impressions, hypothèses, points d'attention à discuter avec le client…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{totalAnswered}</span> / {totalBlocks} blocs renseignés
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
                ? "bg-[hsl(var(--ds-forest-deep))] text-white hover:bg-[hsl(var(--ds-forest))] border border-[hsl(var(--ds-forest))]/40"
                : "bg-[hsl(var(--ds-forest))]/85 text-white hover:bg-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-forest))]/40"
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
            Étape suivante · J'analyse le sol <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
