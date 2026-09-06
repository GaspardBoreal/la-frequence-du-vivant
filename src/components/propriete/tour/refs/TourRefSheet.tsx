import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { openSampleCore } from '@/components/propriete/analyze/sample/sampleDrawerStore';
import { useTourRefDrawer, closeTourRef } from './tourRefStore';
import { useTourRefIndex } from './useTourRefIndex';
import RefSpeciesPanel from './RefSpeciesPanel';
import RefZonePanel from './RefZonePanel';
import RefObjetPanel from './RefObjetPanel';
import RefCapteurPanel from './RefCapteurPanel';

const TITLES = {
  species: 'Espèce',
  sample: 'Prélèvement',
  zone: 'Secteur',
  objet: 'Ouvrage',
  capteur: 'Sonde',
} as const;

/**
 * Panneau bas ouvert depuis une action du tour : on consulte la ressource
 * sans jamais quitter la fiche du tour.
 */
export const TourRefSheet: React.FC = () => {
  const { open, ref } = useTourRefDrawer();
  const index = useTourRefIndex();

  // Les prélèvements ont déjà leur fiche « carotte » : on la réutilise telle quelle.
  React.useEffect(() => {
    if (!open || ref?.kind !== 'sample') return;
    const sample =
      index.samples.find((s) => s.id === ref.id) ??
      index.samples.find((s) => ref.label.toUpperCase().endsWith(s.label.toUpperCase()));
    closeTourRef();
    if (sample) openSampleCore(sample.id, index.samples, index.proprieteId);
  }, [open, ref, index]);

  if (!ref || ref.kind === 'sample') return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closeTourRef()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="text-left">
          <SheetTitle className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {TITLES[ref.kind]}
          </SheetTitle>
        </SheetHeader>
        <div className="pb-6 pt-3">
          {ref.kind === 'species' && <RefSpeciesPanel refItem={ref} index={index} />}
          {ref.kind === 'zone' && <RefZonePanel refItem={ref} index={index} />}
          {ref.kind === 'objet' && <RefObjetPanel refItem={ref} index={index} />}
          {ref.kind === 'capteur' && <RefCapteurPanel refItem={ref} index={index} />}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TourRefSheet;
