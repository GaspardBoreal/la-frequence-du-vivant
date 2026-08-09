import React from 'react';
import { Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import type { WorkStatus } from '@/lib/partnerRoadmaps';

const OPTIONS: { value: WorkStatus; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'todo', label: 'À faire', icon: Circle },
  { value: 'doing', label: 'En cours', icon: CircleDot },
  { value: 'done', label: 'Fait', icon: CheckCircle2 },
];

/** Sélecteur manuel d'avancement d'un chantier. */
export const RoadmapTaskStatusControl: React.FC<{
  value: WorkStatus;
  onChange: (v: WorkStatus) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div
    role="group"
    aria-label="Avancement du chantier"
    className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border/60 bg-muted/30 p-0.5 print:hidden"
  >
    {OPTIONS.map(({ value: v, label, icon: Icon }) => {
      const active = v === value;
      return (
        <button
          key={v}
          type="button"
          disabled={disabled}
          aria-pressed={active}
          title={label}
          onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide transition-colors disabled:opacity-50 ${
            active
              ? v === 'done'
                ? 'bg-primary text-primary-foreground'
                : v === 'doing'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-3 w-3" />
          <span className={active ? '' : 'hidden sm:inline'}>{label}</span>
        </button>
      );
    })}
  </div>
);

/** Barre d'avancement d'une priorité. */
export const RoadmapProgressBar: React.FC<{ done: number; total: number; label?: string }> = ({
  done,
  total,
  label,
}) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 print:hidden">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground">
        {label ?? `${done}/${total} livrés`}
      </span>
    </div>
  );
};

export default RoadmapTaskStatusControl;
