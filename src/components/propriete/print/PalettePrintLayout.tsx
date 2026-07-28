import React from 'react';
import { PaletteSummary, type PaletteZoneView } from '@/components/propriete/palette/PaletteSummary';
import type {
  PaletteExclusion,
  PalettePlanStep,
} from '@/hooks/propriete/usePropertyPalette';

interface Props {
  siteRule: string;
  zones: PaletteZoneView[];
  excluded: PaletteExclusion[];
  implementation: PalettePlanStep[];
  notes?: string | null;
  presence?: Record<string, { count: number; zoneNames?: string[] }>;
  completedAt: string | null;
  propertyName?: string;
  commune?: string | null;
}

/**
 * Maquette A4 « Palette végétale » (seule), en deux pages :
 * Page 1 · la règle du site + une palette par emplacement
 * Page 2 · ce que l'on écarte, la mise en œuvre et les sources
 */
export const PalettePrintLayout: React.FC<Props> = ({
  siteRule,
  zones,
  excluded,
  implementation,
  notes,
  presence,
  completedAt,
  propertyName,
  commune,
}) => {
  const Page: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
    <section className="synthesize-print-page">
      <div className="synthesize-print-rule" />
      <div className="synthesize-print-body">{children}</div>
      <footer className="synthesize-print-foot">
        <span>{propertyName ?? 'Propriété'} · Étape 5 · Palette végétale</span>
        <span>{index} / 2</span>
      </footer>
    </section>
  );

  const summary = (section: 'p1' | 'p2') => (
    <PaletteSummary
      siteRule={siteRule}
      zones={zones}
      excluded={excluded}
      implementation={implementation}
      notes={notes}
      presence={presence}
      completedAt={completedAt}
      propertyName={propertyName}
      commune={commune}
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

export default PalettePrintLayout;
