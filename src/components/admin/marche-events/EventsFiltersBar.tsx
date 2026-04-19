import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MARCHE_EVENT_TYPES, getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import type { EventsFilters, EventSort, EventStatus } from '@/hooks/useMarcheEventsQuery';

interface Props {
  filters: EventsFilters;
  onChange: (next: Partial<EventsFilters>) => void;
  totalLabel?: string;
}

const TypeSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Tous les types" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tous les types</SelectItem>
      <SelectItem value="none">Aucun type</SelectItem>
      {MARCHE_EVENT_TYPES.map((t) => {
        const m = getMarcheEventTypeMeta(t)!;
        return <SelectItem key={t} value={t}>{m.label}</SelectItem>;
      })}
    </SelectContent>
  </Select>
);

const StatusSelect: React.FC<{ value: EventStatus; onChange: (v: EventStatus) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={(v) => onChange(v as EventStatus)}>
    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tous statuts</SelectItem>
      <SelectItem value="upcoming">À venir</SelectItem>
      <SelectItem value="past">Passées</SelectItem>
    </SelectContent>
  </Select>
);

const SortSelect: React.FC<{ value: EventSort; onChange: (v: EventSort) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={(v) => onChange(v as EventSort)}>
    <SelectTrigger className="w-full">
      <ArrowUpDown className="h-4 w-4 mr-1 text-muted-foreground" />
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="date_desc">Date ↓ (récent → ancien)</SelectItem>
      <SelectItem value="date_asc">Date ↑ (ancien → récent)</SelectItem>
      <SelectItem value="title_asc">Titre A → Z</SelectItem>
      <SelectItem value="title_desc">Titre Z → A</SelectItem>
    </SelectContent>
  </Select>
);

const EventsFiltersBar: React.FC<Props> = ({ filters, onChange, totalLabel }) => {
  return (
    <Card className="p-3 sm:p-4 mb-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, lieu, exploration…"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          {/* Mobile: filtres dans un drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden shrink-0" aria-label="Filtres">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader><SheetTitle>Filtres</SheetTitle></SheetHeader>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <TypeSelect value={filters.type} onChange={(v) => onChange({ type: v })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
                  <StatusSelect value={filters.status} onChange={(v) => onChange({ status: v })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tri</label>
                  <SortSelect value={filters.sort} onChange={(v) => onChange({ sort: v })} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: filtres en ligne */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-3">
          <TypeSelect value={filters.type} onChange={(v) => onChange({ type: v })} />
          <StatusSelect value={filters.status} onChange={(v) => onChange({ status: v })} />
          <SortSelect value={filters.sort} onChange={(v) => onChange({ sort: v })} />
        </div>

        {totalLabel && <p className="text-xs text-muted-foreground">{totalLabel}</p>}
      </div>
    </Card>
  );
};

export default EventsFiltersBar;
