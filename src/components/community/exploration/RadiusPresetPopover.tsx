import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RADIUS_OPTIONS } from '@/components/biodiversity/RadiusSelector';
import { cn } from '@/lib/utils';

interface RadiusPresetPopoverProps {
  /** Rayon résolu en mètres (affiché dans la chip). */
  valueM: number;
  /** Indique si la marche utilise un override (point vert) ou le défaut. */
  isOverride?: boolean;
  /** Désactive l'édition. */
  readOnly?: boolean;
  /** Callback : null = retirer l'override et reprendre le défaut exploration. */
  onPick: (radiusM: number | null) => void;
  /** Affiche la ligne « Reprendre le défaut » dans le popover. */
  allowClearOverride?: boolean;
  /** Trigger custom (sinon : chip standard). */
  className?: string;
  size?: 'sm' | 'md';
}

const formatRadius = (m: number) =>
  m >= 1000 ? `${(m / 1000).toString().replace(/\.0$/, '')} km` : `${m} m`;

const RadiusPresetPopover: React.FC<RadiusPresetPopoverProps> = ({
  valueM,
  isOverride,
  readOnly,
  onPick,
  allowClearOverride,
  className,
  size = 'sm',
}) => {
  const [open, setOpen] = React.useState(false);

  const trigger = (
    <button
      type="button"
      disabled={readOnly}
      className={cn(
        'relative inline-flex items-center gap-1 rounded-full border font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        isOverride
          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-700 dark:text-emerald-300'
          : 'bg-background/40 border-border/40 text-foreground/70',
        !readOnly && 'hover:bg-emerald-500/20 hover:border-emerald-400/50 cursor-pointer',
        readOnly && 'cursor-default opacity-80',
        className,
      )}
    >
      <span>{formatRadius(valueM)}</span>
      {isOverride && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
      )}
    </button>
  );

  if (readOnly) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-3 gap-1">
          {RADIUS_OPTIONS.map(opt => {
            const m = Math.round(opt.value * 1000);
            const active = m === valueM;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onPick(m);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] border transition-colors',
                  active
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-background border-border/40 text-foreground/70 hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {allowClearOverride && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onPick(null);
            }}
            className="mt-2 w-full text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Reprendre le défaut exploration
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default RadiusPresetPopover;
