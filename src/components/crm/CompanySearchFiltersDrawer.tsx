import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { CompanySearchFilters } from '@/types/crmCompany';
import { FRENCH_DEPARTMENTS_WITH_CODES, FRENCH_REGIONS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';
import { CATEGORIE_ENTREPRISE_OPTIONS, ETAT_ADMIN_OPTIONS, LABEL_FILTERS, NAF_QUICK_PICKS, TRANCHE_EFFECTIF_OPTIONS } from '@/lib/crmAnnuaireOptions';

interface Props {
  value: CompanySearchFilters;
  onChange: (next: CompanySearchFilters) => void;
}

const NONE = '__none__';

export const CompanySearchFiltersDrawer: React.FC<Props> = ({ value, onChange }) => {
  const [draft, setDraft] = React.useState<CompanySearchFilters>(value);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const activeCount = React.useMemo(() => {
    return Object.entries(value).filter(([k, v]) =>
      !['q', 'page', 'per_page'].includes(k) && v !== undefined && v !== '' && v !== false && v !== null
    ).length;
  }, [value]);

  const set = <K extends keyof CompanySearchFilters>(k: K, v: CompanySearchFilters[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }));

  const reset = () => setDraft({ q: value.q ?? '' });

  const apply = () => { onChange({ ...draft, page: 1 }); setOpen(false); };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 min-w-[20px] h-5">{activeCount}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" /> Filtres avancés
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <Accordion type="multiple" defaultValue={['loc', 'act']}>
            <AccordionItem value="loc">
              <AccordionTrigger>Localisation</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label>Ville / commune</Label>
                  <Input value={draft.commune ?? ''} onChange={e => set('commune', e.target.value || undefined)} placeholder="ex: Bordeaux" />
                </div>
                <div>
                  <Label>Code postal</Label>
                  <Input value={draft.code_postal ?? ''} onChange={e => set('code_postal', e.target.value || undefined)} placeholder="ex: 33000" />
                </div>
                <div>
                  <Label>Département</Label>
                  <Select value={draft.departement ?? NONE} onValueChange={v => set('departement', v === NONE ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value={NONE}>Tous</SelectItem>
                      {FRENCH_DEPARTMENTS_WITH_CODES.map(d => <SelectItem key={d.code} value={d.code}>{d.code} — {d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Région</Label>
                  <Select value={draft.region ?? NONE} onValueChange={v => set('region', v === NONE ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value={NONE}>Toutes</SelectItem>
                      {FRENCH_REGIONS_WITH_CODES.map(r => <SelectItem key={r.code + r.label} value={r.code}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="act">
              <AccordionTrigger>Activité &amp; structure</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label>Code NAF/APE</Label>
                  <Input value={draft.activite_principale ?? ''} onChange={e => set('activite_principale', e.target.value || undefined)} placeholder="ex: 01.11Z" />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {NAF_QUICK_PICKS.slice(0, 5).map(p => (
                      <button key={p.code} type="button" onClick={() => set('activite_principale', p.code)}
                        className="text-[11px] px-2 py-0.5 rounded-full border bg-muted hover:bg-accent">
                        {p.code}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Forme juridique (code à 4 chiffres)</Label>
                  <Input
                    value={draft.categorie_juridique ?? ''}
                    onChange={e => set('categorie_juridique', e.target.value || undefined)}
                    placeholder="ex : 5710 (SAS), 5499 (autre SA)"
                    inputMode="numeric"
                    maxLength={4}
                  />
                  {draft.categorie_juridique && !/^\d{4}$/.test(draft.categorie_juridique) && (
                    <p className="text-[11px] text-destructive mt-1">Doit être 4 chiffres (ex : 5710). Ne pas confondre avec le code NAF.</p>
                  )}
                </div>
                <div>
                  <Label>Catégorie d'entreprise</Label>
                  <Select value={draft.categorie_entreprise ?? NONE} onValueChange={v => set('categorie_entreprise', v === NONE ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Toutes</SelectItem>
                      {CATEGORIE_ENTREPRISE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tranche d'effectif salarié</Label>
                  <Select value={draft.tranche_effectif_salarie ?? NONE} onValueChange={v => set('tranche_effectif_salarie', v === NONE ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value={NONE}>Toutes</SelectItem>
                      {TRANCHE_EFFECTIF_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>État administratif</Label>
                  <Select value={draft.etat_administratif ?? NONE} onValueChange={v => set('etat_administratif', v === NONE ? undefined : v)}>
                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Tous</SelectItem>
                      {ETAT_ADMIN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lbl">
              <AccordionTrigger>Qualités &amp; labels</AccordionTrigger>
              <AccordionContent className="space-y-2">
                {LABEL_FILTERS.map(f => (
                  <div key={f.key} className="flex items-center justify-between">
                    <Label className="cursor-pointer">{f.label}</Label>
                    <Switch
                      checked={Boolean((draft as any)[f.key])}
                      onCheckedChange={(v) => set(f.key as any, v ? true : undefined)}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fin">
              <AccordionTrigger>Financier</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>CA min (€)</Label>
                    <Input type="number" value={draft.ca_min ?? ''} onChange={e => set('ca_min', e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <Label>CA max (€)</Label>
                    <Input type="number" value={draft.ca_max ?? ''} onChange={e => set('ca_max', e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Résultat net min</Label>
                    <Input type="number" value={draft.resultat_net_min ?? ''} onChange={e => set('resultat_net_min', e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <Label>Résultat net max</Label>
                    <Input type="number" value={draft.resultat_net_max ?? ''} onChange={e => set('resultat_net_max', e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dir">
              <AccordionTrigger>Dirigeant</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label>Nom</Label>
                  <Input value={draft.nom_personne ?? ''} onChange={e => set('nom_personne', e.target.value || undefined)} />
                </div>
                <div>
                  <Label>Prénom(s)</Label>
                  <Input value={draft.prenoms_personne ?? ''} onChange={e => set('prenoms_personne', e.target.value || undefined)} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="outline" onClick={reset} className="gap-2 flex-1">
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </Button>
          <Button onClick={apply} className="flex-1">Appliquer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
