import React from 'react';
import { SynthesisSummary } from '@/components/propriete/synthesize/SynthesisSummary';
import type { PropertySynthesisState } from '@/hooks/propriete/usePropertySynthesis';
import type { SynthesisModel } from '@/components/propriete/synthesize/synthesisModel';

interface Props {
  state: PropertySynthesisState;
  model: SynthesisModel;
  completedAt: string | null;
  propertyName?: string;
  commune?: string | null;
}

/**
 * Maquette A4 « Je synthétise » (seul), en deux pages :
 * Page 1 · page de garde éditoriale : carte d'identité écologique + portrait du site
 * Page 2 · la synthèse : atouts, contraintes, vigilances, note libre et sources
 */
export const SynthesizePrintLayout: React.FC<Props> = ({
  state,
  model,
  completedAt,
  propertyName,
  commune,
}) => {
  const Page: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
    <section className="synthesize-print-page">
      <div className="synthesize-print-rule" />
      <div className="synthesize-print-body">{children}</div>
      <footer className="synthesize-print-foot">
        <span>{propertyName ?? 'Propriété'} · Étape 4 · Je synthétise</span>
        <span>{index} / 2</span>
      </footer>
    </section>
  );

  const summary = (section: 'p1' | 'p2') => (
    <SynthesisSummary
      state={state}
      model={model}
      completedAt={completedAt}
      propertyName={propertyName}
      commune={commune}
      onEditBlock={() => {}}
      onReopenAll={() => {}}
      printOnly
      printSection={section}
    />
  );

  return (
    <div className="synthesize-print-root-wrap">
      <Page index={1}>{summary('p1')}</Page>
      <Page index={2}>{summary('p2')}</Page>
    </div>
  );
};
