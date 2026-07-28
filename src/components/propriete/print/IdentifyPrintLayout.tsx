import React from 'react';
import { IdentifySummary } from '@/components/propriete/identify/IdentifySummary';
import { FloraAtlasPrintPlates, floraAtlasPageCount } from '@/components/propriete/identify/print/FloraAtlasPrintPlates';
import type { PropertyFloraState } from '@/hooks/propriete/usePropertyFlora';
import type { SoilLite } from '@/lib/plantIndicatorKb';

interface Props {
  flora: PropertyFloraState;
  soil: SoilLite;
  soilAvailable: boolean;
  completedAt: string | null;
  propertyName?: string;
  proprieteId?: string;
}


/**
 * Maquette A4 dédiée à l'impression « J'identifie la flore en place » (seule).
 * Page 1 : lecture dominante + cortège révélé + somme des indices (8 pôles)
 * Page 2 : concordance sol ↔ flore, narration, notes, sources
 * Pages 3+ : atlas du cortège — 24 vignettes par page
 */
export const IdentifyPrintLayout: React.FC<Props> = ({
  flora,
  soil,
  soilAvailable,
  completedAt,
  propertyName,
  proprieteId,
}) => {
  const atlasPages = floraAtlasPageCount(flora.observed_plants ?? []);
  const total = 3 + atlasPages;

  const Page: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
    <section className="identify-print-page">
      <div className="identify-print-rule" />
      <div className="identify-print-body">{children}</div>
      <footer className="identify-print-foot">
        <span>{propertyName ?? 'Propriété'} · Étape 3 · La flore en place</span>
        <span>
          {index} / {total}
        </span>
      </footer>
    </section>
  );

  const summary = (section: 'p1' | 'p2') => (
    <IdentifySummary
      state={flora}
      soil={soil}
      soilAvailable={soilAvailable}
      completedAt={completedAt}
      propertyName={propertyName}
      onEditBlock={() => {}}
      onReopenAll={() => {}}
      printOnly
      printSection={section}
    />
  );

  return (
    <div className="identify-print-root-wrap">
      <Page index={1}>{summary('p1')}</Page>
      <Page index={2}>{summary('p2')}</Page>
      <FloraAtlasPrintPlates
        observedIds={flora.observed_plants ?? []}
        propertyName={propertyName}
        proprieteId={proprieteId}
        pageClassName="identify-print-page"
      />
    </div>
  );
};

export default IdentifyPrintLayout;
