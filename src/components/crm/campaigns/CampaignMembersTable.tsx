import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, ExternalLink, Search, Phone, Megaphone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CALL_STATUS_META,
  type CallStatus,
  type CampaignCanal,
  type CrmCampaignMember,
} from '@/types/crmCampaign';
import { KANBAN_COLUMNS } from '@/types/crm';
import { useCampaignMemberMutations } from '@/hooks/useCrmCampaigns';
import { TransferCampaignDialog } from './TransferCampaignDialog';
import type { TransferTarget } from '@/hooks/useCrmCampaigns';
import {
  ENGAGEMENT_META,
  engagementOf,
  nextActionOf,
  type EngagementStatus,
} from '@/lib/crm/campaignChannel';

interface Props {
  campaignId: string;
  campaignName?: string;
  members: CrmCampaignMember[];
  onCall: (memberId: string) => void;
  canal?: CampaignCanal;
}

const STATUSES = Object.keys(CALL_STATUS_META) as CallStatus[];
const ENGAGEMENTS = Object.keys(ENGAGEMENT_META) as EngagementStatus[];

const fmtDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';

export const CampaignMembersTable: React.FC<Props> = ({
  campaignId,
  campaignName,
  members,
  onCall,
  canal = 'telephone',
}) => {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<string>('all');
  const { removeMember } = useCampaignMemberMutations(campaignId);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [transferTargets, setTransferTargets] = React.useState<TransferTarget[] | null>(null);
  const [transferLabel, setTransferLabel] = React.useState<string | undefined>();

  /* Au téléphone on filtre par issue d'appel ; dès qu'il y a de l'email,
     on filtre par statut d'engagement consolidé. */
  const useEngagement = canal !== 'telephone';

  const filtered = members.filter((m) => {
    if (status !== 'all') {
      const key = useEngagement ? engagementOf(m) : (m.call_status as string);
      if (key !== status) return false;
    }
    if (!q.trim()) return true;
    const name = `${m.company?.nom_complet ?? ''} ${m.company?.denomination ?? ''} ${m.company?.ville ?? ''}`;
    return name.toLowerCase().includes(q.toLowerCase());
  });

  const allChecked = filtered.length > 0 && filtered.every((m) => selectedIds.includes(m.id));
  const toggleAll = () =>
    setSelectedIds(allChecked ? [] : filtered.map((m) => m.id));
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const openTransfer = (ids: string[], label?: string) => {
    setTransferTargets(ids.map((id) => ({ memberId: id })));
    setTransferLabel(label);
  };



  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatus('all')}
            className={`rounded-full border px-3 py-1 text-xs ${
              status === 'all' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
            }`}
          >
            Tous ({members.length})
          </button>
          {useEngagement
            ? ENGAGEMENTS.map((s) => {
                const n = members.filter((m) => engagementOf(m) === s).length;
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="rounded-full border px-3 py-1 text-xs transition-all"
                    style={
                      active
                        ? {
                            background: `hsl(${ENGAGEMENT_META[s].hue})`,
                            color: 'white',
                            borderColor: 'transparent',
                          }
                        : undefined
                    }
                  >
                    {ENGAGEMENT_META[s].label} ({n})
                  </button>
                );
              })
            : STATUSES.map((s) => {
                const n = members.filter((m) => m.call_status === s).length;
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="rounded-full border px-3 py-1 text-xs transition-all"
                    style={
                      active
                        ? { background: `hsl(${CALL_STATUS_META[s].hue})`, color: 'white', borderColor: 'transparent' }
                        : undefined
                    }
                  >
                    {CALL_STATUS_META[s].label} ({n})
                  </button>
                );
              })}

        </div>
      </div>

      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2"
        >
          <span className="text-xs font-medium text-primary">
            {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => openTransfer(selectedIds, `${selectedIds.length} prospects`)}
          >
            <Megaphone className="mr-1.5 h-3.5 w-3.5" />
            Transférer vers une campagne
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
            Annuler la sélection
          </Button>
        </motion.div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Tout sélectionner" />
              </TableHead>
              <TableHead>Prospect</TableHead>
              <TableHead>{useEngagement ? 'Engagement' : "Statut d'appel"}</TableHead>
              <TableHead>{useEngagement ? 'Touches' : 'Tentatives'}</TableHead>
              <TableHead>Dernier contact</TableHead>
              <TableHead>{useEngagement ? 'Prochaine action' : 'Rappel'}</TableHead>
              <TableHead className="text-right">Actions</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Aucun prospect dans cette vue.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const meta = CALL_STATUS_META[m.call_status as CallStatus];
                const eng = ENGAGEMENT_META[engagementOf(m)];
                const next = nextActionOf(m, canal);
                const label = m.company?.nom_complet ?? m.company?.denomination ?? 'Ce prospect';

                return (
                  <motion.tr
                    key={m.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b last:border-0"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(m.id)}
                        onCheckedChange={() => toggleOne(m.id)}
                        aria-label={`Sélectionner ${label}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="truncate font-medium">
                        {m.company?.nom_complet ?? m.company?.denomination ?? '—'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[m.company?.ville, m.company?.libelle_naf].filter(Boolean).join(' · ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                        style={{
                          background: `hsl(${useEngagement ? eng.hue : meta?.hue ?? '220 10% 50%'})`,
                        }}
                      >
                        {useEngagement ? eng.label : meta?.label ?? m.call_status}
                      </span>
                      {m.refus_motif && (
                        <div className="mt-1 text-[11px] text-muted-foreground">{m.refus_motif}</div>
                      )}
                      {(m as any).opportunity?.statut && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Pipeline ·{' '}
                          {KANBAN_COLUMNS.find((c) => c.id === (m as any).opportunity.statut)?.title ??
                            (m as any).opportunity.statut}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {useEngagement ? (
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {m.attempts ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {m.emails_sent ?? 0}
                          </span>
                        </span>
                      ) : (
                        m.attempts
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {useEngagement
                        ? fmtDay(
                            [m.last_call_at, m.last_email_at]
                              .filter(Boolean)
                              .sort()
                              .slice(-1)[0] as string | undefined,
                          )
                        : fmtDay(m.last_call_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {useEngagement ? (
                        next ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs ${
                              next.due ? 'font-medium text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            {next.canal === 'email' ? (
                              <Mail className="h-3 w-3" />
                            ) : (
                              <Phone className="h-3 w-3" />
                            )}
                            {next.label}
                            {next.at && !next.due ? ` · ${fmtDay(next.at)}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Clos</span>
                        )
                      ) : (
                        fmtDay(m.next_call_at)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onCall(m.id)}>
                          {useEngagement && next?.canal === 'email' ? (
                            <Mail className="h-3.5 w-3.5" />
                          ) : (
                            <Phone className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Transférer vers une autre campagne"
                          onClick={() => openTransfer([m.id], label)}
                        >
                          <Megaphone className="h-3.5 w-3.5" />
                        </Button>
                        {m.opportunity_id && (
                          <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                            <Link to={`/admin/crm/pipeline?opportunity=${m.opportunity_id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeMember.mutate(m.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TransferCampaignDialog
        open={!!transferTargets}
        onOpenChange={(o) => { if (!o) setTransferTargets(null); }}
        targets={transferTargets ?? []}
        currentCampaignId={campaignId}
        currentCampaignName={campaignName}
        subjectLabel={transferLabel}
        onDone={() => setSelectedIds([])}
      />
    </div>
  );
};
