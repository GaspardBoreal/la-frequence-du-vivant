import React from 'react';
import { ObserveSummary } from '@/components/propriete/observe/ObserveSummary';
import { PortraitPrintLayout } from '@/components/propriete/portrait/PortraitPrintLayout';
import { PropertyPrintPage } from '@/components/propriete/print/PropertyPrintPage';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';

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
}

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
}) => {
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
        insertedPageCount={2}
      />
    </div>
  );
};
