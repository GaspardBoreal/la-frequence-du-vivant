import React from 'react';
import { cn } from '@/lib/utils';
import { KANBAN_COLUMNS, type OpportunityStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';

interface Props {
  value: OpportunityStatus[];
  onChange: (next: OpportunityStatus[]) => void;
  className?: string;
}

const STAGE_HUE: Record<OpportunityStatus, string> = {
  a_contacter: '210 90% 56%',
  relance_1: '45 95% 55%',
  relance_2: '28 92% 55%',
  relance_3: '0 80% 60%',
  pas_interesse: '220 10% 55%',
  gagne: '150 65% 45%',
  perdu: '220 10% 45%',
};

export const PipelineStagesFilter: React.FC<Props> = ({ value, onChange, className }) => {
  const set = React.useMemo(() => new Set(value), [value]);
  const all = KANBAN_COLUMNS.map((c) => c.id);

  const toggle = (id: OpportunityStatus) => {
    if (set.has(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card/60 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:px-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Étapes
        </span>
        {KANBAN_COLUMNS.map((col) => {
          const active = set.has(col.id);
          const hue = STAGE_HUE[col.id];
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => toggle(col.id)}
              className={cn(
                'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                'hover:scale-[1.03] active:scale-[0.98]',
                active
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border bg-background/40 text-muted-foreground hover:bg-muted/50',
              )}
              style={
                active
                  ? {
                      background: `hsl(${hue})`,
                      boxShadow: `0 4px 14px -4px hsl(${hue} / 0.55)`,
                    }
                  : undefined
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: active ? 'rgba(255,255,255,.9)' : `hsl(${hue})` }}
              />
              {col.title}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onChange(all)}>
            Tout
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onChange([])}>
            Aucun
          </Button>
        </div>
      </div>
    </div>
  );
};

export { STAGE_HUE };
