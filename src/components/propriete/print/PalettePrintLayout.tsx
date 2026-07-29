import React from 'react';
import { PaletteSummary, type PaletteZoneView } from '@/components/propriete/palette/PaletteSummary';
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
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
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
  /** Propriété — ouvrages de l'Atelier, plan gravé et fiches conseils. */
  proprieteId?: string;
  parcelles?: ProprieteParcelle[];
  propertyZones?: ProprieteZone[];
  zoneSelectedSpecies?: Record<string, string[]>;
}

/**
 * Maquette A4 « Palette végétale » (seule) :
 * 1 · couverture d'étape
 * 2 · la règle du site + une palette par emplacement
 * 3 · le plan gravé (emplacements & ouvrages)
 * 4 · la table de l'Atelier (métrés, coûts, bilan)
 * 5..n · fiches conseils par type d'ouvrage
 * n+1 · ce que l'on écarte, la mise en œuvre et les sources
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
  proprieteId,
  parcelles = [],
  propertyZones = [],
  zoneSelectedSpecies,
}) => {
  const { objets } = useProprieteObjets(proprieteId);

  const hasAtelier = propertyZones.length > 0 || objets.length > 0;
  const chromatic = hasChromaticPage(objets);
  const sheetPages = ouvrageSheetPageCount(objets);
  const total = 2 + (hasAtelier ? 2 : 0) + (chromatic ? 1 : 0) + sheetPages + 1;

  const Foot: React.FC<{ index: number }> = ({ index }) => (
    <footer className="synthesize-print-foot">
      <span>{propertyName ?? 'Propriété'} · Étape 5 · Palette végétale</span>
      <span>
        {index} / {total}
      </span>
    </footer>
  );

  const Page: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
    <section className="synthesize-print-page">
      <div className="synthesize-print-rule" />
      <div className="synthesize-print-body">{children}</div>
      <Foot index={index} />
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

  let page = 1;
  const atelierZones = propertyZones.map((z) => ({ id: z.id, nom: z.nom }));

  return (
    <div className="synthesize-print-root-wrap">
      {/* Couverture d'étape */}
      <section className="combined-print-divider combined-print-divider--palette">
        <div className="combined-print-divider-eyebrow">Étape 5 / 5</div>
        <h2 className="combined-print-divider-title">Palette végétale</h2>
        <div className="combined-print-divider-rule" />
        <div className="combined-print-divider-sub">
          « On ne plante pas ce que l’on aime : on plante ce que le lieu accepte. »
        </div>
        <div className="combined-print-divider-foot">
          {propertyName ?? 'Propriété'}
          {commune ? ` · ${commune}` : ''} · Fréquence du Vivant
          {completedAt ? ` · scellée le ${new Date(completedAt).toLocaleDateString('fr-FR')}` : ''}
        </div>
      </section>

      <Page index={page++}>{summary('p1')}</Page>

      {hasAtelier && (
        <>
          <Page index={page++}>
            <PalettePlanSchema
              parcelles={parcelles}
              zones={propertyZones}
              objets={objets}
              propertyName={propertyName}
              commune={commune}
              completedAt={completedAt}
            />
          </Page>
          <Page index={page++}>
            <AtelierTablePrint
              objets={objets}
              zones={atelierZones}
              propertyName={propertyName}
              notes={notes}
            />
          </Page>
        </>
      )}

      {chromatic && (
        <Page index={page++}>
          <ChromaticPrintPage objets={objets} propertyName={propertyName} />
        </Page>
      )}

      {sheetPages > 0 && (
        <OuvrageSheetsPrint
          objets={objets}
          zones={atelierZones}
          zoneSelectedSpecies={zoneSelectedSpecies}
          propertyName={propertyName}
          pageClassName="synthesize-print-page"
          renderFoot={(pi) => <Foot index={(hasAtelier ? 4 : 2) + (chromatic ? 1 : 0) + pi} />}
        />

      )}

      <Page index={total}>{summary('p2')}</Page>
    </div>
  );
};

export default PalettePrintLayout;
