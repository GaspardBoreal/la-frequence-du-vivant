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
  /** Propriété — photos de terrain prioritaires dans l'atlas du cortège. */
  proprieteId?: string;
}

const Divider: React.FC<{ eyebrow: string; title: string; sub: string; foot: string; variant?: 'observe' | 'analyze' | 'identify' }> = ({
  eyebrow,
  title,
  sub,
  foot,
  variant = 'analyze',
}) => (
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
  proprieteId,
}) => {

  const withAnalyze = !!soil;
  const plateCount = withAnalyze ? testMediaPlateCount(testMedias) : 0;
  const withIdentify = !!flora && (flora.observed_plants ?? []).length > 0;
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

          <FloraAtlasPrintPlates
            observedIds={flora.observed_plants ?? []}
            propertyName={propertyName}
            proprieteId={proprieteId}
            pageClassName="portrait-print-page"
          />
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
          (withAnalyze ? 7 : 3) + plateCount + (withIdentify ? 3 + atlasCount : 0)
        }
      />
    </div>
  );
};
