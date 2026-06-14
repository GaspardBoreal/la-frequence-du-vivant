import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Euro, Users, Calendar, MoreVertical, Pencil, Trash2, Unlink2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OpportunityForm } from '@/components/crm/OpportunityForm';
import { useCompanyOpportunities, type CompanyOpportunityRow } from '@/hooks/useCompanyOpportunities';
import { useCrmOpportunities } from '@/hooks/useCrmOpportunities';
import { KANBAN_COLUMNS, type CrmOpportunity } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  companyId: string;
  companyName: string;
}

export const CompanyOpportunitiesTab: React.FC<Props> = ({ companyId, companyName }) => {
  const { data: opportunities = [], isLoading } = useCompanyOpportunities(companyId);
  const { createOpportunity, updateOpportunity, deleteOpportunity } = useCrmOpportunities();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CrmOpportunity | null>(null);

  const handleSubmit = async (data: any) => {
    const { linkedCompanies, linkedContacts, ...rest } = data;
    const TEXT_NULLABLE = ['titre', 'entreprise', 'fonction', 'telephone', 'experience_souhaitee',
      'format_souhaite', 'lieu_prefere', 'objectifs', 'financement_souhaite',
      'source', 'notes', 'date_souhaitee', 'assigned_to'];
    const NUM_NULLABLE = ['budget_estime', 'nombre_participants'];
    const payload: any = { ...rest };
    for (const k of TEXT_NULLABLE) if (payload[k] === '' || payload[k] === undefined) payload[k] = null;
    for (const k of NUM_NULLABLE) {
      const v = payload[k];
      payload[k] = v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? null : Number(v);
    }
    const primary = (linkedCompanies || []).find((c: any) => c.role === 'primary');
    if (primary) payload.company_id = primary.company_id;

    try {
      let oppId = editing?.id;
      if (editing) {
        const res = await updateOpportunity.mutateAsync({ id: editing.id, ...payload });
        oppId = (res as any)?.id ?? editing.id;
      } else {
        const res = await createOpportunity.mutateAsync(payload);
        oppId = (res as any)?.id;
      }
      if (oppId) {
        const { syncOpportunityLinks } = await import('@/hooks/useCrmOpportunityLinks');
        await syncOpportunityLinks(oppId, linkedCompanies || [], linkedContacts || []);
      }
      qc.invalidateQueries({ queryKey: ['crm-company-opportunities', companyId] });
    } finally {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const handleUnlink = async (opportunityId: string) => {
    const { error } = await supabase
      .from('crm_opportunity_companies')
      .delete()
      .eq('opportunity_id', opportunityId)
      .eq('company_id', companyId);
    if (error) toast.error(error.message);
    else {
      toast.success('Opportunité déliée');
      qc.invalidateQueries({ queryKey: ['crm-company-opportunities', companyId] });
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="relative w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:border-primary/60 hover:shadow-[0_0_30px_-10px_hsl(var(--primary))] transition-all overflow-hidden"
      >
        <Sparkles className="h-4 w-4" />
        Nouvelle opportunité
        <Plus className="h-4 w-4" />
      </motion.button>

      {isLoading && (
        <div className="text-center py-8 text-sm text-muted-foreground">Chargement…</div>
      )}

      {!isLoading && opportunities.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed bg-muted/20">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-1">Aucune opportunité pour cette entreprise.</p>
          <p className="text-xs text-muted-foreground/70">Lancez la première dès maintenant ✨</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {opportunities.map((opp) => (
            <OpportunityMiniCard
              key={opp.id}
              opp={opp}
              onEdit={() => { setEditing(opp); setFormOpen(true); }}
              onUnlink={() => handleUnlink(opp.id)}
              onDelete={() => {
                if (confirm('Supprimer définitivement cette opportunité ?')) {
                  deleteOpportunity.mutate(opp.id, {
                    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-company-opportunities', companyId] }),
                  });
                }
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <OpportunityForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        opportunity={editing}
        onSubmit={handleSubmit}
        defaultLinkedCompany={editing ? null : { company_id: companyId, role: 'primary', denomination: companyName }}
      />
    </div>
  );
};

const OpportunityMiniCard: React.FC<{
  opp: CompanyOpportunityRow;
  onEdit: () => void;
  onUnlink: () => void;
  onDelete: () => void;
}> = ({ opp, onEdit, onUnlink, onDelete }) => {
  const column = KANBAN_COLUMNS.find((c) => c.id === opp.statut);
  const subtitle = opp.experience_souhaitee ||
    [opp.prenom, opp.nom].filter(Boolean).join(' ') ||
    opp.entreprise ||
    'Opportunité';
  const titre = (opp.titre || '').trim();
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="group relative rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all"
      onClick={onEdit}
    >
      <div className={cn('h-1.5 w-full', column?.color ?? 'bg-muted')} />

      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {titre && (
              <h4 className="font-semibold text-base leading-tight line-clamp-2 mb-0.5">{titre}</h4>
            )}
            <div className={cn('leading-tight line-clamp-2', titre ? 'text-sm text-muted-foreground' : 'font-semibold text-sm')}>
              {subtitle}
            </div>
            {column && (
              <Badge variant="outline" className="mt-1.5 text-[10px] h-5 px-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full mr-1', column.color)} />
                {column.title}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {opp.assigned_member && (
              <div
                title={`${opp.assigned_member.prenom} ${opp.assigned_member.nom}`}
                className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-[10px] font-bold text-primary-foreground ring-2 ring-card"
              >
                {opp.assigned_member.prenom?.[0]}{opp.assigned_member.nom?.[0]}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" /> Modifier</DropdownMenuItem>
                <DropdownMenuItem onClick={onUnlink}><Unlink2 className="h-3.5 w-3.5 mr-2" /> Délier de l'entreprise</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          {opp.budget_estime != null && (
            <span className="inline-flex items-center gap-1">
              <Euro className="h-3 w-3" />
              <span className="text-foreground font-medium">{Number(opp.budget_estime).toLocaleString('fr-FR')} €</span>
            </span>
          )}
          {opp.nombre_participants != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="text-foreground font-medium">{opp.nombre_participants}</span>
            </span>
          )}
          {fmtDate(opp.date_souhaitee) && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-foreground font-medium">{fmtDate(opp.date_souhaitee)}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
