import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import SpeciesName from '@/components/species/SpeciesName';
import type { DescriberAggregate } from '@/hooks/useExplorationBiogeography';

interface Props {
  open: boolean;
  aggregate: DescriberAggregate | null;
  onClose: () => void;
}

const DescriberDrawer: React.FC<Props> = ({ open, aggregate, onClose }) => {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {aggregate && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-rose-500/10 to-transparent">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30 flex items-center justify-center text-2xl shrink-0">
                  ✒️
                </div>
                <div>
                  <SheetTitle className="text-lg italic">{aggregate.name}</SheetTitle>
                  <SheetDescription className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      {aggregate.country && (
                        <span className="inline-flex items-center gap-1">
                          {aggregate.country.flag} {aggregate.country.nameFr}
                        </span>
                      )}
                      {aggregate.birthYear && <span>· né en {aggregate.birthYear}</span>}
                    </div>
                    <div className="text-foreground font-semibold text-sm pt-1">
                      {aggregate.species.length} espèce{aggregate.species.length > 1 ? 's' : ''} décrite{aggregate.species.length > 1 ? 's' : ''} présente{aggregate.species.length > 1 ? 's' : ''}
                    </div>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <ul className="divide-y divide-border/50">
                {aggregate.species.map((sp) => (
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
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DescriberDrawer;
