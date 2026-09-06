import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { SpeciesThumb } from '@/components/species/SpeciesThumb';
import { SpeciesName } from '@/components/species/SpeciesName';
import { speciesLatinBase } from '@/lib/speciesLatinBase';
import { normRef, type TourRef } from './types';
import type { TourRefIndex } from './useTourRefIndex';

const RefSpeciesPanel: React.FC<{ refItem: TourRef; index: TourRefIndex }> = ({ refItem, index }) => {
  const latin = refItem.latin || refItem.label;
  const sp =
    index.speciesByLatin.get(normRef(latin)) ||
    index.species.find((s) => normRef(s.commonName || '') === normRef(refItem.label));

  const scientific = sp?.scientificName || latin;
  const photo = sp?.photos?.[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          {photo ? (
            <img src={photo} alt={sp?.commonName || scientific} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <SpeciesThumb
              scientificName={speciesLatinBase(scientific)}
              commonName={sp?.commonName || refItem.label}
              size="lg"
              className="!h-full !w-full !rounded-none [&_img]:!h-full [&_img]:!w-full"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <SpeciesName
            scientificName={scientific}
            commonName={sp?.commonName || refItem.label}
            showScientific
            size="lg"
          />
          {sp && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <CheckCircle2 className="h-3 w-3" /> Déjà observée ici
            </span>
          )}
        </div>
      </div>

      {sp && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-border bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Observations</div>
            <div className="font-semibold">{sp.observations}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Dernière fois</div>
            <div className="font-semibold">
              {sp.lastSeen ? new Date(sp.lastSeen).toLocaleDateString('fr-FR') : '—'}
            </div>
          </div>
          {sp.family && (
            <div className="col-span-2 rounded-lg border border-border bg-muted/40 p-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Famille</div>
              <div className="font-semibold">{sp.family}</div>
            </div>
          )}
        </div>
      )}

      {!sp && (
        <p className="text-sm text-muted-foreground">
          Cette espèce n'a pas encore été relevée sur le lieu : le tour vous invite à la chercher.
        </p>
      )}

      <a
        href={`https://www.inaturalist.org/search?q=${encodeURIComponent(speciesLatinBase(scientific))}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
      >
        Ouvrir la fiche complète <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
};

export default RefSpeciesPanel;
