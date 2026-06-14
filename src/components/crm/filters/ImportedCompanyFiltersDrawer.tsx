import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { FRENCH_DEPARTMENTS_WITH_CODES, FRENCH_REGIONS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';
import { NafCombobox } from '@/components/crm/filters/NafCombobox';
import type { CrmCompanyStage } from '@/types/crmCompany';

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
