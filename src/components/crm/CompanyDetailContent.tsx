import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, Trash2, X, ChevronsRight, Plus, Pencil, Star } from 'lucide-react';
import { ContactFormDialog } from './contacts/ContactFormDialog';
import {
  useCrmCompany,
  useCrmCompanyActivities,
  useUpdateCompanyStage,
  useUpdateCompany,
  useDeleteCompany,
  useAddCompanyActivity,
} from '@/hooks/useCrmCompanies';
import { CompanyLabelsChips } from './CompanyLabelsChips';
import { useCrmContacts, type CrmContactRow } from '@/hooks/useCrmContacts';
import { Crown, Mail, Phone, Linkedin } from 'lucide-react';
import {
  STAGE_LABELS,
  STAGE_MARKER_COLOR,
  type CrmCompanyStage,
  type CrmCompanyActivityType,
} from '@/types/crmCompany';
import { toast } from 'sonner';
import { formatNaf } from '@/lib/nafCatalog';
import { cn } from '@/lib/utils';
import { WebsiteField } from './company-tabs/WebsiteField';
import { CompanyOpportunitiesTab } from './company-tabs/CompanyOpportunitiesTab';
import { CompanyMarchesTab } from './company-tabs/CompanyMarchesTab';
import { CommercialLeversTab } from './company-tabs/CommercialLeversTab';

interface Props {
  companyId: string | null;
  onClose: () => void;
  mode?: 'sheet' | 'inline' | 'mobile-sheet';
}

const STAGES: CrmCompanyStage[] = ['suspect', 'prospect', 'client', 'inactif'];

