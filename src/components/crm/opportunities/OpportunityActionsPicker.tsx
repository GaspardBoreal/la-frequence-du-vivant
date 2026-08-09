import React from 'react';
import { Check, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OPPORTUNITY_ACTIONS, type OpportunityActionCode } from '@/lib/crmOpportunityActions';

interface OpportunityActionsPickerProps {
  value: OpportunityActionCode[];
  onChange: (next: OpportunityActionCode[]) => void;
  className?: string;
  /** Ouvre l'audit partenariat rattaché à l'opportunité */
  onOpenAudit?: () => void;
  /** Libellé du bouton d'ouverture du dossier partenaire */
  openLabel?: string;
}

/**
 * Sélecteur multi-actions design : cartes ordonnées, toggle au clic.
 * Met en avant la progression (X/N) et célèbre le « process complet ».
 */
export const OpportunityActionsPicker: React.FC<OpportunityActionsPickerProps> = ({
  value,
  onChange,
  className,
  onOpenAudit,
  openLabel = "Ouvrir l'audit",
}) => {

  const set = React.useMemo(() => new Set(value), [value]);
  const completed = value.length;
  const total = OPPORTUNITY_ACTIONS.length;
  const allDone = completed === total;

  const toggle = (code: OpportunityActionCode) => {
    if (set.has(code)) {
      onChange(value.filter(c => c !== code));
    } else {
      // Re-ordonner selon l'ordre canonique pour rester stable en BDD
      const next = new Set(value);
      next.add(code);
      onChange(OPPORTUNITY_ACTIONS.filter(a => next.has(a.code)).map(a => a.code));
    }
  };

  return (
    <section className={cn('space-y-3', className)}>
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Actions réalisées</h3>
          <p className="text-xs text-muted-foreground">
            Cochez les jalons du process commercial déjà accomplis.
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            allDone
              ? 'border-amber-400/60 bg-amber-400/10 text-amber-600 dark:text-amber-300'
              : 'border-border bg-muted/40 text-muted-foreground'
          )}
        >
          <span className="tabular-nums">{completed}/{total}</span>
          <span className="hidden sm:inline">{allDone ? 'Process complet ✨' : 'jalons'}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out',
            allDone ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-primary'
          )}
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {OPPORTUNITY_ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          const selected = set.has(action.code);
          const hue = action.hue;
          return (
            <div key={action.code} className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => toggle(action.code)}

              aria-pressed={selected}
              className={cn(
                'group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-transparent shadow-sm'
                  : 'border-border bg-card hover:border-foreground/20'
              )}
              style={
                selected
                  ? {
                      backgroundColor: `hsl(${hue} / 0.10)`,
                      boxShadow: `inset 0 0 0 1.5px hsl(${hue} / 0.55)`,
                    }
                  : undefined
              }
            >
              {/* Numéro de jalon */}
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors',
                  selected ? 'text-background' : 'bg-muted text-muted-foreground'
                )}
                style={selected ? { backgroundColor: `hsl(${hue})` } : undefined}
              >
                {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : idx + 1}
              </span>

              <Icon
                className={cn('h-5 w-5 transition-colors', selected ? '' : 'text-muted-foreground')}
                style={selected ? { color: `hsl(${hue})` } : undefined}
              />

              <div className="space-y-0.5">
                <div
                  className={cn(
                    'text-sm font-medium leading-tight',
                    selected ? 'text-foreground' : 'text-foreground/90'
                  )}
                >
                  {action.label}
                </div>
                <div className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {action.description}
                </div>
              </div>
            </button>

            {action.code === 'audit_partenariat' && onOpenAudit && (
              <button
                type="button"
                onClick={onOpenAudit}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/25 px-2 py-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/50 hover:bg-muted/60"
              >
                <FileSearch className="h-3.5 w-3.5" />
                {openLabel}
              </button>
            )}
            </div>

          );
        })}
      </div>
    </section>
  );
};
