import React, { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, MapPin, CalendarDays, UserCheck, Mail, AlertCircle } from 'lucide-react';
import { useMarcheurEvents, type MarcheurEventRow } from '@/hooks/useMarcheurEvents';

interface Props {
  userId: string | undefined;
  enabled: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const temporalLabel = (iso: string) => {
  const t = new Date(iso).getTime();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(iso); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff > 0) return 'à venir';
  return 'passé';
};

const EventRow: React.FC<{ row: MarcheurEventRow }> = ({ row }) => {
  const isParticipant = row.relation === 'participant';
  const upcoming = new Date(row.date_marche).getTime() >= new Date().setHours(0, 0, 0, 0);
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition hover:border-primary/40 hover:bg-card/70">
      <div className="mt-1 flex-shrink-0">
        {isParticipant ? (
          <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
        ) : (
          <span className="block h-2.5 w-2.5 rounded-full border-2 border-amber-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>{formatDate(row.date_marche)}</span>
          <span className="opacity-60">·</span>
          <span className="opacity-80">{temporalLabel(row.date_marche)}</span>
          {isParticipant ? (
            <Badge variant="outline" className="ml-auto border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <UserCheck className="mr-1 h-3 w-3" />Participant
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto border-amber-500/40 bg-amber-500/10 text-amber-400">
              <Mail className="mr-1 h-3 w-3" />Invité · {row.invite_source === 'invitation' ? 'lien' : 'manuel'}
            </Badge>
          )}
        </div>
        <div className="mt-1 truncate text-sm font-medium text-foreground">{row.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {row.lieu && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />{row.lieu}
            </span>
          )}
          {row.exploration_name && (
            <>
              <span className="opacity-60">·</span>
              <span className="italic">{row.exploration_name}</span>
            </>
          )}
          {!isParticipant && row.invited_by_prenom && (
            <>
              <span className="opacity-60">·</span>
              <span>Invité par {row.invited_by_prenom}</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 transition group-hover:opacity-100"
        onClick={() => window.open(`/admin/marche-events?event=${row.event_id}`, '_blank')}
        title="Ouvrir l'événement"
      >
        <ArrowUpRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

const StatCard: React.FC<{ value: number; label: string; tone?: 'emerald' | 'amber' | 'sky' }> = ({ value, label, tone = 'sky' }) => {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-400'
    : tone === 'amber' ? 'text-amber-400' : 'text-sky-400';
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2.5">
      <div className={`text-xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
};

export const MarcheurEventsSection: React.FC<Props> = ({ userId, enabled }) => {
  const { data, isLoading, error, refetch } = useMarcheurEvents(userId, enabled);
  const [tab, setTab] = useState<'all' | 'participant' | 'invite'>('all');

  const stats = useMemo(() => {
    const rows = data ?? [];
    const today = new Date().setHours(0, 0, 0, 0);
    return {
      total: rows.length,
      participant: rows.filter(r => r.relation === 'participant').length,
      invite: rows.filter(r => r.relation === 'invite').length,
      upcoming: rows.filter(r => new Date(r.date_marche).getTime() >= today).length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (tab === 'all') return rows;
    return rows.filter(r => r.relation === tab);
  }, [data, tab]);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Événements</h3>

      <div className="grid grid-cols-3 gap-2">
        <StatCard value={stats.participant} label="Participant" tone="emerald" />
        <StatCard value={stats.invite} label="Invité" tone="amber" />
        <StatCard value={stats.upcoming} label="À venir" tone="sky" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Tous <span className="ml-1.5 text-xs opacity-60">{stats.total}</span></TabsTrigger>
          <TabsTrigger value="participant">Participant <span className="ml-1.5 text-xs opacity-60">{stats.participant}</span></TabsTrigger>
          <TabsTrigger value="invite">Invité <span className="ml-1.5 text-xs opacity-60">{stats.invite}</span></TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-2">
          {isLoading && (
            <>
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </>
          )}
          {error && !isLoading && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <span className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Impossible de charger les événements.
              </span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>Réessayer</Button>
            </div>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              {tab === 'all'
                ? "Cette personne n'est inscrite à aucun événement pour le moment."
                : tab === 'participant'
                ? "Aucune participation enregistrée."
                : "Aucune invitation enregistrée."}
            </div>
          )}
          {!isLoading && !error && filtered.map(row => (
            <EventRow key={`${row.relation}-${row.event_id}`} row={row} />
          ))}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default MarcheurEventsSection;
