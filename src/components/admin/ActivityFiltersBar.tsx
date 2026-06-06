import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CalendarRange, MapPin, User, X, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type ActivityPeriod = 'today' | 'yesterday' | '7d' | 'month' | 'year' | 'all';

export const PERIOD_OPTIONS: { value: ActivityPeriod; label: string }[] = [
  { value: 'today',     label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: '7d',        label: '7 derniers jours' },
  { value: 'month',     label: '30 derniers jours' },
  { value: 'year',      label: '12 derniers mois' },
  { value: 'all',       label: 'Tout' },
];

interface MarcheurOption { user_id: string; prenom: string | null; nom: string | null; }

interface Props {
  period: ActivityPeriod;
  eventId: string | null;
  userFilter: string;
  onPeriodChange: (p: ActivityPeriod) => void;
  onEventChange: (id: string | null) => void;
  onUserChange: (u: string) => void;
  onReset: () => void;
  marcheurs: MarcheurOption[];
}

const ActivityFiltersBar: React.FC<Props> = ({
  period, eventId, userFilter,
  onPeriodChange, onEventChange, onUserChange, onReset,
  marcheurs,
}) => {
  const [eventOpen, setEventOpen] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['activity-events-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activity_events_for_filter' as any);
      if (error) throw error;
      return (data || []) as Array<{
        id: string; title: string; date_marche: string | null;
        lieu: string | null; activity_count: number;
      }>;
    },
    staleTime: 60_000,
  });

  const selectedEvent = useMemo(
    () => events.find(e => e.id === eventId) || null,
    [events, eventId],
  );

  const hasActiveFilter =
    period !== '7d' || eventId !== null || (userFilter && userFilter !== 'all');

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 backdrop-blur p-2.5">
      {/* Période */}
      <div className="flex items-center gap-1.5">
        <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={period} onValueChange={(v) => onPeriodChange(v as ActivityPeriod)}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="h-5 w-px bg-border/60" />

      {/* Événement */}
      <div className="flex items-center gap-1.5 min-w-0">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Popover open={eventOpen} onOpenChange={setEventOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              size="sm"
              className="h-8 w-[260px] justify-between text-xs font-normal"
            >
              <span className="truncate">
                {selectedEvent
                  ? `${selectedEvent.date_marche ? format(new Date(selectedEvent.date_marche), 'dd/MM', { locale: fr }) + ' · ' : ''}${selectedEvent.title}`
                  : `Tous les événements${events.length ? ` (${events.length})` : ''}`}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un événement…" className="h-9 text-xs" />
              <CommandList>
                <CommandEmpty>Aucun événement avec activité.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__all__"
                    onSelect={() => { onEventChange(null); setEventOpen(false); }}
                    className="text-xs"
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', !eventId ? 'opacity-100' : 'opacity-0')} />
                    Tous les événements
                  </CommandItem>
                  {events.map(ev => (
                    <CommandItem
                      key={ev.id}
                      value={`${ev.title} ${ev.lieu || ''}`}
                      onSelect={() => { onEventChange(ev.id); setEventOpen(false); }}
                      className="text-xs"
                    >
                      <Check className={cn('mr-2 h-3.5 w-3.5', eventId === ev.id ? 'opacity-100' : 'opacity-0')} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{ev.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {ev.date_marche ? format(new Date(ev.date_marche), 'dd MMM yyyy', { locale: fr }) : '—'}
                          {ev.lieu ? ` · ${ev.lieu}` : ''}
                          {` · ${ev.activity_count} évén.`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <span className="h-5 w-px bg-border/60" />

      {/* Marcheur */}
      <div className="flex items-center gap-1.5">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={userFilter || 'all'} onValueChange={onUserChange}>
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="Tous les marcheurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tous les marcheurs</SelectItem>
            {marcheurs.map(m => (
              <SelectItem key={m.user_id} value={m.user_id} className="text-xs">
                {m.prenom || '—'} {m.nom || ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilter && (
        <Button
          variant="ghost" size="sm"
          onClick={onReset}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
        >
          <X className="h-3.5 w-3.5 mr-1" /> Effacer
        </Button>
      )}
    </div>
  );
};

export default ActivityFiltersBar;