export const CompanyDetailContent: React.FC<Props> = ({ companyId, onClose, mode = 'sheet' }) => {
  const { data: company } = useCrmCompany(companyId);
  const { data: activities = [] } = useCrmCompanyActivities(companyId);
  const updateStage = useUpdateCompanyStage();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const addActivity = useAddCompanyActivity();
  const { data: companyContacts = [] } = useCrmContacts({ companyId });

  const [notes, setNotes] = React.useState('');
  const [contactDialogOpen, setContactDialogOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<CrmContactRow | null>(null);
  const [newActivity, setNewActivity] = React.useState<{
    type: CrmCompanyActivityType;
    summary: string;
  }>({ type: 'note', summary: '' });

  React.useEffect(() => {
    setNotes(company?.notes ?? '');
  }, [company?.id]);

  if (!company) {
    return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  }

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

  const stageColor = STAGE_MARKER_COLOR[company.lifecycle_stage];
  const initials = (company.denomination ?? company.nom_complet ?? company.siren)
    .slice(0, 2)
    .toUpperCase();

  // Sort contacts with primary first
  const sortedContacts = [...companyContacts].sort((a, b) => {
    if (a.id === company.primary_contact_id) return -1;
    if (b.id === company.primary_contact_id) return 1;
    return 0;
  });

  const primaryContact = companyContacts.find((c) => c.id === company.primary_contact_id);

  const openContactCreate = () => { setEditingContact(null); setContactDialogOpen(true); };
  const openContactEdit = (c: CrmContactRow) => { setEditingContact(c); setContactDialogOpen(true); };

  const togglePrimary = (c: CrmContactRow) => {
    const newId = company.primary_contact_id === c.id ? null : c.id;
    updateCompany.mutate(
      { id: company.id, patch: { primary_contact_id: newId } as any },
      { onSuccess: () => toast.success(newId ? 'Contact principal défini' : 'Contact principal retiré') }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: mode === 'inline' ? 24 : 0, y: mode === 'mobile-sheet' ? 24 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      {/* Header hero */}
      <div
        className="relative px-4 pt-4 pb-3 border-b"
        style={{ background: `linear-gradient(135deg, ${stageColor}14 0%, hsl(var(--card)) 70%)` }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background border flex items-center justify-center transition-colors"
        >
          {mode === 'inline' ? <ChevronsRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>

        <div className="flex items-start gap-3 pr-12">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center text-base font-bold shrink-0 shadow-lg ring-1 ring-white/10"
            style={{
              background: `linear-gradient(135deg, ${stageColor} 0%, ${stageColor}aa 100%)`,
              color: 'white',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold tracking-tight leading-snug line-clamp-2 break-words">
              {company.denomination ?? company.nom_complet}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">SIREN {company.siren}</p>
            {primaryContact && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Contact principal · {[primaryContact.prenom, primaryContact.nom].filter(Boolean).join(' ') || primaryContact.email}
              </p>
            )}
            <CompanyLabelsChips complements={company.qualites_labels} className="mt-2" />
          </div>
        </div>

        {/* Stage pill switcher */}
        <div className="mt-3 inline-flex flex-wrap gap-1 p-1 rounded-full bg-muted/60 border relative">
          {STAGES.map((s) => {
            const active = company.lifecycle_stage === s;
            return (
              <button
                key={s}
                onClick={() => !active && updateStage.mutate({ id: company.id, stage: s })}
                className={cn(
                  'relative px-3 py-1 text-xs font-medium rounded-full transition-colors z-10',
                  active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`stage-pill-${mode}-${company.id}`}
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: STAGE_MARKER_COLOR[s] }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {STAGE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">

        <Tabs defaultValue="identite">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 justify-start sm:justify-stretch sm:grid sm:grid-cols-7 gap-0.5">
            <TabsTrigger value="identite" className="shrink-0">Identité</TabsTrigger>
            <TabsTrigger value="dirigeants" className="shrink-0">
              Contacts
              {companyContacts.length > 0 && <span className="ml-1 text-[10px] opacity-60">· {companyContacts.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="finances" className="shrink-0">
              Finances
              {finances.length > 0 && <span className="ml-1 text-[10px] opacity-60">· {finances.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="activites" className="shrink-0">
              Activités CRM
              {activities.length > 0 && <span className="ml-1 text-[10px] opacity-60">· {activities.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="opportunites" className="shrink-0">Opportunités</TabsTrigger>
            <TabsTrigger value="marches" className="shrink-0">Marches</TabsTrigger>
            <TabsTrigger value="leviers" className="shrink-0 gap-1">
              <span className="text-primary">✦</span> Leviers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identite" className="space-y-1 mt-4">
            <Row label="Forme juridique" value={company.forme_juridique} />
            <Row label="Catégorie" value={company.categorie_entreprise} />
            <Row label="Effectif" value={company.tranche_effectif} />
            <Row label="Activité (NAF/APE)" value={formatNaf(company.code_naf, company.libelle_naf) || '—'} />
            <Row
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Adresse"
              value={`${company.adresse ?? ''} ${company.code_postal ?? ''} ${company.ville ?? ''}`.trim() || '—'}
            />
            <Row
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Région / dépt"
              value={`${company.region ?? '—'}${company.departement ? ` · ${company.departement}` : ''}`}
            />

            <WebsiteField
              value={company.site_web ?? null}
              saving={updateCompany.isPending}
              onSave={(v) => updateCompany.mutate(
                { id: company.id, patch: { site_web: v } as any },
                { onSuccess: () => toast.success(v ? 'Site web enregistré' : 'Site web retiré') }
              )}
            />

            <div className="mt-5">
              <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1.5 resize-none"
                placeholder="Ajouter une note…"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={() =>
                    updateCompany.mutate(
                      { id: company.id, patch: { notes } as any },
                      { onSuccess: () => toast.success('Notes enregistrées') }
                    )
                  }
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dirigeants" className="space-y-2 mt-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={openContactCreate}>
                <Plus className="h-3.5 w-3.5" /> Nouveau contact
              </Button>
            </div>
            {sortedContacts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun contact rattaché.</p>
            )}
            {sortedContacts.map((c) => {
              const fullName = [c.prenom, c.nom].filter(Boolean).join(' ') || c.email || '—';
              const isPrimary = c.id === company.primary_contact_id;
              return (
                <div
                  key={c.id}
                  className={cn(
                    'p-3 rounded-lg border bg-card/60 text-sm space-y-1 transition-all',
                    isPrimary && 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-transparent shadow-[0_0_20px_-10px_rgb(245,158,11)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium flex items-center gap-1.5 min-w-0">
                      {c.is_dirigeant && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="truncate">{fullName}</span>
                      {isPrimary && (
                        <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] h-5 px-1.5">
                          Principal
                        </Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          'h-7 w-7',
                          isPrimary ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
                        )}
                        title={isPrimary ? 'Retirer comme principal' : 'Définir comme contact principal'}
                        onClick={() => togglePrimary(c)}
                      >
                        <Star className={cn('h-3.5 w-3.5', isPrimary && 'fill-current')} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Éditer"
                        onClick={() => openContactEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {(c.fonction || c.qualite) && (
                    <p className="text-xs text-muted-foreground">{c.fonction || c.qualite}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-0.5">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3 w-3" /> {c.email}
                      </a>
                    )}
                    {c.telephone && (
                      <a href={`tel:${c.telephone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3 w-3" /> {c.telephone}
                      </a>
                    )}
                    {c.linkedin_url && (
                      <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                        <Linkedin className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="finances" className="space-y-1.5 mt-4">
            {finances.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune donnée financière disponible.
              </p>
            )}
            {finances.map((f: any) => (
              <div
                key={f.year ?? Math.random()}
                className="grid grid-cols-3 gap-2 text-sm border-b border-border/40 py-2"
              >
                <span className="font-semibold">{f.year}</span>
                <span className="text-muted-foreground text-xs">
                  CA <span className="text-foreground font-medium">{f.ca != null ? Number(f.ca).toLocaleString('fr-FR') + ' €' : '—'}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  RN <span className="text-foreground font-medium">{f.resultat_net != null ? Number(f.resultat_net).toLocaleString('fr-FR') + ' €' : '—'}</span>
                </span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="activites" className="space-y-3 mt-4">
            <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Nouvelle activité</p>
              <div className="flex gap-2">
                <Select
                  value={newActivity.type}
                  onValueChange={(v) => setNewActivity((s) => ({ ...s, type: v as any }))}
                >
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
                  rows={2}
                  placeholder="Résumé…"
                  value={newActivity.summary}
                  onChange={(e) => setNewActivity((s) => ({ ...s, summary: e.target.value }))}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!newActivity.summary.trim()}
                  onClick={() => {
                    addActivity.mutate(
                      { company_id: company.id, type: newActivity.type, summary: newActivity.summary },
                      { onSuccess: () => setNewActivity({ type: 'note', summary: '' }) }
                    );
                  }}
                >
                  Ajouter
                </Button>
              </div>
            </div>

            {activities.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border bg-card/60 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(a.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                {a.summary && <p className="mt-1.5 whitespace-pre-wrap">{a.summary}</p>}
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune activité.</p>
            )}
          </TabsContent>

          <TabsContent value="opportunites">
            <CompanyOpportunitiesTab
              companyId={company.id}
              companyName={company.denomination ?? company.nom_complet ?? company.siren}
            />
          </TabsContent>

          <TabsContent value="marches">
            <CompanyMarchesTab companyId={company.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky footer */}
      <div
        className={cn(
          'border-t bg-card/80 backdrop-blur px-5 py-2.5 flex justify-end',
          mode === 'mobile-sheet' && 'pr-20 pb-[max(0.625rem,env(safe-area-inset-bottom))]'
        )}
      >
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
          onClick={() => {
            if (confirm('Supprimer cette entreprise du CRM ?')) {
              deleteCompany.mutate(company.id, { onSuccess: onClose });
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </Button>
      </div>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={(o) => { setContactDialogOpen(o); if (!o) setEditingContact(null); }}
        contact={editingContact}
        defaultCompanyId={company.id}
        defaultEntreprise={company.denomination ?? company.nom_complet ?? null}
      />
    </motion.div>
  );
};

const Row: React.FC<{ icon?: React.ReactNode; label: string; value: string | null | undefined }> = ({
  icon,
  label,
  value,
}) => (
  <div className="grid grid-cols-[110px_1fr] gap-3 items-baseline py-2 border-b border-border/40 text-sm">
    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <span className="font-medium break-words">{value || '—'}</span>
  </div>
);
