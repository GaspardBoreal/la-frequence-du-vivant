import React from 'react';
import { MapPin } from 'lucide-react';
import type { OriginAggregate, DescriberAggregate } from '@/hooks/useExplorationBiogeography';

interface Props {
  origins: OriginAggregate[];
  describers: DescriberAggregate[]; // kept for API compat, not rendered (see DescribersGallery)
  onOpenCountry: (iso: string) => void;
  onOpenDescriber: (name: string) => void;
}

const OriginsRankings: React.FC<Props> = ({ origins, onOpenCountry }) => {
  if (!origins.length) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-amber-500" />
        <h4 className="text-sm font-semibold">
          Top pays d'origine ·{' '}
          <span className="text-muted-foreground font-normal">{origins.length}</span>
        </h4>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {origins.slice(0, 16).map((o) => {
          const max = origins[0]?.species.length || 1;
          const pct = (o.species.length / max) * 100;
          return (
            <li key={o.country.code}>
              <button
                onClick={() => onOpenCountry(o.country.code)}
                className="w-full group flex items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <span className="text-base">{o.country.flag}</span>
                <span className="text-xs font-medium flex-1 truncate">
                  {o.country.nameFr}
                  {o.inferred && (
                    <span className="ml-1 text-[9px] text-muted-foreground/70 align-super" title="Origine déduite (type locality non confirmée par GBIF)">~</span>
                  )}
                </span>
                <div className="relative h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground group-hover:text-foreground w-6 text-right">{o.species.length}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OriginsRankings;
