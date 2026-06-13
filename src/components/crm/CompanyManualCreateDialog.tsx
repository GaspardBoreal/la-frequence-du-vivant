import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useImportCompanies } from '@/hooks/useCrmCompanies';
import type { CrmCompanyStage } from '@/types/crmCompany';
import { STAGE_LABELS } from '@/types/crmCompany';

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
  tranche_effectif: string;
  categorie_entreprise: string;
  etat_administratif: string;
  adresse: string;
  code_postal: string;
  ville: string;
  departement: string;
  region: string;
  notes: string;
  tags: string;
};

const EMPTY: Form = {
  siren: '', denomination: '', nom_complet: '', lifecycle_stage: 'suspect',
  code_naf: '', libelle_naf: '', forme_juridique: '', tranche_effectif: '',
  categorie_entreprise: '', etat_administratif: 'A',
  adresse: '', code_postal: '', ville: '', departement: '', region: '',
  notes: '', tags: '',
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      const siren = form.siren.replace(/\D/g, '');
      const denomination = form.denomination.trim() || form.nom_complet.trim();
      if (!denomination) throw new Error('La dénomination est obligatoire');
      const payload: any = {
        siren: siren || `MAN${Date.now().toString().slice(-9)}`,
        denomination,
        nom_complet: form.nom_complet.trim() || denomination,
        lifecycle_stage: form.lifecycle_stage,
        code_naf: form.code_naf.trim() || null,
        libelle_naf: form.libelle_naf.trim() || null,
        forme_juridique: form.forme_juridique.trim() || null,
        tranche_effectif: form.tranche_effectif.trim() || null,
        categorie_entreprise: form.categorie_entreprise.trim() || null,
        etat_administratif: form.etat_administratif.trim() || null,
        adresse: form.adresse.trim() || null,
        code_postal: form.code_postal.trim() || null,
        ville: form.ville.trim() || null,
        departement: form.departement.trim() || null,
        region: form.region.trim() || null,
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
            Les mêmes champs qu'à l'import API. Si vous avez un SIREN valide, vous pouvez aussi déclencher l'import API officiel pour pré-remplir automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 mt-2">
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

          <div className="sm:col-span-2">
            <Label>Dénomination *</Label>
            <Input value={form.denomination} onChange={e => set('denomination', e.target.value)} placeholder="Nom commercial / raison sociale" />
          </div>
          <div className="sm:col-span-2">
            <Label>Nom complet</Label>
            <Input value={form.nom_complet} onChange={e => set('nom_complet', e.target.value)} />
          </div>

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
                <SelectItem value="A">Active</SelectItem>
                <SelectItem value="C">Cessée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Code NAF</Label>
            <Input value={form.code_naf} onChange={e => set('code_naf', e.target.value)} placeholder="00.00A" />
          </div>
          <div>
            <Label>Libellé NAF</Label>
            <Input value={form.libelle_naf} onChange={e => set('libelle_naf', e.target.value)} />
          </div>

          <div>
            <Label>Forme juridique</Label>
            <Input value={form.forme_juridique} onChange={e => set('forme_juridique', e.target.value)} placeholder="SAS, SARL…" />
          </div>
          <div>
            <Label>Tranche d'effectif</Label>
            <Input value={form.tranche_effectif} onChange={e => set('tranche_effectif', e.target.value)} placeholder="ex. 10-19" />
          </div>

          <div>
            <Label>Catégorie d'entreprise</Label>
            <Input value={form.categorie_entreprise} onChange={e => set('categorie_entreprise', e.target.value)} placeholder="PME / ETI / GE" />
          </div>
          <div />

          <div className="sm:col-span-2">
            <Label>Adresse</Label>
            <Input value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </div>
          <div>
            <Label>Code postal</Label>
            <Input value={form.code_postal} onChange={e => set('code_postal', e.target.value)} />
          </div>
          <div>
            <Label>Ville</Label>
            <Input value={form.ville} onChange={e => set('ville', e.target.value)} />
          </div>
          <div>
            <Label>Département</Label>
            <Input value={form.departement} onChange={e => set('departement', e.target.value)} />
          </div>
          <div>
            <Label>Région</Label>
            <Input value={form.region} onChange={e => set('region', e.target.value)} />
          </div>

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
