import React from 'react';
import { Loader2, Users, ExternalLink, MapPin } from 'lucide-react';
import type { SpeciesObserver, ObserverSource } from '@/hooks/useSpeciesObservers';

interface Props {
  observers: SpeciesObserver[];
  isLoading: boolean;
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const initials = (full: string) =>
  full
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('');

const sourceMeta: Record<ObserverSource, { label: string; chip: string }> = {
  inaturalist: { label: 'iNaturalist', chip: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  ebird: { label: 'eBird', chip: 'bg-sky-500/20 text-sky-200 border-sky-400/30' },
  gbif: { label: 'GBIF', chip: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  other: { label: 'Source citoyenne', chip: 'bg-white/10 text-white/70 border-white/20' },
};

const SpeciesObserversTab: React.FC<Props> = ({ observers, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (!observers.length) {
    return (
      <div className="text-center py-8 text-white/50 space-y-2">
        <Users className="w-8 h-8 mx-auto opacity-30" />
        <p className="text-xs max-w-xs mx-auto">
          Aucun observateur citoyen (iNaturalist, eBird, GBIF) n'a encore rapporté cette
          espèce dans le périmètre de cet événement.
        </p>
      </div>
    );
  }

  // Agrégation par observateur (un même contributeur peut avoir plusieurs obs.)
  const grouped = observers.reduce<Record<string, SpeciesObserver[]>>((acc, o) => {
    (acc[o.observerName] ||= []).push(o);
    return acc;
  }, {});
  const entries = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-white/50 px-0.5">
        {entries.length} observateur{entries.length > 1 ? 's' : ''} citoyen{entries.length > 1 ? 's' : ''} ·{' '}
        {observers.length} attribution{observers.length > 1 ? 's' : ''}
      </p>
      <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
        {entries.map(([name, items]) => {
          const first = items[0];
          const meta = sourceMeta[first.source];
          return (
            <li
              key={name}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-100 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials(name) || '·'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-white truncate">{name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${meta.chip}`}>
                    {meta.label}
                  </span>
                  {items.length > 1 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/20">
                      {items.length} obs.
                    </span>
                  )}
                </div>
                {first.observerInstitution && (
                  <p className="text-[10px] text-white/40 truncate">{first.observerInstitution}</p>
                )}
                {first.locationName && (
                  <p className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{first.locationName}</span>
                  </p>
                )}
                {first.observationDate && (
                  <p className="text-[10px] text-white/40 mt-0.5">{formatDate(first.observationDate)}</p>
                )}
              </div>

              {first.originalUrl && (
                <a
                  href={first.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
                  title="Voir l'observation source"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SpeciesObserversTab;
