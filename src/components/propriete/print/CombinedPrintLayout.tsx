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

const fmtLong = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export const CombinedPrintLayout: React.FC<Props> = ({
  answers,
  sensorial,
  completedAt,
  propertyName,
  photos,
  proprieteVille,
  publicUrl,
}) => {
  const now = new Date();
  return (
    <div className="combined-print-root">
      {/* Section 1 — J'observe */}
      <section className="combined-print-observe">
        <ObserveSummary
          answers={answers}
          sensorial={sensorial}
          completedAt={completedAt}
          propertyName={propertyName}
          onEditBlock={() => {}}
          onReopenAll={() => {}}
          printOnly
        />
      </section>

      {/* Page intercalaire — Portrait */}
      <section className="combined-print-divider">
        <div className="combined-print-divider-eyebrow">Deuxième partie</div>
        <h1 className="combined-print-divider-title">Portrait du site</h1>
        <div className="combined-print-divider-rule" />
        <div className="combined-print-divider-sub">
          {propertyName ?? 'Cette propriété'}
          {proprieteVille ? ` · ${proprieteVille}` : ''}
        </div>
        <div className="combined-print-divider-foot">Édité le {fmtLong(now)}</div>
      </section>

      {/* Section 2 — Portrait (cahier photo complet) */}
      <PortraitPrintLayout
        photos={photos}
        proprieteNom={propertyName ?? ''}
        proprieteVille={proprieteVille}
        publicUrl={publicUrl}
      />
    </div>
  );
};
