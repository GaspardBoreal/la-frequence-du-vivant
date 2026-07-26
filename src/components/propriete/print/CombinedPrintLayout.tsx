import React from 'react';
import { ObserveSummary } from '@/components/propriete/observe/ObserveSummary';
import { AnalyzeSummary } from '@/components/propriete/analyze/AnalyzeSummary';
import { PortraitPrintLayout } from '@/components/propriete/portrait/PortraitPrintLayout';
import { PropertyPrintPage } from '@/components/propriete/print/PropertyPrintPage';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import type { PropertySoilState } from '@/hooks/propriete/usePropertySoil';

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
}

const Divider: React.FC<{ eyebrow: string; title: string; sub: string; foot: string }> = ({
  eyebrow,
  title,
  sub,
  foot,
}) => (
  <section className="combined-print-divider">
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
}) => {
  const withAnalyze = !!soil;

  const observeSlot = (
    <>
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
              printSection="first"
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
              printSection="second"
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
        insertedPageCount={withAnalyze ? 5 : 2}
      />
    </div>
  );
};
