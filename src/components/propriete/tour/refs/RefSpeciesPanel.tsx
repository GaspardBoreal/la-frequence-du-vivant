import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { SpeciesThumb } from '@/components/species/SpeciesThumb';
import { SpeciesName } from '@/components/species/SpeciesName';
import { speciesLatinBase } from '@/lib/speciesLatinBase';
import { normRef, type TourRef } from './types';
import type { TourRefIndex } from './useTourRefIndex';
import SpeciesPhotoViewer from './SpeciesPhotoViewer';

const RefSpeciesPanel: React.FC<{ refItem: TourRef; index: TourRefIndex }> = ({ refItem, index }) => {
  const latin = refItem.latin || refItem.label;
  const sp =
    index.speciesByLatin.get(normRef(latin)) ||
    index.species.find((s) => normRef(s.commonName || '') === normRef(refItem.label));

  const scientific = sp?.scientificName || latin;
  const photos = sp?.photos?.filter(Boolean) ?? [];
  const photo = photos[0];
  const [zoomIndex, setZoomIndex] = React.useState<number | null>(null);

  // « Famille » vaut parfois un identifiant iNaturalist numérique : on le masque.
  const family = sp?.family && !/^\d+$/.test(sp.family.trim()) ? sp.family : null;
  const lastObserved = sp?.lastObserved || null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={!photo}
          onClick={() => photo && setZoomIndex(0)}
          aria-label={photo ? 'Agrandir la photo' : undefined}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default enabled:cursor-zoom-in"
        >
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
        </button>
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
              {lastObserved ? new Date(lastObserved).toLocaleDateString('fr-FR') : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">date d'observation</div>
          </div>
          {family && (
            <div className="col-span-2 rounded-lg border border-border bg-muted/40 p-2.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Famille</div>
              <div className="font-semibold">{family}</div>
            </div>
          )}
        </div>
      )}

      {!sp && (
        <p className="text-sm text-muted-foreground">
          Cette espèce n'a pas encore été relevée sur le lieu : le tour vous invite à la chercher.
        </p>
      )}

      {zoomIndex !== null && photo && (
        <SpeciesPhotoViewer
          photos={photos}
          index={zoomIndex}
          alt={sp?.commonName || scientific}
          onIndexChange={setZoomIndex}
          onClose={() => setZoomIndex(null)}
        />
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
