import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Calendar, Trash2, X, ChevronsRight } from 'lucide-react';
import {
  useCrmCompany,
  useCrmCompanyActivities,
  useUpdateCompanyStage,
  useUpdateCompany,
  useDeleteCompany,
  useAddCompanyActivity,
} from '@/hooks/useCrmCompanies';
import { CompanyLabelsChips } from './CompanyLabelsChips';
import {
  STAGE_LABELS,
  STAGE_MARKER_COLOR,
  type CrmCompanyStage,
  type CrmCompanyActivityType,
} from '@/types/crmCompany';
import { toast } from 'sonner';
import { formatNaf } from '@/lib/nafCatalog';
import { cn } from '@/lib/utils';

interface Props {
  companyId: string | null;
  onClose: () => void;
  /** "sheet" = inside a Radix Sheet (default), "inline" = side panel, "mobile-sheet" = bottom sheet */
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

  const [notes, setNotes] = React.useState('');
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

  const stageColor = STAGE_MARKER_COLOR[company.lifecycle_stage];
  const initials = (company.denomination ?? company.nom_complet ?? company.siren)
    .slice(0, 2)
    .toUpperCase();

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
        style={{
          background: `linear-gradient(135deg, ${stageColor}14 0%, hsl(var(--card)) 70%)`,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background border flex items-center justify-center transition-colors"
        >
          {mode === 'inline' ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
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
                onClick={() =>
                  !active && updateStage.mutate({ id: company.id, stage: s })
                }
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
          <TabsList className="grid grid-cols-4 w-full bg-muted/50">
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="dirigeants">
              Dirigeants
              {dirigeants.length > 0 && (
                <span className="ml-1 text-[10px] opacity-60">· {dirigeants.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="finances">
              Finances
              {finances.length > 0 && (
                <span className="ml-1 text-[10px] opacity-60">· {finances.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activites">
              Activités
              {activities.length > 0 && (
                <span className="ml-1 text-[10px] opacity-60">· {activities.length}</span>
              )}
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
            {dirigeants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun dirigeant connu.</p>
            )}
            {dirigeants.map((d, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card/60 text-sm">
                <p className="font-medium">{[d.prenoms, d.nom].filter(Boolean).join(' ')}</p>
                <p className="text-xs text-muted-foreground">{d.qualite ?? d.type_dirigeant ?? '—'}</p>
              </div>
            ))}
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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
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
