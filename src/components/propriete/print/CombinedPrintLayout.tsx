import React from 'react';
import { ObserveSummary } from '@/components/propriete/observe/ObserveSummary';
import { PortraitPrintLayout } from '@/components/propriete/portrait/PortraitPrintLayout';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  answers: Record<string, string[]>;
  sensorial: Record<string, any>;
  completedAt: string | null;
  propertyName?: string;
  photos: GalleryPhoto[];
  proprieteVille?: string | null;
  publicUrl?: string;
}

export const CombinedPrintLayout: React.FC<Props> = ({
  answers,
  sensorial,
  completedAt,
  propertyName,
  photos,
  proprieteVille,
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

  return (
    <div className="combined-print-root">
      <PortraitPrintLayout
        photos={photos}
        proprieteNom={propertyName ?? ''}
        proprieteVille={proprieteVille}
        publicUrl={publicUrl}
        coverVariant="hero-photo"
        insertBeforeColophon={observeSlot}
        insertedPageCount={2}
      />
    </div>
  );
};
