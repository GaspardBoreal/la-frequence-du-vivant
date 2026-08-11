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
import { Trash2, ExternalLink, Search, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  CALL_STATUS_META,
  type CallStatus,
  type CrmCampaignMember,
} from '@/types/crmCampaign';
import { useCampaignMemberMutations } from '@/hooks/useCrmCampaigns';

interface Props {
  campaignId: string;
  members: CrmCampaignMember[];
  onCall: (memberId: string) => void;
}

const STATUSES = Object.keys(CALL_STATUS_META) as CallStatus[];

export const CampaignMembersTable: React.FC<Props> = ({ campaignId, members, onCall }) => {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<CallStatus | 'all'>('all');
  const { removeMember } = useCampaignMemberMutations(campaignId);

  const filtered = members.filter((m) => {
    if (status !== 'all' && m.call_status !== status) return false;
    if (!q.trim()) return true;
    const name = `${m.company?.nom_complet ?? ''} ${m.company?.denomination ?? ''} ${m.company?.ville ?? ''}`;
    return name.toLowerCase().includes(q.toLowerCase());
  });

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
          {STATUSES.map((s) => {
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prospect</TableHead>
              <TableHead>Statut d'appel</TableHead>
              <TableHead>Tentatives</TableHead>
              <TableHead>Dernier appel</TableHead>
              <TableHead>Rappel</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Aucun prospect dans cette vue.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const meta = CALL_STATUS_META[m.call_status as CallStatus];
                return (
                  <motion.tr
                    key={m.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b last:border-0"
                  >
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
                        style={{ background: `hsl(${meta?.hue ?? '220 10% 50%'})` }}
                      >
                        {meta?.label ?? m.call_status}
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
                    <TableCell className="text-sm">{m.attempts}</TableCell>
                    <TableCell className="text-sm">
                      {m.last_call_at ? new Date(m.last_call_at).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.next_call_at ? new Date(m.next_call_at).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onCall(m.id)}>
                          <Phone className="h-3.5 w-3.5" />
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
    </div>
  );
};
