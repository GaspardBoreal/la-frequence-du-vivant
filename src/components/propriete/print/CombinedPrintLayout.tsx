import React from 'react';
import { ObserveSummary } from '@/components/propriete/observe/ObserveSummary';
import { AnalyzeSummary } from '@/components/propriete/analyze/AnalyzeSummary';
import { PortraitPrintLayout } from '@/components/propriete/portrait/PortraitPrintLayout';
import { PropertyPrintPage } from '@/components/propriete/print/PropertyPrintPage';
import {
  TestMediaPrintPlates,
  testMediaPlateCount,
} from '@/components/propriete/analyze/print/TestMediaPrintPlates';
import type { TestMedia } from '@/hooks/propriete/usePropertyTestMedias';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import type { PropertySoilState } from '@/hooks/propriete/usePropertySoil';
import type { PropertyFloraState } from '@/hooks/propriete/usePropertyFlora';
import type { SoilLite } from '@/lib/plantIndicatorKb';
import { IdentifySummary } from '@/components/propriete/identify/IdentifySummary';
import { SynthesisSummary } from '@/components/propriete/synthesize/SynthesisSummary';
import type { PropertySynthesisState } from '@/hooks/propriete/usePropertySynthesis';
import type { SynthesisModel } from '@/components/propriete/synthesize/synthesisModel';
import { PaletteSummary, type PaletteZoneView } from '@/components/propriete/palette/PaletteSummary';
import type { PaletteExclusion, PalettePlanStep } from '@/hooks/propriete/usePropertyPalette';
import { PalettePlanSchema } from '@/components/propriete/print/PalettePlanSchema';
import { AtelierTablePrint } from '@/components/propriete/print/AtelierTablePrint';
import {
  ChromaticPrintPage,
  hasChromaticPage,
} from '@/components/propriete/print/ChromaticPrintPage';
import {
  OuvrageSheetsPrint,
  ouvrageSheetPageCount,
} from '@/components/propriete/print/OuvragePrintSheet';
import { useProprieteObjets } from '@/hooks/propriete/usePropertyObjets';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import {
  FloraAtlasPrintPlates,
  floraAtlasPageCount,
} from '@/components/propriete/identify/print/FloraAtlasPrintPlates';


interface StationInfo {
  code: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  source?: string;
  department?: string | null;
  region?: string | null;
  elevation?: number | null;
}

interface Props {
  answers: Record<string, string[]>;
  sensorial: Record<string, any>;
  completedAt: string | null;
  propertyName?: string;
  photos: GalleryPhoto[];
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
  parcelles?: ProprieteParcelle[];
  station?: StationInfo | null;
  publicUrl?: string;
  /** Étape 2 — inclus dans le cahier complet lorsque fourni. */
  soil?: PropertySoilState | null;
  soilCompletedAt?: string | null;
  /** Preuves de terrain (photos des tests de sol), imprimées après « Le sol, point par point ». */
  testMedias?: TestMedia[];
  /** Étape 3 — incluse dans le cahier complet lorsque fournie. */
  flora?: PropertyFloraState | null;
  floraCompletedAt?: string | null;
  floraSoil?: SoilLite | null;
  /** Étape 4 — incluse dans le cahier complet lorsque fournie. */
  synthesis?: PropertySynthesisState | null;
  synthesisModel?: SynthesisModel | null;
  synthesisCompletedAt?: string | null;
  /** Étape 5 — incluse dans le cahier complet lorsque fournie. */
  palette?: {
    siteRule: string;
    zones: PaletteZoneView[];
    excluded: PaletteExclusion[];
    implementation: PalettePlanStep[];
    notes?: string | null;
    presence?: Record<string, { count: number; zoneNames?: string[] }>;
  } | null;
  paletteCompletedAt?: string | null;
  /** Emplacements tracés (plan gravé de l'étape 5). */
  propertyZones?: ProprieteZone[];
  /** Espèces retenues dans la palette, par emplacement (croisement fiches ouvrages). */
  zoneSelectedSpecies?: Record<string, string[]>;
  /** Propriété — photos de terrain prioritaires dans l'atlas du cortège. */
  proprieteId?: string;
}


const Divider: React.FC<{
  eyebrow: string;
  title: string;
  sub: string;
  foot: string;
  variant?: 'observe' | 'analyze' | 'identify' | 'synthesize' | 'palette';
}> = ({ eyebrow, title, sub, foot, variant = 'analyze' }) => (
  <section className={`combined-print-divider combined-print-divider--${variant}`}>
    <div className="combined-print-divider-eyebrow">{eyebrow}</div>
    <h2 className="combined-print-divider-title">{title}</h2>
    <div className="combined-print-divider-rule" />
    <div className="combined-print-divider-sub">{sub}</div>
    <div className="combined-print-divider-foot">{foot}</div>
  </section>
);

