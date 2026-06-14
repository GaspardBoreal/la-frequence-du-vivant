import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export interface ContactFiltersValue {
  roleType?: string; // 'all' or specific
  dirigeantOnly?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  fonction?: string;
  entreprise?: string;
}

interface Props {
  value: ContactFiltersValue;
  onChange: (next: ContactFiltersValue) => void;
}

const NONE = '__none__';

function countActive(f: ContactFiltersValue): number {
  let n = 0;
  if (f.roleType && f.roleType !== 'all') n++;
  if (f.dirigeantOnly) n++;
  if (f.hasEmail) n++;
  if (f.hasPhone) n++;
  if (f.fonction) n++;
  if (f.entreprise) n++;
  return n;
}

export const ContactFiltersDrawer: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ContactFiltersValue>(value);

  React.useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const active = countActive(value);

  const apply = () => { onChange(draft); setOpen(false); };
  const reset = () => {
    const next: ContactFiltersValue = { roleType: 'all' };
    setDraft(next);
    onChange(next);
  };

  const set = <K extends keyof ContactFiltersValue>(k: K, v: ContactFiltersValue[K]) =>
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
          <SheetTitle>Filtres contacts</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div>
            <Label>Rôle</Label>
            <Select
              value={draft.roleType ?? 'all'}
              onValueChange={(v) => set('roleType', v)}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[1200]">
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="dirigeant">Dirigeants</SelectItem>
                <SelectItem value="decideur">Décideurs</SelectItem>
                <SelectItem value="operationnel">Opérationnels</SelectItem>
                <SelectItem value="prescripteur">Prescripteurs</SelectItem>
                <SelectItem value="autre">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Entreprise (contient)</Label>
            <Input
              value={draft.entreprise ?? ''}
              onChange={(e) => set('entreprise', e.target.value || undefined)}
              placeholder="Ex. Veolia"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Fonction (contient)</Label>
            <Input
              value={draft.fonction ?? ''}
              onChange={(e) => set('fonction', e.target.value || undefined)}
              placeholder="Ex. RH, Directeur…"
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="cursor-pointer">Dirigeant API Sirene</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Uniquement les dirigeants déclarés.</p>
            </div>
            <Switch
              checked={!!draft.dirigeantOnly}
              onCheckedChange={(v) => set('dirigeantOnly', v || undefined)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="cursor-pointer">Avec email</Label>
            </div>
            <Switch
              checked={!!draft.hasEmail}
              onCheckedChange={(v) => set('hasEmail', v || undefined)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="cursor-pointer">Avec téléphone</Label>
            </div>
            <Switch
              checked={!!draft.hasPhone}
              onCheckedChange={(v) => set('hasPhone', v || undefined)}
            />
          </div>
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

export default ContactFiltersDrawer;
