import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { SlidersHorizontal, RotateCcw, Check, ChevronsUpDown, X } from 'lucide-react';
import { FRENCH_DEPARTMENTS_WITH_CODES, FRENCH_REGIONS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';
import { searchNaf, getNafLabel, formatNaf } from '@/lib/nafCatalog';
import type { CrmCompanyStage } from '@/types/crmCompany';
import { cn } from '@/lib/utils';

export interface ImportedCompanyFilters {
  stage?: CrmCompanyStage | 'all';
  ville?: string;
  departement?: string;
  region?: string;
  code_naf?: string;
  geolocated_only?: boolean;
}

interface Props {
  value: ImportedCompanyFilters;
  onChange: (next: ImportedCompanyFilters) => void;
  /** Hide the geolocated toggle (e.g. when Carte forces it ON). */
  hideGeolocatedToggle?: boolean;
  /** Hide the stage select (rarely useful). */
  hideStage?: boolean;
}

const NONE = '__none__';

function countActive(f: ImportedCompanyFilters): number {
  let n = 0;
  if (f.stage && f.stage !== 'all') n++;
  if (f.ville) n++;
  if (f.departement) n++;
  if (f.region) n++;
  if (f.code_naf) n++;
  if (f.geolocated_only) n++;
  return n;
}

const NafCombobox: React.FC<{ value?: string; onChange: (code?: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const results = React.useMemo(() => searchNaf(query, 50), [query]);
  const label = value ? (getNafLabel(value) ? formatNaf(value) : value) : '';
  return (
    <div>
      <Label>Activité (NAF/APE)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between font-normal mt-1 h-auto min-h-10 py-2', !value && 'text-muted-foreground')}
          >
            <span className="truncate text-left">{label || 'Code ou libellé : "vigne", "01.21Z"…'}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Tapez un code ou un mot-clé…" value={query} onValueChange={setQuery} />
            <CommandList className="max-h-72">
              <CommandEmpty>Aucun code NAF correspondant.</CommandEmpty>
              <CommandGroup>
                {results.map((e) => (
                  <CommandItem
                    key={e.code}
                    value={e.code}
                    onSelect={() => { onChange(e.code); setOpen(false); setQuery(''); }}
                    className="flex items-start gap-2"
                  >
                    <Check className={cn('h-4 w-4 mt-0.5 shrink-0', value === e.code ? 'opacity-100' : 'opacity-0')} />
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">{e.code}</div>
                      <div className="text-sm leading-tight">{e.label}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline mt-1 inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Retirer le filtre activité
        </button>
      )}
    </div>
  );
};

export const ImportedCompanyFiltersDrawer: React.FC<Props> = ({
  value,
  onChange,
  hideGeolocatedToggle,
  hideStage,
}) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ImportedCompanyFilters>(value);

  React.useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const active = countActive(value);

  const apply = () => { onChange(draft); setOpen(false); };
  const reset = () => {
    const next: ImportedCompanyFilters = { stage: 'all' };
    setDraft(next);
    onChange(next);
  };

  const set = <K extends keyof ImportedCompanyFilters>(k: K, v: ImportedCompanyFilters[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="gap-1.5 relative">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {active > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
              {active}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtres entreprises</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {!hideStage && (
            <div>
              <Label>Stage</Label>
              <Select
                value={draft.stage ?? 'all'}
                onValueChange={(v) => set('stage', v as any)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[1200]">
                  <SelectItem value="all">Tous les stages</SelectItem>
                  <SelectItem value="suspect">Suspect</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Ville</Label>
            <Input
              value={draft.ville ?? ''}
              onChange={(e) => set('ville', e.target.value || undefined)}
              placeholder="Ex. Bordeaux"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Département</Label>
            <Select
              value={draft.departement ?? NONE}
              onValueChange={(v) => set('departement', v === NONE ? undefined : v)}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent className="z-[1200] max-h-72">
                <SelectItem value={NONE}>Tous</SelectItem>
                {FRENCH_DEPARTMENTS_WITH_CODES.map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.code} — {d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Région</Label>
            <Select
              value={draft.region ?? NONE}
              onValueChange={(v) => set('region', v === NONE ? undefined : v)}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Toutes" /></SelectTrigger>
              <SelectContent className="z-[1200] max-h-72">
                <SelectItem value={NONE}>Toutes</SelectItem>
                {FRENCH_REGIONS_WITH_CODES.map((r) => (
                  <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <NafCombobox value={draft.code_naf} onChange={(v) => set('code_naf', v)} />

          {!hideGeolocatedToggle && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="cursor-pointer">Géolocalisées uniquement</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Masquer les entreprises sans coordonnées GPS.</p>
              </div>
              <Switch
                checked={!!draft.geolocated_only}
                onCheckedChange={(v) => set('geolocated_only', v || undefined)}
              />
            </div>
          )}
        </div>

        <SheetFooter className="mt-6 gap-2 sm:gap-2 flex-row">
          <Button variant="outline" onClick={reset} className="gap-1.5 flex-1">
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </Button>
          <Button onClick={apply} className="flex-1">Appliquer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ImportedCompanyFiltersDrawer;