export const CombinedPrintLayout: React.FC<Props> = ({
  answers,
  sensorial,
  completedAt,
  propertyName,
  photos,
  proprieteVille,
  proprieteAdresse,
  proprieteCodePostal,
  proprieteCenter,
  parcelles = [],
  station,
  publicUrl,
  soil,
  soilCompletedAt,
  testMedias,
  flora,
  floraCompletedAt,
  floraSoil,
  synthesis,
  synthesisModel,
  synthesisCompletedAt,
  palette,
  paletteCompletedAt,
  propertyZones = [],
  zoneSelectedSpecies,
  proprieteId,
}) => {
  const { objets } = useProprieteObjets(proprieteId);

  const withAnalyze = !!soil;
  const plateCount = withAnalyze ? testMediaPlateCount(testMedias) : 0;
  const withIdentify = !!flora && (flora.observed_plants ?? []).length > 0;
  const withSynthesize = !!synthesis && !!synthesisModel;
  const withPalette = !!palette;
  const hasAtelier = propertyZones.length > 0 || objets.length > 0;
  const chromatic = hasChromaticPage(objets);
  const sheetPages = ouvrageSheetPageCount(objets);
  const atelierZones = React.useMemo(
    () => propertyZones.map((z) => ({ id: z.id, nom: z.nom })),
    [propertyZones],
  );
  const atlasCount = withIdentify ? floraAtlasPageCount(flora!.observed_plants ?? []) : 0;

  const identifySoil: SoilLite = floraSoil ?? {};
  const identifySoilAvailable = !!(
    identifySoil.structure ||
    identifySoil.texture ||
    identifySoil.ph != null ||
    (identifySoil.life_signs?.length ?? 0) > 0
  );


  const observeSlot = (
    <>
      <Divider
        eyebrow="Étape 1"
        title="J’observe"
        sub="« Avant de comprendre, il faut regarder longtemps. »"
        foot={`${propertyName ?? 'Propriété'} · Fréquence du Vivant`}
        variant="observe"
      />
      <section className="portrait-print-page combined-print-observe combined-print-observe-first print-break">
        <ObserveSummary
          answers={answers}
          sensorial={sensorial}
          completedAt={completedAt}
          propertyName={propertyName}
          onEditBlock={() => {}}
          onReopenAll={() => {}}
          printOnly
          printSection="first"
        />
      </section>
      <section className="portrait-print-page combined-print-observe combined-print-observe-second">
        <ObserveSummary
          answers={answers}
          sensorial={sensorial}
          completedAt={completedAt}
          propertyName={propertyName}
          onEditBlock={() => {}}
          onReopenAll={() => {}}
          printOnly
          printSection="second"
        />
      </section>

      {withAnalyze && soil && (
        <>
          <Divider
            eyebrow="Étape 2"
            title="J’analyse le sol"
            sub="« La terre ne se raconte qu’à ceux qui la prennent en main. »"
            foot={`${propertyName ?? 'Propriété'} · Fréquence du Vivant`}
            variant="analyze"
          />

          <section className="portrait-print-page combined-print-analyze">
            <AnalyzeSummary
              state={soil}
              completedAt={soilCompletedAt ?? null}
              propertyName={propertyName}
              parcelles={parcelles}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p1"
            />
          </section>
          <section className="portrait-print-page combined-print-analyze combined-print-analyze-second">
            <AnalyzeSummary
              state={soil}
              completedAt={soilCompletedAt ?? null}
              propertyName={propertyName}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p2"
            />
          </section>
          <section className="portrait-print-page combined-print-analyze combined-print-analyze-second">
            <AnalyzeSummary
              state={soil}
              completedAt={soilCompletedAt ?? null}
              propertyName={propertyName}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p3"
            />
          </section>

          <TestMediaPrintPlates medias={testMedias} propertyName={propertyName} />
        </>
      )}

      {withIdentify && flora && (
        <>
          <Divider
            eyebrow="Étape 3"
            title="J’identifie la flore en place"
            sub="« Chaque plante est une phrase : le cortège écrit le sol. »"
            foot={`${propertyName ?? 'Propriété'} · Fréquence du Vivant`}
            variant="identify"
          />

          <section className="portrait-print-page combined-print-identify">
            <IdentifySummary
              state={flora}
              soil={identifySoil}
              soilAvailable={identifySoilAvailable}
              completedAt={floraCompletedAt ?? null}
              propertyName={propertyName}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p1"
            />
          </section>
          <section className="portrait-print-page combined-print-identify combined-print-identify-second">
            <IdentifySummary
              state={flora}
              soil={identifySoil}
              soilAvailable={identifySoilAvailable}
              completedAt={floraCompletedAt ?? null}
              propertyName={propertyName}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p2"
            />
          </section>
          <section className="portrait-print-page combined-print-identify combined-print-identify-second">
            <IdentifySummary
              state={flora}
              soil={identifySoil}
              soilAvailable={identifySoilAvailable}
              completedAt={floraCompletedAt ?? null}
              propertyName={propertyName}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p3"
            />
          </section>

          <FloraAtlasPrintPlates
            observedIds={flora.observed_plants ?? []}
            propertyName={propertyName}
            proprieteId={proprieteId}
            pageClassName="portrait-print-page"
          />
        </>
      )}

      {withSynthesize && synthesis && synthesisModel && (
        <>
          <Divider
            eyebrow="Étape 4"
            title="Je synthétise"
            sub="« Tout ce qui a été vu, touché et nommé tient désormais en un seul portrait. »"
            foot={`${propertyName ?? 'Propriété'} · Fréquence du Vivant`}
            variant="synthesize"
          />

          <section className="portrait-print-page combined-print-synthesize">
            <SynthesisSummary
              state={synthesis}
              model={synthesisModel}
              completedAt={synthesisCompletedAt ?? null}
              propertyName={propertyName}
              commune={proprieteVille}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p1"
            />
          </section>
          <section className="portrait-print-page combined-print-synthesize combined-print-synthesize-second">
            <SynthesisSummary
              state={synthesis}
              model={synthesisModel}
              completedAt={synthesisCompletedAt ?? null}
              propertyName={propertyName}
              commune={proprieteVille}
              onEditBlock={() => {}}
              onReopenAll={() => {}}
              printOnly
              printSection="p2"
            />
          </section>
        </>
      )}

      {withPalette && palette && (
        <>
          <Divider
            eyebrow="Étape 5"
            title="Palette végétale"
            sub="« On ne plante pas ce que l’on aime : on plante ce que le lieu accepte. »"
            foot={`${propertyName ?? 'Propriété'} · Fréquence du Vivant`}
            variant="palette"
          />

          <section className="portrait-print-page combined-print-synthesize">
            <PaletteSummary
              siteRule={palette.siteRule}
              zones={palette.zones}
              excluded={palette.excluded}
              implementation={palette.implementation}
              notes={palette.notes}
              presence={palette.presence}
              completedAt={paletteCompletedAt ?? null}
              propertyName={propertyName}
              commune={proprieteVille}
              printOnly
              printSection="p1"
            />
          </section>

          {hasAtelier && (
            <>
              <section className="portrait-print-page combined-print-palette">
                <PalettePlanSchema
                  parcelles={parcelles}
                  zones={propertyZones}
                  objets={objets}
                  propertyName={propertyName}
                  commune={proprieteVille}
                  completedAt={paletteCompletedAt ?? null}
                />
              </section>
              <section className="portrait-print-page combined-print-palette">
                <AtelierTablePrint
                  objets={objets}
                  zones={atelierZones}
                  propertyName={propertyName}
                  notes={palette.notes}
                />
              </section>
            </>
          )}

          {chromatic && (
            <section className="portrait-print-page combined-print-palette">
              <ChromaticPrintPage objets={objets} propertyName={propertyName} />
            </section>
          )}



          {sheetPages > 0 && (
            <OuvrageSheetsPrint
              objets={objets}
              zones={atelierZones}
              zoneSelectedSpecies={zoneSelectedSpecies}
              propertyName={propertyName}
              pageClassName="portrait-print-page combined-print-palette"
            />
          )}

          <section className="portrait-print-page combined-print-synthesize combined-print-synthesize-second">
            <PaletteSummary
              siteRule={palette.siteRule}
              zones={palette.zones}
              excluded={palette.excluded}
              implementation={palette.implementation}
              notes={palette.notes}
              presence={palette.presence}
              completedAt={paletteCompletedAt ?? null}
              propertyName={propertyName}
              commune={proprieteVille}
              printOnly
              printSection="p2"
            />
          </section>
        </>
      )}


    </>
  );

  // Page « Propriété » insérée juste après le sommaire visuel (page 3)
  const renderPropertyPage = (pageNumber: number, totalPages: number) => (
    <PropertyPrintPage
      nom={propertyName ?? ''}
      adresse={proprieteAdresse}
      ville={proprieteVille}
      codePostal={proprieteCodePostal}
      center={proprieteCenter}
      parcelles={parcelles}
      station={station}
      editionDate={new Date()}
      pageNumber={pageNumber}
      totalPages={totalPages}
    />
  );

  return (
    <div className="combined-print-root">
      <PortraitPrintLayout
        photos={photos}
        proprieteNom={propertyName ?? ''}
        proprieteVille={proprieteVille}
        publicUrl={publicUrl}
        coverVariant="hero-photo"
        insertAfterToc={renderPropertyPage}
        insertedAfterTocPageCount={1}
        insertBeforeColophon={observeSlot}
        insertedPageCount={
          (withAnalyze ? 7 : 3) +
          plateCount +
          (withIdentify ? 3 + atlasCount : 0) +
          (withSynthesize ? 3 : 0) +
          (withPalette ? 3 + (hasAtelier ? 2 : 0) + sheetPages : 0)
        }

      />
    </div>
  );
};
