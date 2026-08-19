import React from 'react';
import { CheckCircle2, ExternalLink, Leaf } from 'lucide-react';
import type { UsageRow } from '@/hooks/iot/useIotAnalyses';
import type { InatTaxonThumb } from '@/hooks/propriete/useInatThumbs';
import { speciesLatinBase } from '@/lib/speciesLatinBase';

/**
 * Une espèce proposée : photo iNaturalist, note d'adéquation, raison mesurée,
 * et la mention « déjà présente » quand elle pousse ou est déjà retenue ici.
 */
const SpeciesTile: React.FC<{
  row: UsageRow;
  thumb?: InatTaxonThumb;
  onSite?: boolean;
}> = ({ row, thumb, onSite }) => {
  const href = thumb?.taxonId
    ? `https://www.inaturalist.org/taxa/${thumb.taxonId}`
    : `https://www.inaturalist.org/search?q=${encodeURIComponent(speciesLatinBase(row.latin))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group relative flex gap-3 overflow-hidden rounded-2xl border border-border/60 bg-background/60 p-2.5 transition hover:border-primary/50 hover:bg-background"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {thumb?.photoUrl ? (
          <img
            src={thumb.photoUrl}
            alt={row.fr}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Leaf className="h-5 w-5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium leading-tight">{row.fr}</div>
            <div className="truncate text-[11px] italic text-muted-foreground">{row.latin}</div>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {row.fit}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{row.why}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {onSite && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Déjà présente
            </span>
          )}
          {row.vegetalLocal && (
            <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Végétal local
            </span>
          )}
          <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
};

export default SpeciesTile;
