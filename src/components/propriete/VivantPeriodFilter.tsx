import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVivantScope } from '@/contexts/ProprieteVivantScopeContext';
import type { EvolutionPeriod } from '@/hooks/useBiodiversityEvolution';

interface Props {
  /** Nombre d'observations visibles après filtrage (facultatif). */
  visibleCount?: number;
  /** `panel` = panneau Calques de l'Atelier, `inline` = bandeau de carte. */
  variant?: 'panel' | 'inline';
  className?: string;
}

/** Mêmes options que Mon espace → Biodiversité → Taxons observés. */
const PERIOD_OPTIONS: { key: EvolutionPeriod; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 derniers jours' },
  { key: '30d', label: '30 derniers jours' },
  { key: 'last_month', label: 'Mois dernier' },
  { key: 'last_quarter', label: 'Trimestre dernier' },
  { key: '6m', label: '6 derniers mois' },
  { key: 'year', label: 'Année en cours' },
  { key: '12m', label: '12 mois glissants' },
  { key: 'all', label: 'Tout' },
  { key: 'custom', label: 'Période personnalisée…' },
];

const dateToISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISOToDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
};

/**
 * Filtre temporel GLOBAL des observations du vivant d'une propriété : cartes,
 * listes, compteurs, synthèses et impressions suivent le même réglage.
 */
export const VivantPeriodFilter: React.FC<Props> = ({
  visibleCount,
  variant = 'panel',
  className,
}) => {
  const {
    proprieteId,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateSource,
    setDateSource,
  } = useVivantScope();
  if (!proprieteId) return null;

  const inline = variant === 'inline';
  const customFrom = fromISOToDate(customRange?.from);
  const customTo = fromISOToDate(customRange?.to);
  const active = period !== 'all';
  const activeLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label ?? 'Tout';

  const chip =
    'flex items-center gap-1 rounded-full border px-2 py-[3px] text-[10px] font-medium transition-colors ' +
    (inline
      ? 'border-border/60 bg-background/70 backdrop-blur hover:bg-background'
      : 'border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/5 hover:bg-[hsl(var(--ds-forest))]/10');

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <Select value={period} onValueChange={(v) => setPeriod(v as EvolutionPeriod)}>
        <SelectTrigger
          className={cn(
            'h-6 w-auto min-w-[9.5rem] rounded-full px-2.5 text-[10px]',
            inline
              ? 'border-border/60 bg-background/70 backdrop-blur'
              : 'border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/5 text-[hsl(var(--ds-forest-deep))]',
          )}
          aria-label="Période des observations"
        >
          <CalendarIcon className="mr-1 h-3 w-3 opacity-70" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[10000] bg-popover">
          {PERIOD_OPTIONS.map((p) => (
            <SelectItem key={p.key} value={p.key} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === 'custom' && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('h-6 rounded-full px-2 text-[10px] font-normal', !customFrom && 'text-muted-foreground')}
              >
                {customFrom ? format(customFrom, 'd MMM yyyy', { locale: fr }) : 'Début'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[10000] w-auto bg-popover p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={(d) =>
                  setCustomRange({ from: d ? dateToISO(d) : undefined, to: customRange?.to })
                }
                initialFocus
                className={cn('pointer-events-auto p-3')}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('h-6 rounded-full px-2 text-[10px] font-normal', !customTo && 'text-muted-foreground')}
              >
                {customTo ? format(customTo, 'd MMM yyyy', { locale: fr }) : 'Fin'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[10000] w-auto bg-popover p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={(d) =>
                  setCustomRange({ from: customRange?.from, to: d ? dateToISO(d) : undefined })
                }
                disabled={(d) => (customFrom ? d < customFrom : false)}
                initialFocus
                className={cn('pointer-events-auto p-3')}
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      <button
        type="button"
        className={chip}
        onClick={() => setDateSource(dateSource === 'observation' ? 'collection' : 'observation')}
        title={
          dateSource === 'observation'
            ? "Date à laquelle l'espèce a été observée sur le terrain"
            : 'Date à laquelle la donnée a été collectée par la plateforme'
        }
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dateSource === 'observation' ? 'bg-[hsl(var(--ds-forest))]' : 'bg-muted-foreground'
          }`}
        />
        {dateSource === 'observation' ? 'Date terrain' : 'Date collecte'}
      </button>

      {active && (
        <button
          type="button"
          className={chip}
          onClick={() => {
            setPeriod('all');
            setCustomRange({});
          }}
          title="Réinitialiser la période"
        >
          <RotateCcw className="h-3 w-3" />
          {activeLabel}
          {typeof visibleCount === 'number' && <span className="opacity-60">· {visibleCount} obs.</span>}
        </button>
      )}
    </div>
  );
};

export default VivantPeriodFilter;
