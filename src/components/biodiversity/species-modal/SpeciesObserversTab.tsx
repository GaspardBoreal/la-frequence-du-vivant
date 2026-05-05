import React from 'react';
import { Loader2, Users, ImageIcon } from 'lucide-react';
import type { SpeciesObserver } from '@/hooks/useSpeciesObservers';

interface Props {
  observers: SpeciesObserver[];
  isLoading: boolean;
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const initials = (full: string) =>
  full
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('');

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
        <p className="text-xs">
          Aucun marcheur n'a encore enregistré d'observation pour cette espèce sur cet
          événement.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
      {observers.map((o, i) => (
        <li
          key={`${o.marcheurId}-${o.marcheId}-${i}`}
          className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
        >
          {o.avatarUrl ? (
            <img
              src={o.avatarUrl}
              alt={o.fullName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/30 text-emerald-100 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials(o.fullName) || '·'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{o.fullName}</p>
            <p className="text-xs text-white/60 truncate">
              {o.marcheName}
              {o.ville && o.marcheName !== o.ville ? ` · ${o.ville}` : ''}
            </p>
            {o.observationDate && (
              <p className="text-[10px] text-white/40 mt-0.5">{formatDate(o.observationDate)}</p>
            )}
          </div>

          {o.photoUrl && (
            <a
              href={o.photoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-md overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center"
              title="Voir la photo de l'observation"
            >
              <img
                src={o.photoUrl}
                alt="observation"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <ImageIcon className="w-3.5 h-3.5 text-white/40" />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
};

export default SpeciesObserversTab;
