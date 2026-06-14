import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OPPORTUNITY_ACTIONS, type OpportunityActionCode } from '@/lib/crmOpportunityActions';

interface PipelineActionsFilterProps {
  value: OpportunityActionCode[];
  onChange: (next: OpportunityActionCode[]) => void;
  mode: 'and' | 'or';
  onModeChange: (mode: 'and' | 'or') => void;
  matchedCount: number;
  totalCount: number;
  className?: string;
}

/**
 * Barre de filtres élégante par jalons d'actions.
 */
export const PipelineActionsFilter: React.FC<PipelineActionsFilterProps> = ({
  value,
  onChange,
  mode,
  onModeChange,
  matchedCount,
  totalCount,
  className,
}) => {
  const set = React.useMemo(() => new Set(value), [value]);
  const hasFilters = value.length > 0;

  const toggle = (code: OpportunityActionCode) => {
    if (set.has(code)) {
      onChange(value.filter(c => c !== code));
    } else {
      const next = new Set(value);
      next.add(code);
      onChange(OPPORTUNITY_ACTIONS.filter(a => next.has(a.code)).map(a => a.code));
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card/60 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:px-4',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Jalons
        </span>

        {OPPORTUNITY_ACTIONS.map((a, idx) => {
          const Icon = a.icon;
          const selected = set.has(a.code);
          return (
            <button
              key={a.code}
              type="button"
              onClick={() => toggle(a.code)}
              aria-pressed={selected}
              className={cn(
                'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                'hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                selected
                  ? 'border-transparent text-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
              style={
                selected
                  ? {
                      backgroundColor: `hsl(${a.hue} / 0.14)`,
                      boxShadow: `inset 0 0 0 1.5px hsl(${a.hue} / 0.55)`,
                    }
                  : undefined
              }
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold tabular-nums',
                  selected ? 'text-background' : 'bg-muted text-muted-foreground'
                )}
                style={selected ? { backgroundColor: `hsl(${a.hue})` } : undefined}
              >
                {selected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : idx + 1}
              </span>
              <Icon
                className="h-3.5 w-3.5"
                style={selected ? { color: `hsl(${a.hue})` } : undefined}
              />
              <span className="hidden sm:inline">{a.shortLabel}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          {value.length >= 2 && (
            <div className="flex items-center rounded-full border bg-background p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => onModeChange('and')}
                className={cn(
                  'rounded-full px-2 py-0.5 font-medium transition-colors',
                  mode === 'and' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={() => onModeChange('or')}
                className={cn(
                  'rounded-full px-2 py-0.5 font-medium transition-colors',
                  mode === 'or' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Au moins une
              </button>
            </div>
          )}

          <span className="text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{matchedCount}</span>
            <span className="mx-0.5">/</span>
            {totalCount}
          </span>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onChange([])}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
