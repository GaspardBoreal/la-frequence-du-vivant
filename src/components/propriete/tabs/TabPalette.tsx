import React from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Palette,
  Printer,
  CheckCheck,
  Check,
  Loader2,
  Quote,
  Wand2,
  Ban,
  CalendarRange,
  Sprout,
  BookOpen,
  Gauge,
} from 'lucide-react';

import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { Button } from '@/components/ui/button';

import { usePropertyPalette } from '@/hooks/propriete/usePropertyPalette';
import { useProprieteZones, ZONE_COLORS } from '@/hooks/propriete/usePropertyZones';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { usePropertyFlora } from '@/hooks/propriete/usePropertyFlora';
import { usePropertySynthesis } from '@/hooks/propriete/usePropertySynthesis';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { usePropertyGallery } from '@/hooks/propriete/usePropertyGallery';
import { usePropertyTestMedias } from '@/hooks/propriete/usePropertyTestMedias';
import { useProprieteParcelles, centroidOfParcelles } from '@/hooks/propriete/usePropertyParcelles';

import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import ZonesMapBlock from '@/components/propriete/palette/ZonesMapBlock';
import ExcludedSpeciesMap from '@/components/propriete/palette/ExcludedSpeciesMap';
import { useExcludedOnSite, excludedKey } from '@/hooks/propriete/useExcludedOnSite';
import { buildGeofence, isInsideGeofence } from '@/lib/geofence';
import ZonePaletteCard from '@/components/propriete/palette/ZonePaletteCard';
import {
  PaletteSummary,
  type PaletteBlockId,
  type PaletteZoneView,
} from '@/components/propriete/palette/PaletteSummary';

import { soilLiteFromState } from '@/lib/soilLiteFromState';
import { computePoleScores } from '@/lib/plantIndicatorKb';
import { PALETTE_SOURCES } from '@/lib/plantPaletteKb';
import {
  buildExclusions,
  buildImplementation,
  buildSiteProfile,
  buildSiteRule,
  recommendForZone,
  zoneProfile,
  type ZoneAmbiance,
} from '@/lib/paletteEngine';

import { PrintChoiceDialog, type PrintChoice } from '@/components/propriete/print/PrintChoiceDialog';
import { CombinedPrintLayout } from '@/components/propriete/print/CombinedPrintLayout';
import { PalettePrintLayout } from '@/components/propriete/print/PalettePrintLayout';
import { usePrintCombined } from '@/components/propriete/print/usePrintCombined';
import PrintPreparationOverlay from '@/components/propriete/print/PrintPreparationOverlay';
import { buildSynthesisModel } from '@/components/propriete/synthesize/synthesisModel';
import { buildSoilReading } from '@/components/propriete/analyze/soilReading';
import { computeConcordanceDetail } from '@/lib/plantIndicatorKb';
import { usePropertySpeciesCount } from '@/hooks/propriete/usePropertySpeciesCount';

interface Props {
  proprieteId?: string;
  proprieteNom?: string;
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
  bio?: PropertyBiodiversity;
}

