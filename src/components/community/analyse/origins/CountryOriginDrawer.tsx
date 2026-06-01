import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { OriginAggregate, BiogeographyAggregates } from '@/hooks/useExplorationBiogeography';
import { ScrollArea } from '@/components/ui/scroll-area';
import SpeciesName from '@/components/species/SpeciesName';

interface Props {
  open: boolean;
  aggregate: OriginAggregate | null;
  biogeography: BiogeographyAggregates;
  onClose: () => void;
}

const CountryOriginDrawer: React.FC<Props> = ({ open, aggregate, biogeography, onClose }) => {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {aggregate && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{aggregate.country.flag}</span>
                <div>
                  <SheetTitle className="text-xl">{aggregate.country.nameFr}</SheetTitle>
                  <SheetDescription>
                    <span className="text-foreground font-semibold">{aggregate.species.length}</span> espèce{aggregate.species.length > 1 ? 's' : ''} originaire{aggregate.species.length > 1 ? 's' : ''} de ce territoire
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <ul className="divide-y divide-border/50">
                {aggregate.species.map((sp) => {
                  const row = biogeography.byScientificName.get(sp.scientificName || '');
                  return (
                    <li key={sp.scientificName} className="px-6 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-3">
                        {sp.photos?.[0] && (
                          <img src={sp.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" loading="lazy" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            <SpeciesName scientificName={sp.scientificName} commonName={sp.commonName} />
                          </div>
                          <div className="text-[11px] text-muted-foreground italic mt-0.5">{sp.scientificName}</div>
                          {row?.describer_name && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                              ✒️ {row.describer_name}{row.describer_year ? `, ${row.describer_year}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CountryOriginDrawer;
