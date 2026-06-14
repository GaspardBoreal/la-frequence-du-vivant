import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Loader2, Sparkles, Building2, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useImportCompanies } from '@/hooks/useCrmCompanies';
import type { CrmCompanyStage } from '@/types/crmCompany';
import { STAGE_LABELS } from '@/types/crmCompany';
import { NafCombobox } from '@/components/crm/filters/NafCombobox';
import {
  CATEGORIE_ENTREPRISE_OPTIONS,
  ETAT_ADMIN_OPTIONS,
  TRANCHE_EFFECTIF_OPTIONS,
} from '@/lib/crmAnnuaireOptions';
import { FORMES_JURIDIQUES, FORMES_JURIDIQUES_GROUPS } from '@/lib/formesJuridiques';
import { FRENCH_DEPARTMENTS_WITH_CODES, FRENCH_REGIONS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';
import { deptCodeFromCodePostal, regionCodeFromDeptCode } from '@/lib/codePostalToDepartement';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (companyId: string) => void;
}

type Form = {
  siren: string;
  denomination: string;
  nom_complet: string;
  lifecycle_stage: CrmCompanyStage;
  code_naf: string;
  libelle_naf: string;
  forme_juridique: string;
  forme_juridique_autre: string;
  tranche_effectif: string;
  categorie_entreprise: string;
  etat_administratif: string;
  adresse: string;
  code_postal: string;
  ville: string;
  departement: string; // code INSEE ex "33"
  region: string; // code INSEE ex "75"
  notes: string;
  tags: string;
};

const EMPTY: Form = {
  siren: '', denomination: '', nom_complet: '', lifecycle_stage: 'suspect',
  code_naf: '', libelle_naf: '', forme_juridique: '', forme_juridique_autre: '',
  tranche_effectif: '', categorie_entreprise: '', etat_administratif: 'A',
  adresse: '', code_postal: '', ville: '', departement: '', region: '',
  notes: '', tags: '',
};

const NONE = '__none__';
const AUTRE = '__autre__';

