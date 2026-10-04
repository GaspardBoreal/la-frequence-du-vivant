import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { periodLabelOf, PERIOD_OPTIONS } from '@/components/propriete/VivantPeriodFilter';
import type { EvolutionPeriod, CustomRange } from '@/hooks/useBiodiversityEvolution';

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (s?: string) => (s ? new Date(`${s}T00:00:00`) : undefined);

interface Props {
  title: React.ReactNode;
  period: EvolutionPeriod;
  customRange?: CustomRange;
  onChange: (p: EvolutionPeriod, range?: CustomRange) => void;
  aside?: React.ReactNode;
}

const MarchePeriodBar: React.FC<Props> = ({ title, period, customRange, onChange, aside }) => {
  const [open, setOpen] = React.useState(false);
  const [showCal, setShowCal] = React.useState(period === 'custom');
  const active = period !== 'all';

  const label =
    period === 'custom' && customRange?.from
      ? `${format(fromISO(customRange.from)!, 'd MMM', { locale: fr })} → ${
          customRange.to ? format(fromISO(customRange.to)!, 'd MMM yy', { locale: fr }) : '…'
        }`
      : periodLabelOf(period);

  const range: DateRange | undefined = customRange?.from
    ? { from: fromISO(customRange.from), to: fromISO(customRange.to) }
    : undefined;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
      <div className="min-w-0">{title}</div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {aside}
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setShowCal(period === 'custom'); }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex-1 sm:flex-none inline-flex items-center justify-between gap-2 h-9 pl-3 pr-2.5 rounded-full border text-xs transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/40 border-border/50 text-foreground hover:border-primary/50',
              )}
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span className="opacity-70">Période</span>
                <span className="font-medium truncate">{label}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-2">
            {!showCal ? (
              <div className="grid grid-cols-2 gap-1 w-[280px]">
                {PERIOD_OPTIONS.map((o) => {
                  const sel = o.key === period;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        if (o.key === 'custom') { setShowCal(true); return; }
                        onChange(o.key);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg text-xs text-left transition-colors',
                        o.key === 'custom' || o.key === 'all' ? 'col-span-2' : '',
                        sel ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted',
                      )}
                    >
                      {o.label}
                      {sel && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
                <p className="col-span-2 mt-1 px-1 text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Filtré sur la date terrain
                </p>
              </div>
            ) : (
              <div className="pointer-events-auto">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={range}
                  onSelect={(r) => {
                    if (!r?.from) return;
                    onChange('custom', { from: toISO(r.from), to: r.to ? toISO(r.to) : undefined } as CustomRange);
                  }}
                  locale={fr}
                  className="p-2 pointer-events-auto"
                />
                <div className="flex justify-between px-2 pb-1">
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowCal(false)}>
                    ← Périodes
                  </button>
                  <button type="button" className="text-xs font-medium text-primary" onClick={() => setOpen(false)}>
                    Valider
                  </button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {active && (
          <button
            type="button"
            onClick={() => onChange('all')}
            aria-label="Réinitialiser la période"
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MarchePeriodBar;
