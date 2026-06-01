import React from 'react';
import { MapPin, Feather } from 'lucide-react';
import type { OriginAggregate, DescriberAggregate } from '@/hooks/useExplorationBiogeography';

interface Props {
  origins: OriginAggregate[];
  describers: DescriberAggregate[];
  onOpenCountry: (iso: string) => void;
  onOpenDescriber: (name: string) => void;
}

const OriginsRankings: React.FC<Props> = ({ origins, describers, onOpenCountry, onOpenDescriber }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold">Top pays d'origine</h4>
        </div>
        {origins.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucune donnée d'origine disponible pour le moment.</p>
        )}
        <ul className="space-y-1.5">
          {origins.slice(0, 12).map((o) => {
            const max = origins[0]?.species.length || 1;
            const pct = (o.species.length / max) * 100;
            return (
              <li key={o.country.code}>
                <button
                  onClick={() => onOpenCountry(o.country.code)}
                  className="w-full group flex items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <span className="text-base">{o.country.flag}</span>
                  <span className="text-xs font-medium flex-1 truncate">{o.country.nameFr}</span>
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

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Feather className="w-4 h-4 text-rose-500" />
          <h4 className="text-sm font-semibold">Descripteurs historiques</h4>
        </div>
        {describers.length === 0 && (
          <p className="text-xs text-muted-foreground">Pas encore de descripteur identifié.</p>
        )}
        <ul className="space-y-1.5">
          {describers.slice(0, 12).map((d) => (
            <li key={d.name}>
              <button
                onClick={() => onOpenDescriber(d.name)}
                className="w-full group flex items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
              >
                <span className="text-base">✒️</span>
                {d.country && <span className="text-sm">{d.country.flag}</span>}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium italic truncate">{d.name}</div>
                  {d.year && <div className="text-[10px] text-muted-foreground">{d.year}</div>}
                </div>
                <span className="text-xs tabular-nums text-muted-foreground group-hover:text-foreground">{d.species.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OriginsRankings;
