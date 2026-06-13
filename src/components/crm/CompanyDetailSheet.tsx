import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Phone, Mail, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { useCrmCompany, useCrmCompanyActivities, useUpdateCompanyStage, useUpdateCompany, useDeleteCompany, useAddCompanyActivity } from '@/hooks/useCrmCompanies';
import { CompanyStageBadge } from './CompanyStageBadge';
import { CompanyLabelsChips } from './CompanyLabelsChips';
import { STAGE_LABELS, type CrmCompanyStage, type CrmCompanyActivityType } from '@/types/crmCompany';
import { toast } from 'sonner';
import { formatNaf } from '@/lib/nafCatalog';

interface Props {
  companyId: string | null;
  onOpenChange: (open: boolean) => void;
}

export const CompanyDetailSheet: React.FC<Props> = ({ companyId, onOpenChange }) => {
  const open = !!companyId;
  const { data: company } = useCrmCompany(companyId);
  const { data: activities = [] } = useCrmCompanyActivities(companyId);
  const updateStage = useUpdateCompanyStage();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const addActivity = useAddCompanyActivity();

  const [notes, setNotes] = React.useState('');
  const [newActivity, setNewActivity] = React.useState<{ type: CrmCompanyActivityType; summary: string }>({ type: 'note', summary: '' });

  React.useEffect(() => { setNotes(company?.notes ?? ''); }, [company?.id]);

  if (!company) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="p-8 text-center text-muted-foreground">Chargement…</div>
        </SheetContent>
      </Sheet>
    );
  }

  const dirigeants = Array.isArray(company.dirigeants) ? (company.dirigeants as any[]) : [];
  const financesRaw = company.finances;
  const finances: any[] = Array.isArray(financesRaw)
    ? financesRaw
    : financesRaw && typeof financesRaw === 'object'
      ? Object.entries(financesRaw as Record<string, any>).map(([year, vals]) => ({
          year,
          ca: vals?.ca ?? null,
          resultat_net: vals?.resultat_net ?? null,
        }))
      : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {(company.denomination ?? company.nom_complet ?? company.siren).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="leading-tight">{company.denomination ?? company.nom_complet}</SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">SIREN {company.siren}</span>
                <CompanyStageBadge stage={company.lifecycle_stage} />
              </div>
              <CompanyLabelsChips complements={company.qualites_labels} className="mt-2" />
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap gap-2">
          <Select value={company.lifecycle_stage} onValueChange={(v) => updateStage.mutate({ id: company.id, stage: v as CrmCompanyStage })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['suspect', 'prospect', 'client', 'inactif'] as CrmCompanyStage[]).map(s => (
                <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {company.lifecycle_stage !== 'prospect' && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStage.mutate({ id: company.id, stage: 'prospect' })}>
              <ArrowRight className="h-3.5 w-3.5" /> Passer en Prospect
            </Button>
          )}
          {company.lifecycle_stage !== 'client' && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStage.mutate({ id: company.id, stage: 'client' })}>
              <ArrowRight className="h-3.5 w-3.5" /> Passer en Client
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => {
            if (confirm('Supprimer cette entreprise du CRM ?')) {
              deleteCompany.mutate(company.id, { onSuccess: () => onOpenChange(false) });
            }
          }}>
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </Button>
        </div>

        <Tabs defaultValue="identite" className="mt-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="dirigeants">Dirigeants</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
            <TabsTrigger value="activites">Activités</TabsTrigger>
          </TabsList>

          <TabsContent value="identite" className="space-y-3 mt-4">
            <Row icon={<Building2 className="h-4 w-4" />} label="Forme juridique" value={company.forme_juridique} />
            <Row icon={<Building2 className="h-4 w-4" />} label="Catégorie" value={company.categorie_entreprise} />
            <Row icon={<Building2 className="h-4 w-4" />} label="Effectif" value={company.tranche_effectif} />
            <Row icon={<Building2 className="h-4 w-4" />} label="Activité (NAF/APE)" value={formatNaf(company.code_naf, company.libelle_naf) || '—'} />
            <Row icon={<MapPin className="h-4 w-4" />} label="Adresse" value={`${company.adresse ?? ''} ${company.code_postal ?? ''} ${company.ville ?? ''}`.trim()} />
            <Row icon={<MapPin className="h-4 w-4" />} label="Région / dépt" value={`${company.region ?? '—'}${company.departement ? ` · ${company.departement}` : ''}`} />

            <div className="mt-4">
              <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="mt-1" />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={() => updateCompany.mutate({ id: company.id, patch: { notes } as any }, { onSuccess: () => toast.success('Notes enregistrées') })}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dirigeants" className="space-y-2 mt-4">
            {dirigeants.length === 0 && <p className="text-sm text-muted-foreground">Aucun dirigeant connu.</p>}
            {dirigeants.map((d, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card text-sm">
                <p className="font-medium">{[d.prenoms, d.nom].filter(Boolean).join(' ')}</p>
                <p className="text-xs text-muted-foreground">{d.qualite ?? d.type_dirigeant ?? '—'}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="finances" className="space-y-2 mt-4">
            {finances.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée financière disponible via l'API.</p>}
            {finances.map((f: any) => (
              <div key={f.year ?? Math.random()} className="flex justify-between text-sm border-b py-2">
                <span className="font-medium">{f.year}</span>
                <span>CA: {f.ca != null ? Number(f.ca).toLocaleString('fr-FR') + ' €' : '—'}</span>
                <span>RN: {f.resultat_net != null ? Number(f.resultat_net).toLocaleString('fr-FR') + ' €' : '—'}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="activites" className="space-y-3 mt-4">
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-xs font-medium">Nouvelle activité</p>
              <div className="flex gap-2">
                <Select value={newActivity.type} onValueChange={(v) => setNewActivity(s => ({ ...s, type: v as any }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appel">📞 Appel</SelectItem>
                    <SelectItem value="mail">✉️ Mail</SelectItem>
                    <SelectItem value="rdv">📅 RDV</SelectItem>
                    <SelectItem value="note">📝 Note</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  rows={2} placeholder="Résumé…" value={newActivity.summary}
                  onChange={e => setNewActivity(s => ({ ...s, summary: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" disabled={!newActivity.summary.trim()} onClick={() => {
                  addActivity.mutate({ company_id: company.id, type: newActivity.type, summary: newActivity.summary }, {
                    onSuccess: () => setNewActivity({ type: 'note', summary: '' }),
                  });
                }}>Ajouter</Button>
              </div>
            </div>

            {activities.map(a => (
              <div key={a.id} className="p-3 rounded-lg border bg-card text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{new Date(a.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                {a.summary && <p className="mt-1.5 whitespace-pre-wrap">{a.summary}</p>}
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune activité.</p>}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string | null | undefined }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm border-b pb-2">
    <div className="text-muted-foreground mt-0.5">{icon}</div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  </div>
);