export const TabPalette: React.FC<Props> = ({
  proprieteId,
  proprieteNom = 'Propriété',
  proprieteVille,
  proprieteAdresse,
  proprieteCodePostal,
  proprieteCenter,
  bio,
}) => {
  const palette = usePropertyPalette(proprieteId);
  const { zones, upsertZone, deleteZone } = useProprieteZones(proprieteId);

  const { state: soilState, completedAt: soilCompletedAt } = usePropertySoil(proprieteId);
  const flora = usePropertyFlora(proprieteId);
  const synthesis = usePropertySynthesis(proprieteId);
  const observation = usePropertyObservation(proprieteId);
  const speciesCount = usePropertySpeciesCount(proprieteId);
  const { data: galleryPhotos = [] } = usePropertyGallery(proprieteId);
  const { data: testMedias = [] } = usePropertyTestMedias(proprieteId);
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);

  const derivedCenter = React.useMemo<[number, number] | null>(
    () => proprieteCenter ?? centroidOfParcelles(parcelles),
    [proprieteCenter, parcelles],
  );

  const soilLite = React.useMemo(() => soilLiteFromState(soilState), [soilState]);
  const poleScores = React.useMemo(
    () => computePoleScores(flora.state.observed_plants),
    [flora.state.observed_plants],
  );

  const siteProfile = React.useMemo(
    () =>
      buildSiteProfile({
        soil: soilLite,
        poleScores,
        exposure: synthesis.state.exposure,
        humidity: synthesis.state.humidity,
      }),
    [soilLite, poleScores, synthesis.state.exposure, synthesis.state.humidity],
  );

  const autoRule = React.useMemo(() => buildSiteRule(siteProfile), [siteProfile]);
  const autoExclusions = React.useMemo(() => buildExclusions(siteProfile), [siteProfile]);
  const autoImplementation = React.useMemo(
    () => buildImplementation(siteProfile, zones.length),
    [siteProfile, zones.length],
  );

  const [activeZoneId, setActiveZoneId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<'summary' | 'edit'>(
    palette.completedAt ? 'summary' : 'edit',
  );
  React.useEffect(() => {
    if (palette.completedAt) setMode('summary');
  }, [palette.completedAt]);

  const choiceOf = React.useCallback(
    (zoneId: string) => palette.state.zones.find((z) => z.zone_id === zoneId),
    [palette.state.zones],
  );

  /** Vue enrichie de chaque zone (recommandations calculées). */
  const zoneViews: PaletteZoneView[] = React.useMemo(
    () =>
      zones.map((z, i) => {
        const choice = choiceOf(z.id);
        const ambiance: ZoneAmbiance = choice?.ambiance ?? 'neutre';
        const profile = zoneProfile(siteProfile, ambiance);
        return {
          id: z.id,
          name: z.nom,
          color: z.couleur || ZONE_COLORS[i % ZONE_COLORS.length],
          ambiance,
          intention: choice?.intention ?? null,
          recommendations: recommendForZone(profile, { exclude: choice?.dismissed ?? [] }),
          selected: choice?.selected ?? [],
        };
      }),
    [zones, choiceOf, siteProfile],
  );

  /** Palette générale quand aucune zone n'est tracée. */
  const globalRecommendations = React.useMemo(
    () => recommendForZone(siteProfile),
    [siteProfile],
  );

  const siteRule = (palette.state.site_rule ?? '').trim() || autoRule;
  const exclusions = palette.state.excluded.length ? palette.state.excluded : autoExclusions;
  const implementation = palette.state.implementation.length
    ? palette.state.implementation
    : autoImplementation;

  /** Refus réellement observés sur la propriété (étape 3 → étape 5). */
  const {
    presence: excludedPresence,
    totalOnSite: onSiteCount,
    allWaypoints,
  } = useExcludedOnSite(proprieteId, exclusions);
  const [mapOpenFor, setMapOpenFor] = React.useState<string | null>(null);

  /** Version sérialisable pour la synthèse scellée et l'impression. */
  const excludedPresenceRecord = React.useMemo(() => {
    const out: Record<string, { count: number; zoneNames?: string[] }> = {};
    const fences = zones.map((z) => ({
      nom: z.nom,
      fence: buildGeofence([{ geometry: z.geometry }]),
    }));
    excludedPresence.forEach((p, key) => {
      if (p.count === 0) return;
      const names = fences
        .filter(({ fence }) => p.occurrences.some((o) => isInsideGeofence(fence, o.lat, o.lng)))
        .map(({ nom }) => nom);
      out[key] = { count: p.count, zoneNames: names.length ? names : undefined };
    });
    return out;
  }, [excludedPresence, zones]);



  const selectedTotal = zoneViews.reduce((n, z) => n + z.selected.length, 0);

  const applyAuto = () => {
    palette.setLocal((s) => ({
      ...s,
      site_rule: (s.site_rule ?? '').trim() ? s.site_rule : autoRule,
      excluded: s.excluded.length ? s.excluded : autoExclusions,
      implementation: s.implementation.length ? s.implementation : autoImplementation,
    }));
    toast.success('Règle, refus et calendrier déduits de vos données');
  };

  const toggleSpecies = (zoneId: string, speciesId: string) => {
    const current = choiceOf(zoneId)?.selected ?? [];
    palette.setZoneChoice(zoneId, {
      selected: current.includes(speciesId)
        ? current.filter((s) => s !== speciesId)
        : [...current, speciesId],
    });
  };

  const handleCreateZone = async (geometry: any) => {
    try {
      await upsertZone({
        nom: `Emplacement ${String.fromCharCode(65 + zones.length)}`,
        geometry,
        couleur: ZONE_COLORS[zones.length % ZONE_COLORS.length],
        ordre: zones.length,
      });
      toast.success('Zone enregistrée — nommez-la et choisissez son ambiance');
    } catch (e: any) {
      toast.error('Zone non enregistrée', { description: e?.message ?? 'Réessayez.' });
    }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await deleteZone(id);
      setActiveZoneId(null);
      toast.success('Zone supprimée');
    } catch (e: any) {
      toast.error('Suppression impossible', { description: e?.message ?? 'Réessayez.' });
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      palette.setLocal((s) => ({
        ...s,
        site_rule: (s.site_rule ?? '').trim() ? s.site_rule : autoRule,
        excluded: s.excluded.length ? s.excluded : autoExclusions,
        implementation: s.implementation.length ? s.implementation : autoImplementation,
      }));
      await palette.markComplete();
      toast.success('Étape 5 scellée ✓');
      setMode('summary');
    } catch (e: any) {
      toast.error("Échec de l'enregistrement", { description: e?.message ?? 'Réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToBlock = (id: PaletteBlockId) => {
    setMode('edit');
    setTimeout(() => {
      document
        .getElementById(`palette-block-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
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
    portalId: 'palette-print-portal',
    bodyClass: 'synthesize-print-mode',
    onDone: () => setSoloPrinting(false),
  });

  const soilReading = React.useMemo(() => buildSoilReading(soilState), [soilState]);
  const concordance = React.useMemo(
    () => computeConcordanceDetail(flora.state.observed_plants, soilLite),
    [flora.state.observed_plants, soilLite],
  );
  const synthesisModel = React.useMemo(
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
        poleScores,
        concordance,
        speciesTotal: speciesCount.total || bio?.speciesTotal || null,
        exposure: synthesis.state.exposure,
        wind: synthesis.state.wind_level,
        humidity: synthesis.state.humidity,
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
      poleScores,
      concordance,
      speciesCount.total,
      bio?.speciesTotal,
      synthesis.state,
    ],
  );

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
        origin="palette"
        observeReady={!!observation.completedAt}
        analyzeReady={!!soilCompletedAt}
        identifyReady={!!flora.completedAt}
        synthesizeReady={!!synthesis.completedAt}
        paletteReady={!!palette.completedAt}
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
          <PalettePrintLayout
            siteRule={siteRule}
            zones={zoneViews}
            excluded={exclusions}
            implementation={implementation}
            notes={palette.state.notes}
            completedAt={palette.completedAt}
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
            synthesis={synthesis.completedAt ? synthesis.state : null}
            synthesisModel={synthesisModel}
            synthesisCompletedAt={synthesis.completedAt}
            palette={
              palette.completedAt
                ? {
                    siteRule,
                    zones: zoneViews,
                    excluded: exclusions,
                    implementation,
                    notes: palette.state.notes,
                  }
                : null
            }
            paletteCompletedAt={palette.completedAt}
            proprieteId={proprieteId}
          />,
          combinedPrint.portalRef.current,
        )}
    </>
  );

  const header = (
    <StepHeader
      current={5}
      savedAt={palette.savedAt}
      saving={palette.saving}
      title="Palette végétale"
      subtitle={
        <>
          Choisir, emplacement par emplacement, ce qui a une chance de vivre ici sans assistance.
          <span className="italic"> Filtrer · Répartir · Assumer.</span>
        </>
      }
    />
  );

  /* ---------------- Vue scellée ---------------- */
  if (palette.completedAt && mode === 'summary') {
    return (
      <div className="space-y-6">
        {header}
        <PaletteSummary
          siteRule={siteRule}
          zones={zoneViews}
          excluded={exclusions}
          implementation={implementation}
          notes={palette.state.notes}
          completedAt={palette.completedAt}
          propertyName={proprieteNom}
          commune={proprieteVille}
          onEditBlock={scrollToBlock}
          onReopenAll={() => setMode('edit')}
          onPrint={() => setPrintOpen(true)}
        />
        {printDialogAndPortal}
      </div>
    );
  }

  /* ---------------- Édition ---------------- */
  return (
    <div className="space-y-6">
      {header}

      {/* Bandeau de fiabilité */}
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-4 md:p-5 flex flex-wrap items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))]/12 text-[hsl(var(--ds-forest-deep))] flex items-center justify-center">
          <Gauge className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-[0.28em] uppercase text-[hsl(var(--ds-forest))]/75">
            Fiabilité du profil de site
          </div>
          <div className="text-sm text-[hsl(var(--ds-forest-deep))]">
            {Math.round(siteProfile.confidence * 100)} % des axes documentés
            {siteProfile.basis.length > 0 && (
              <span className="text-[hsl(var(--ds-forest))]/70">
                {' '}
                — d’après {siteProfile.basis.join(', ')}.
              </span>
            )}
          </div>
        </div>
        <button
          onClick={applyAuto}
          className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10"
        >
          <Wand2 className="w-3.5 h-3.5" /> Déduire de mes données
        </button>
      </div>

      {/* 01 — La règle du site */}
      <div id="palette-block-rule" className="scroll-mt-24">
        <AnalyzeCard
          number={1}
          category="La règle du site"
          title="Une phrase qui vaut filtre"
          subtitle="Tout ce qui entre au jardin doit y répondre. Sinon, on ne plante pas."
          index={0}
          hero={
            <div className="p-4 flex items-start gap-3">
              <Quote className="w-5 h-5 text-[hsl(var(--ds-gold))] shrink-0" />
              <p className="font-serif italic text-lg leading-snug text-[hsl(var(--ds-forest-deep))]">
                {autoRule}
              </p>
            </div>
          }
        >
          <textarea
            rows={3}
            value={palette.state.site_rule ?? ''}
            onChange={(e) => palette.setField('site_rule', e.target.value)}
            placeholder={autoRule}
            className="w-full rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 font-serif italic text-base text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-gold))] resize-y placeholder:not-italic placeholder:text-[hsl(var(--ds-forest-deep))]/35"
          />
          <p className="mt-1.5 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/55">
            Laissée vide, la règle déduite de vos étapes 2, 3 et 4 sera imprimée.
          </p>
        </AnalyzeCard>
      </div>

      {/* 02 — Emplacements */}
      <div id="palette-block-zones" className="scroll-mt-24">
        <AnalyzeCard
          number={2}
          category="Emplacements"
          title="Une palette par lieu, pas une pour la propriété"
          subtitle="Dessinez jusqu’à 5 zones à main levée : chacune reçoit sa propre palette, répartie en strates."
          index={1}
        >
          <ZonesMapBlock
            center={derivedCenter}
            parcelles={parcelles}
            zones={zones}
            activeZoneId={activeZoneId}
            onSelectZone={setActiveZoneId}
            onCreateZone={handleCreateZone}
            onDeleteZone={handleDeleteZone}
          />
        </AnalyzeCard>
      </div>

      {/* Palettes par zone */}
      {zoneViews.length > 0 ? (
        <div className="space-y-4">
          {zoneViews.map((z, i) => (
            <ZonePaletteCard
              key={z.id}
              index={i}
              name={z.name}
              color={z.color}
              ambiance={z.ambiance}
              intention={z.intention}
              recommendations={z.recommendations}
              selectedIds={z.selected}
              onAmbianceChange={(a) => palette.setZoneChoice(z.id, { ambiance: a })}
              onIntentionChange={(v) => palette.setZoneChoice(z.id, { intention: v })}
              onToggleSpecies={(id) => toggleSpecies(z.id, id)}
              onRename={(v) =>
                upsertZone({
                  id: z.id,
                  nom: v || 'Emplacement',
                  geometry: zones.find((zz) => zz.id === z.id)?.geometry,
                  couleur: z.color,
                  ordre: i,
                }).catch(() => {})
              }
            />
          ))}
        </div>
      ) : (
        <AnalyzeCard
          number={3}
          category="Proposition générale"
          title="Ce que le site accepterait, partout"
          subtitle="Tracez des zones pour affiner : cette liste vaut pour la moyenne de la propriété."
          index={2}
        >
          <ZonePaletteCard
            index={0}
            name="Ensemble de la propriété"
            color={ZONE_COLORS[0]}
            ambiance="neutre"
            recommendations={globalRecommendations}
            selectedIds={[]}
            readOnly
          />
        </AnalyzeCard>
      )}

      {/* 03 — Ce que l'on écarte */}
      <div id="palette-block-excluded" className="scroll-mt-24">
        <AnalyzeCard
          number={4}
          category="Refus assumés"
          title="Ce que l’on écarte, et pourquoi"
          subtitle="Trois espèces refusées : un diagnostic se juge autant à ses exclusions qu’à ses choix."
          index={3}
        >
          {onSiteCount > 0 && (
            <div className="mb-3 rounded-2xl border border-[#d9a441]/60 bg-[#fdf6e6] px-3 py-2 text-[12px] text-[#7a5a1c]">
              <strong>{onSiteCount}</strong> de ces refus {onSiteCount > 1 ? 'sont' : 'est'} déjà
              présent{onSiteCount > 1 ? 's' : ''} sur la propriété : le refus devient une consigne de
              gestion, localisable et corrigeable.
            </div>
          )}
          <div className="space-y-2.5">
            {exclusions.map((e, i) => {
              const pres = excludedPresence.get(excludedKey(e.latin));
              const onSite = (pres?.count ?? 0) > 0;
              const open = mapOpenFor === excludedKey(e.latin);
              return (
                <div
                  key={`${e.latin}-${i}`}
                  className="rounded-2xl border border-[#e2c7c1] bg-[#fdf4f2] p-3"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-[#8c3a2e] text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-serif text-[15px] text-[#7a3126]">{e.fr}</span>
                    <span className="italic text-[12px] text-[#8c3a2e]/70">{e.latin}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-widest text-[#8c3a2e]/60">
                      {onSite
                        ? 'Présente sur site — à gérer'
                        : e.kind === 'principe'
                          ? 'Par principe'
                          : 'Inadaptée au site'}
                    </span>
                  </div>

                  {onSite && pres && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-[#d9a441]/60 bg-[#fdf6e6] p-2">
                      {pres.firstPhoto && (
                        <img
                          src={pres.firstPhoto}
                          alt={e.fr}
                          loading="lazy"
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 text-[11px] leading-snug text-[#7a5a1c]">
                        <div className="font-semibold">
                          ⚠ Présente ici · {pres.count} observation{pres.count > 1 ? 's' : ''}
                          {pres.lastObservedOn && (
                            <span className="font-normal">
                              {' '}
                              · dernière le{' '}
                              {new Date(pres.lastObservedOn).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {pres.matchLevel === 'genus' && (
                          <div className="opacity-80">
                            Genre observé, espèce à confirmer sur le terrain.
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setMapOpenFor(open ? null : excludedKey(e.latin))
                        }
                        className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-[#8c3a2e] text-[#8c3a2e] hover:bg-[#8c3a2e] hover:text-white transition"
                      >
                        {open ? 'Masquer' : 'Situer'}
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={e.why}
                    onChange={(ev) => {
                      const next = exclusions.map((x, j) =>
                        j === i ? { ...x, why: ev.target.value } : x,
                      );
                      palette.setField('excluded', next);
                    }}
                    className="mt-1 w-full bg-transparent text-[12px] leading-snug text-[#5f2c23] outline-none resize-y"
                  />

                  {open && pres && (
                    <ExcludedSpeciesMap
                      proprieteId={proprieteId}
                      latin={e.latin}
                      label={e.fr}
                      occurrences={pres.occurrences}
                      allWaypoints={allWaypoints}
                      center={derivedCenter}
                      onClose={() => setMapOpenFor(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </AnalyzeCard>
      </div>


      {/* 04 — Mise en œuvre */}
      <div id="palette-block-implementation" className="scroll-mt-24">
        <AnalyzeCard
          number={5}
          category="Mise en œuvre"
          title="Quand, comment, et ce qu’on ne fera pas"
          subtitle="Le calendrier se déduit de la texture et de l’humidité relevées à l’étape 2."
          index={4}
        >
          <ol className="space-y-2.5">
            {implementation.map((s, i) => (
              <li
                key={`${s.title}-${i}`}
                className="flex gap-3 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/55 p-3"
              >
                <span className="w-6 h-6 shrink-0 rounded-full bg-[hsl(var(--ds-gold))]/25 text-[#8a6d3b] text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6d3b]">
                    {s.period}
                  </div>
                  <div className="font-serif text-[15px] text-[hsl(var(--ds-forest-deep))]">
                    {s.title}
                  </div>
                  <textarea
                    rows={2}
                    value={s.detail}
                    onChange={(ev) => {
                      const next = implementation.map((x, j) =>
                        j === i ? { ...x, detail: ev.target.value } : x,
                      );
                      palette.setField('implementation', next);
                    }}
                    className="w-full bg-transparent text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/85 outline-none resize-y"
                  />
                </div>
              </li>
            ))}
          </ol>
        </AnalyzeCard>
      </div>

      {/* 05 — Note libre */}
      <section
        id="palette-block-notes"
        className="scroll-mt-24 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6"
      >
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          <Sprout className="w-3 h-3" /> 06 · Note libre
        </div>
        <textarea
          rows={3}
          value={palette.state.notes ?? ''}
          onChange={(e) => palette.setField('notes', e.target.value)}
          placeholder="Contraintes du client, budget, phasage, essences imposées…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </section>

      {/* Sources */}
      <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-5">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          <BookOpen className="w-3 h-3" /> Sources
        </div>
        <ul className="mt-2 space-y-1">
          {PALETTE_SOURCES.map((s) => (
            <li key={s} className="text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/75">
              · {s}
            </li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{zones.length}</span> emplacement
            {zones.length > 1 ? 's' : ''} ·{' '}
            <span className="font-semibold">{selectedTotal}</span> espèce
            {selectedTotal > 1 ? 's' : ''} retenue{selectedTotal > 1 ? 's' : ''}
          </span>
          {palette.completedAt && (
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
              palette.completedAt
                ? 'bg-[hsl(var(--ds-forest-deep))] text-white hover:bg-[hsl(var(--ds-forest))] border border-[hsl(var(--ds-forest))]/40'
                : 'bg-[hsl(var(--ds-forest))]/85 text-white hover:bg-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-forest))]/40'
            }
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            {palette.completedAt
              ? `Palette scellée le ${new Date(palette.completedAt).toLocaleDateString('fr-FR')} · Réenregistrer`
              : 'Sceller la palette'}
          </Button>
        </div>
      </div>

      {printDialogAndPortal}
    </div>
  );
};

export default TabPalette;
