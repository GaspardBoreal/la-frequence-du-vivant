import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, SlidersHorizontal, Handshake, Sparkles, X } from 'lucide-react';
import { CarteMdVFilters, DEFAULT_FILTERS } from '@/hooks/useCarteMdV';
import { MARCHE_EVENT_TYPES, getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import SolVivantOptInDialog from './SolVivantOptInDialog';

interface Props {
  filters: CarteMdVFilters;
  onChange: (next: Partial<CarteMdVFilters>) => void;
  resultCount: number;
}

const SEASON_OPTIONS: { value: CarteMdVFilters['season']; label: string }[] = [
  { value: 'all', label: 'Toute période' },
  { value: 'upcoming', label: 'Prochaines' },
  { value: 'this_month', label: 'Ce mois-ci' },
  { value: 'spring', label: '🌸 Printemps' },
  { value: 'summer', label: '☀️ Été' },
  { value: 'autumn', label: '🍂 Automne' },
  { value: 'winter', label: '❄️ Hiver' },
];

const FiltersBar: React.FC<Props> = ({ filters, onChange, resultCount }) => {
  const [svDialogOpen, setSvDialogOpen] = useState(false);

  const toggleType = (t: string) => {
    onChange({ types: filters.types.includes(t) ? filters.types.filter(x => x !== t) : [...filters.types, t] });
  };

  const handleSvToggle = (v: boolean) => {
    if (v && !filters.solVivantEnabled) {
      setSvDialogOpen(true);
    } else {
      onChange({ solVivantEnabled: v });
    }
  };

  const activeCount = [
    filters.types.length > 0,
    filters.season !== DEFAULT_FILTERS.season,
    filters.minSpecies > 0,
    filters.zone !== DEFAULT_FILTERS.zone,
    filters.needAudio,
    filters.needPhotos,
  ].filter(Boolean).length;

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-3 space-y-3">
        {/* Row 1: search + status + advanced */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une marche, un lieu, une espèce…"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="pl-10"
            />
            {filters.search && (
              <button onClick={() => onChange({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={filters.status} onValueChange={(v) => onChange({ status: v as any })}>
            <SelectTrigger className="w-[140px] hidden sm:flex"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="upcoming">À venir</SelectItem>
              <SelectItem value="past">Passées</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                {activeCount > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{activeCount}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] space-y-4">
              {/* Season */}
              <div>
                <Label className="text-xs text-muted-foreground">📅 Période / Saison</Label>
                <Select value={filters.season} onValueChange={(v) => onChange({ season: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEASON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Min species */}
              <div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">🌿 Richesse biodiversité</Label>
                  <span className="text-xs font-semibold text-primary">≥ {filters.minSpecies} espèces</span>
                </div>
                <Slider value={[filters.minSpecies]} min={0} max={100} step={5}
                  onValueChange={([v]) => onChange({ minSpecies: v })}
                  className="mt-2" />
              </div>

              {/* Zone */}
              <div>
                <Label className="text-xs text-muted-foreground">⚪ Zone</Label>
                <Select value={filters.zone} onValueChange={(v) => onChange({ zone: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes zones</SelectItem>
                    <SelectItem value="pioneer">🌱 Pionnières (peu documentées)</SelectItem>
                    <SelectItem value="documented">📚 Documentées (riches)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sensory */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">🎧 Immersion sensorielle</Label>
                <div className="flex items-center justify-between text-sm">
                  <span>Audio disponible</span>
                  <Switch checked={filters.needAudio} onCheckedChange={(v) => onChange({ needAudio: v })} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Photos marcheurs</span>
                  <Switch checked={filters.needPhotos} onCheckedChange={(v) => onChange({ needPhotos: v })} />
                </div>
              </div>

              {activeCount > 0 && (
                <Button variant="ghost" size="sm" className="w-full"
                  onClick={() => onChange({ types: [], season: 'all', minSpecies: 0, zone: 'all', needAudio: false, needPhotos: false })}>
                  Réinitialiser les filtres
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Row 2: type chips + Sol Vivant toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Type :</span>
          {MARCHE_EVENT_TYPES.map((t) => {
            const meta = getMarcheEventTypeMeta(t)!;
            const active = filters.types.includes(t);
            const Icon = meta.icon;
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                  active ? meta.badgeClassName + ' ring-2 ring-primary/30' : 'border-border bg-background hover:bg-muted'
                }`}
              >
                <Icon className="h-3 w-3" />
                {meta.shortLabel}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
            <Handshake className={`h-4 w-4 ${filters.solVivantEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="sv-toggle" className="text-xs cursor-pointer">Partenaires Sol Vivant</Label>
            <Switch id="sv-toggle" checked={filters.solVivantEnabled} onCheckedChange={handleSvToggle} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span><strong className="text-foreground">{resultCount}</strong> marches correspondent à vos filtres</span>
        </div>
      </div>

      <SolVivantOptInDialog
        open={svDialogOpen}
        onOpenChange={setSvDialogOpen}
        onConfirm={() => onChange({ solVivantEnabled: true })}
      />
    </div>
  );
};

export default FiltersBar;