// Combobox générique recherche (utilisé pour département)
const SearchableSelect: React.FC<{
  value?: string;
  onChange: (v?: string) => void;
  options: Array<{ code: string; label: string }>;
  placeholder: string;
  emptyText?: string;
  formatItem?: (o: { code: string; label: string }) => React.ReactNode;
}> = ({ value, onChange, options, placeholder, emptyText = 'Aucun résultat.', formatItem }) => {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.code === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal h-10', !value && 'text-muted-foreground')}
        >
          <span className="truncate text-left">
            {selected ? `${selected.code} — ${selected.label}` : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[1300]" align="start">
        <Command>
          <CommandInput placeholder="Rechercher…" />
          <CommandList className="max-h-72">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__clear__"
                onSelect={() => { onChange(undefined); setOpen(false); }}
              >
                <Check className={cn('h-4 w-4 mr-2', !value ? 'opacity-100' : 'opacity-0')} />
                <span className="text-muted-foreground italic">— Non renseigné</span>
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.code}
                  value={`${o.code} ${o.label}`}
                  onSelect={() => { onChange(o.code); setOpen(false); }}
                >
                  <Check className={cn('h-4 w-4 mr-2', value === o.code ? 'opacity-100' : 'opacity-0')} />
                  {formatItem ? formatItem(o) : <span>{o.code} — {o.label}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const CompanyManualCreateDialog: React.FC<Props> = ({ open, onOpenChange, onCreated }) => {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const qc = useQueryClient();
  const importMutation = useImportCompanies();

  React.useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  const sirenValid = /^\d{9}$/.test(form.siren.replace(/\s/g, ''));

  // Auto-déduction département/région à partir du code postal
  const handleCpBlur = () => {
    const deduced = deptCodeFromCodePostal(form.code_postal);
    if (deduced && !form.departement) set('departement', deduced);
    const deducedRegion = regionCodeFromDeptCode(deduced ?? form.departement);
    if (deducedRegion && !form.region) set('region', deducedRegion);
  };

  // Auto-région quand département change
  const handleDeptChange = (code?: string) => {
    set('departement', code ?? '');
    if (code && !form.region) {
      const r = regionCodeFromDeptCode(code);
      if (r) set('region', r);
    }
  };

  const formeJuridiqueSelectValue =
    form.forme_juridique === ''
      ? NONE
      : FORMES_JURIDIQUES.some((f) => f.value === form.forme_juridique)
        ? form.forme_juridique
        : AUTRE;

  const createMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      const siren = form.siren.replace(/\D/g, '');
      const denomination = form.denomination.trim() || form.nom_complet.trim();
      if (!denomination) throw new Error('La dénomination est obligatoire');

      const finalFormeJuridique =
        formeJuridiqueSelectValue === AUTRE
          ? form.forme_juridique_autre.trim() || null
          : form.forme_juridique || null;

      const payload: any = {
        siren: siren || `MAN${Date.now().toString().slice(-9)}`,
        denomination,
        nom_complet: form.nom_complet.trim() || denomination,
        lifecycle_stage: form.lifecycle_stage,
        code_naf: form.code_naf.trim() || null,
        libelle_naf: form.libelle_naf.trim() || null,
        forme_juridique: finalFormeJuridique,
        tranche_effectif: form.tranche_effectif || null,
        categorie_entreprise: form.categorie_entreprise || null,
        etat_administratif: form.etat_administratif || null,
        adresse: form.adresse.trim() || null,
        code_postal: form.code_postal.trim() || null,
        ville: form.ville.trim().toUpperCase() || null,
        departement: form.departement || null,
        region: form.region || null,
        notes: form.notes.trim() || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        source: 'manual',
        created_by: user?.id ?? null,
        dirigeants: [],
        qualites_labels: {},
        finances: [],
        raw_payload: { manual: true },
      };
      const { data, error } = await supabase.from('crm_companies').insert(payload).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success('Entreprise créée');
      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      onOpenChange(false);
      onCreated?.(id);
    },
    onError: (e: any) => toast.error('Création échouée', { description: e?.message }),
  });

  const importFromApi = () => {
    if (!sirenValid) {
      toast.error('Saisissez un SIREN valide (9 chiffres) pour importer via API');
      return;
    }
    importMutation.mutate(
      { sirens: [form.siren.replace(/\D/g, '')] },
      {
        onSuccess: (r) => {
          onOpenChange(false);
          if (r.results?.[0]?.id) onCreated?.(r.results[0].id);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[1200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Créer une entreprise manuellement
          </DialogTitle>
          <DialogDescription>
            Les listes (NAF, forme juridique, effectifs, département, région) sont alignées sur le référentiel
            INSEE — identiques à l'import API. Cela garantit que les filtres et la recherche fonctionneront.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {/* SIREN + Import API */}
          <div className="sm:col-span-2 flex items-end gap-2">
            <div className="flex-1">
              <Label>SIREN (9 chiffres) <span className="text-muted-foreground text-xs font-normal">— optionnel pour création manuelle</span></Label>
              <Input value={form.siren} onChange={e => set('siren', e.target.value)} placeholder="123456789" inputMode="numeric" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={importFromApi}
              disabled={!sirenValid || importMutation.isPending}>
              {importMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Importer via API
            </Button>
          </div>

          {/* Identité */}
          <div className="sm:col-span-2">
            <Label>Dénomination *</Label>
            <Input value={form.denomination} onChange={e => set('denomination', e.target.value)} placeholder="Nom commercial / raison sociale" />
          </div>
          <div className="sm:col-span-2">
            <Label>Nom complet</Label>
            <Input value={form.nom_complet} onChange={e => set('nom_complet', e.target.value)} />
          </div>

          {/* Stage + État */}
          <div>
            <Label>Stage</Label>
            <Select value={form.lifecycle_stage} onValueChange={(v) => set('lifecycle_stage', v as CrmCompanyStage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[1300]">
                {(['suspect', 'prospect', 'client', 'inactif'] as CrmCompanyStage[]).map(s => (
                  <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>État administratif</Label>
            <Select value={form.etat_administratif} onValueChange={(v) => set('etat_administratif', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[1300]">
                {ETAT_ADMIN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NAF unique combobox (remplit code + libellé) */}
          <div className="sm:col-span-2">
            <NafCombobox
              value={form.code_naf || undefined}
              onChange={(code, label) => {
                set('code_naf', code ?? '');
                set('libelle_naf', label ?? '');
              }}
              label="Activité (NAF/APE) — référentiel INSEE rév. 2"
            />
            {form.libelle_naf && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                Libellé : {form.libelle_naf}
              </p>
            )}
          </div>

          {/* Forme juridique + Tranche effectif */}
          <div>
            <Label>Forme juridique</Label>
            <Select
              value={formeJuridiqueSelectValue}
              onValueChange={(v) => {
                if (v === NONE) { set('forme_juridique', ''); set('forme_juridique_autre', ''); }
                else if (v === AUTRE) { set('forme_juridique', ''); }
                else { set('forme_juridique', v); set('forme_juridique_autre', ''); }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent className="z-[1300] max-h-80">
                <SelectItem value={NONE}>— Non renseigné</SelectItem>
                {FORMES_JURIDIQUES_GROUPS.map((group) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {FORMES_JURIDIQUES.filter((f) => f.group === group).map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectItem value={AUTRE}>Autre (saisir manuellement…)</SelectItem>
              </SelectContent>
            </Select>
            {formeJuridiqueSelectValue === AUTRE && (
              <Input
                className="mt-2"
                value={form.forme_juridique_autre}
                onChange={(e) => set('forme_juridique_autre', e.target.value)}
                placeholder="Libellé exact (ex. tel que renvoyé par l'API)"
              />
            )}
          </div>
          <div>
            <Label>Tranche d'effectif</Label>
            <Select
              value={form.tranche_effectif || NONE}
              onValueChange={(v) => set('tranche_effectif', v === NONE ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent className="z-[1300] max-h-72">
                <SelectItem value={NONE}>— Non renseigné</SelectItem>
                {TRANCHE_EFFECTIF_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{o.value}</span>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catégorie */}
          <div>
            <Label>Catégorie d'entreprise</Label>
            <Select
              value={form.categorie_entreprise || NONE}
              onValueChange={(v) => set('categorie_entreprise', v === NONE ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent className="z-[1300]">
                <SelectItem value={NONE}>— Non renseigné</SelectItem>
                {CATEGORIE_ENTREPRISE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />

          {/* Adresse */}
          <div className="sm:col-span-2">
            <Label>Adresse</Label>
            <Input value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </div>
          <div>
            <Label>Code postal</Label>
            <Input
              value={form.code_postal}
              onChange={e => set('code_postal', e.target.value)}
              onBlur={handleCpBlur}
              placeholder="33000"
              inputMode="numeric"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Le département et la région sont déduits automatiquement.
            </p>
          </div>
          <div>
            <Label>Ville</Label>
            <Input
              value={form.ville}
              onChange={e => set('ville', e.target.value)}
              placeholder="BORDEAUX"
            />
          </div>

          {/* Département + Région (codes INSEE — identiques aux filtres) */}
          <div>
            <Label>Département</Label>
            <div className="mt-1">
              <SearchableSelect
                value={form.departement || undefined}
                onChange={handleDeptChange}
                options={FRENCH_DEPARTMENTS_WITH_CODES}
                placeholder="Sélectionner un département…"
              />
            </div>
          </div>
          <div>
            <Label>Région</Label>
            <Select
              value={form.region || NONE}
              onValueChange={(v) => set('region', v === NONE ? '' : v)}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent className="z-[1300] max-h-72">
                <SelectItem value={NONE}>— Non renseigné</SelectItem>
                {FRENCH_REGIONS_WITH_CODES.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{r.code}</span>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags + Notes */}
          <div className="sm:col-span-2">
            <Label>Tags <span className="text-muted-foreground text-xs font-normal">(séparés par virgules)</span></Label>
            <Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="grand-compte, RSE, mécénat" />
          </div>

          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || (!form.denomination.trim() && !form.nom_complet.trim())}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Créer l'entreprise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
