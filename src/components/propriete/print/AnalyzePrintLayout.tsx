import React from 'react';
import { AnalyzeSummary } from '@/components/propriete/analyze/AnalyzeSummary';
import type { PropertySoilState } from '@/hooks/propriete/usePropertySoil';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';

interface Props {
  soil: PropertySoilState;
  completedAt: string | null;
  propertyName?: string;
  parcelles?: ProprieteParcelle[];
}

/**
 * Maquette A4 dédiée à l'impression « J'analyse le sol » (seul).
 * Page 1 : plan + lecture dominante + 01. État du terrain
 * Page 2 : 02 → 06 (lectures agronomiques)
 * Page 3 : 07. Registre des prélèvements (+ 08. Note de synthèse)
 */
export const AnalyzePrintLayout: React.FC<Props> = ({
  soil,
  completedAt,
  propertyName,
  parcelles = [],
}) => {
  const hasRegister = (soil.samples ?? []).length > 0;
  const total = hasRegister ? 3 : 2;

  const Page: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
    <section className="analyze-print-page">
      <div className="analyze-print-rule" />
      <div className="analyze-print-body">{children}</div>
      <footer className="analyze-print-foot">
        <span>{propertyName ?? 'Propriété'} · Étape 2 · Analyse du sol</span>
        <span>
          {index} / {total}
        </span>
      </footer>
    </section>
  );

  const summary = (section: 'p1' | 'p2' | 'p3') => (
    <AnalyzeSummary
      state={soil}
      completedAt={completedAt}
      propertyName={propertyName}
      parcelles={parcelles}
      onEditBlock={() => {}}
      onReopenAll={() => {}}
      printOnly
      printSection={section}
    />
  );

  return (
    <div className="analyze-print-root-wrap">
      <Page index={1}>{summary('p1')}</Page>
      <Page index={2}>{summary('p2')}</Page>
      {hasRegister && <Page index={3}>{summary('p3')}</Page>}
    </div>
  );
};
