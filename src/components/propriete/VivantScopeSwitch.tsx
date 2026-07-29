import React from 'react';
import { Landmark, Globe2 } from 'lucide-react';
import { useVivantScope, type VivantScope } from '@/contexts/ProprieteVivantScopeContext';

interface Props {
  /** Compteurs optionnels affichés dans chaque pastille. */
  counts?: { cadastre: number | null; all: number };
  /** `panel` = panneau Calques de l'Atelier, `inline` = bandeau de carte. */
  variant?: 'panel' | 'inline';
  className?: string;
}

const OPTIONS: Array<{ key: VivantScope; label: string; icon: React.ElementType; hint: string }> = [
  {
    key: 'cadastre',
    label: 'Cadastre',
    icon: Landmark,
    hint: 'Seules les observations comprises dans le plan cadastral de la propriété',
  },
  {
    key: 'all',
    label: 'Tous',
    icon: Globe2,
    hint: 'Toutes les observations rattachées aux marches liées à la propriété',
  },
];

/**
 * Sélecteur de portée des observations du vivant — réglage GLOBAL de la fiche
 * propriété : cartes, listes, compteurs, synthèses et impressions suivent.
 */
export const VivantScopeSwitch: React.FC<Props> = ({ counts, variant = 'panel', className }) => {
  const { scope, setScope, cadastreAvailable, proprieteId } = useVivantScope();
  if (!proprieteId) return null;

  const inline = variant === 'inline';

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="Portée des observations du vivant"
        className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 ${
          inline
            ? 'border-border/60 bg-background/70 backdrop-blur'
            : 'border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/5'
        }`}
      >
        {OPTIONS.map(({ key, label, icon: Icon, hint }) => {
          const active = (cadastreAvailable ? scope : 'all') === key;
          const disabled = key === 'cadastre' && !cadastreAvailable;
          const n = key === 'cadastre' ? counts?.cadastre : counts?.all;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              title={disabled ? 'Aucune parcelle cadastrale renseignée' : hint}
              onClick={() => !disabled && setScope(key)}
              className={`flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-medium transition-colors ${
                disabled
                  ? 'cursor-not-allowed opacity-35'
                  : active
                    ? 'bg-[hsl(var(--ds-forest))]/85 text-white shadow-sm'
                    : 'text-[hsl(var(--ds-forest-deep))]/70 hover:bg-[hsl(var(--ds-forest))]/10'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
              {typeof n === 'number' && (
                <span className={active ? 'opacity-80' : 'opacity-55'}>· {n}</span>
              )}
            </button>
          );
        })}
      </div>
      {!cadastreAvailable && (
        <p className="mt-1 text-[9px] italic leading-tight opacity-55">
          Aucune parcelle cadastrale : toutes les observations sont affichées.
        </p>
      )}
    </div>
  );
};

export default VivantScopeSwitch;
