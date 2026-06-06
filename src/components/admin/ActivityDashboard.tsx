import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, BarChart3, Camera, Headphones, FileText, Clock, User, TrendingUp, List } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import ActivityFiltersBar, { type ActivityPeriod, PERIOD_OPTIONS } from './ActivityFiltersBar';

const eventTypeLabels: Record<string, string> = {
  page_view: '📄 Vue page',
  tab_switch: '🔀 Onglet',
  media_upload: '📤 Upload',
  tool_use: '🛠 Outil',
  marche_view: '👁 Marche',
  session_start: '🟢 Connexion',
};

const tabLabels: Record<string, string> = {
  'tab:carte': 'Carte',
  'tab:marches': 'Marches',
  'tab:empreinte': 'Empreinte',
  'tab:apprendre': 'Apprendre',
  'tab:marcheurs': 'Marcheurs',
  'tab:messages': 'Messages',
  'tab:apprendre:biodiversite': 'Biodiversité',
  'tab:apprendre:bioacoustique': 'Bioacoustique',
  'tab:apprendre:geopoetique': 'Géopoétique',
};

const parseDateParam = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};
const fmtDateParam = (d: Date | null): string | null =>
  d ? format(d, 'yyyy-MM-dd') : null;

const ActivityDashboard: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const period = (params.get('period') as ActivityPeriod) || '7d';
  const eventId = params.get('event');
  const userFilter = params.get('user') || 'all';
  const viewMode = (params.get('view') as 'list' | 'chart') || 'list';
  const from = parseDateParam(params.get('from'));
  const to   = parseDateParam(params.get('to'));

  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all') p.delete(k);
      else p.set(k, v);
    });
    setParams(p, { replace: true });
  };

  // Compute RPC date bounds (ISO timestamptz) when period === 'custom'
  const { rpcStart, rpcEnd, periodLabel } = useMemo(() => {
    if (period === 'custom' && from && to) {
      const start = new Date(from); start.setHours(0, 0, 0, 0);
      const end   = new Date(to);   end.setHours(23, 59, 59, 999);
      return {
        rpcStart: start.toISOString(),
        rpcEnd:   end.toISOString(),
        periodLabel: `${format(start, 'dd/MM', { locale: fr })} → ${format(end, 'dd/MM', { locale: fr })}`,
      };
    }
    return {
      rpcStart: null as string | null,
      rpcEnd:   null as string | null,
      periodLabel: PERIOD_OPTIONS.find(o => o.value === period)?.label || period,
    };
  }, [period, from, to]);

  // Whether the dashboard query should fire (custom requires from+to)
  const filtersReady = period !== 'custom' || (!!from && !!to);

  const { data: globalStats } = useQuery({
    queryKey: ['activity-global-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activity_global_stats');
      if (error) throw error;
      return (data as unknown as Array<{
        active_sessions_7d: number; media_uploads_7d: number;
        most_popular_tab: string | null;
        most_active_user_id: string | null;
        most_active_prenom: string | null; most_active_nom: string | null;
        total_events_7d: number;
      }>)?.[0] || null;
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ['activity-dashboard', period, eventId, userFilter, rpcStart, rpcEnd],
    queryFn: async () => {
      const args: any = { p_period: period === 'custom' ? 'all' : period };
      if (eventId) args.p_event_id = eventId;
      if (userFilter !== 'all') args.p_user_filter = userFilter;
      if (rpcStart) args.p_start = rpcStart;
      if (rpcEnd)   args.p_end   = rpcEnd;
      const { data, error } = await supabase.rpc('get_marcheur_activity_dashboard' as any, args);
      if (error) throw error;
      return (data || []) as Array<{
        user_id: string; prenom: string | null; nom: string | null; role: string | null;
        last_seen: string; sessions_count: number; favorite_tabs: string[];
        photos_count: number; sounds_count: number; texts_count: number;
        explorations_viewed: number;
      }>;
    },
    enabled: filtersReady,
  });

  const { data: timeline } = useQuery({
    queryKey: ['activity-timeline', userFilter, period, eventId, rpcStart, rpcEnd],
    queryFn: async () => {
      const args: any = { p_limit: 100, p_period: period === 'custom' ? 'all' : period };
      if (userFilter !== 'all') args.p_user_filter = userFilter;
      if (eventId) args.p_event_id = eventId;
      if (rpcStart) args.p_start = rpcStart;
      if (rpcEnd)   args.p_end   = rpcEnd;
      const { data, error } = await supabase.rpc('get_activity_timeline' as any, args);
      if (error) throw error;
      return data as Array<{
        id: string; user_id: string; prenom: string | null; nom: string | null;
        event_type: string; event_target: string; exploration_id: string | null;
        marche_event_id: string | null; metadata: Record<string, unknown>; created_at: string;
      }>;
    },
    enabled: filtersReady,
  });

  const { data: chartData } = useQuery({
    queryKey: ['activity-chart', period, eventId, userFilter, rpcStart, rpcEnd],
    queryFn: async () => {
      const args: any = { p_period: period === 'custom' ? 'all' : period };
      if (eventId) args.p_event_id = eventId;
      if (userFilter !== 'all') args.p_user_filter = userFilter;
      if (rpcStart) args.p_start = rpcStart;
      if (rpcEnd)   args.p_end   = rpcEnd;
      const { data, error } = await supabase.rpc('get_activity_connections_chart' as any, args);
      if (error) throw error;
      return (data || []) as Array<{ period_label: string; connection_count: number }>;
    },
    enabled: viewMode === 'chart' && filtersReady,
  });

  // Compact label for the "Sessions (…)" column header
  const sessionsColLabel = useMemo(() => {
    switch (period) {
      case 'today': return "auj.";
      case 'yesterday': return "hier";
      case '7d': return '7 j';
      case 'month': return '30 j';
      case 'year': return '12 m';
      case 'all': return 'tout';
      case 'custom': return from && to ? `${format(from, 'dd/MM')}→${format(to, 'dd/MM')}` : '—';
      default: return period;
    }
  }, [period, from, to]);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Activité des marcheurs</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                  onClick={() => update({ view: null })}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'chart' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                  onClick={() => update({ view: 'chart' })}>
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI cards globaux 7 jours */}
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Indicateurs globaux — 7 derniers jours
      </p>
      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" /> Sessions
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{globalStats?.active_sessions_7d || 0}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Camera className="h-4 w-4" /> Médias
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{globalStats?.media_uploads_7d || 0}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <BarChart3 className="h-4 w-4" /> Onglet populaire
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground truncate">
            {globalStats?.most_popular_tab ? tabLabels[globalStats.most_popular_tab] || globalStats.most_popular_tab : '—'}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <User className="h-4 w-4" /> Plus actif
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground truncate">
            {globalStats?.most_active_prenom ? `${globalStats.most_active_prenom} ${globalStats.most_active_nom || ''}` : '—'}
          </p>
        </Card>
      </div>

      {/* Filtres */}
      <div className="mb-4">
        <ActivityFiltersBar
          period={period}
          eventId={eventId}
          userFilter={userFilter}
          from={from}
          to={to}
          marcheurs={dashboard || []}
          onPeriodChange={(p) => {
            if (p === 'custom') {
              update({ period: 'custom' });
            } else {
              update({ period: p === '7d' ? null : p, from: null, to: null });
            }
          }}
          onEventChange={(id) => update({ event: id })}
          onUserChange={(u) => update({ user: u })}
          onRangeChange={(f, t) => update({ from: fmtDateParam(f), to: fmtDateParam(t) })}
          onReset={() => update({ period: null, event: null, user: null, from: null, to: null })}
        />
        {period === 'custom' && !filtersReady && (
          <p className="text-xs text-muted-foreground mt-2 ml-1">
            Sélectionnez une date de début et de fin pour appliquer le filtre.
          </p>
        )}
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Per-marcheur table */}
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Détail par marcheur — <span className="text-muted-foreground font-normal">{periodLabel}</span>
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marcheur</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Sessions ({sessionsColLabel})</TableHead>
                  <TableHead>Onglets favoris</TableHead>
                  <TableHead><Camera className="h-3.5 w-3.5 inline" /></TableHead>
                  <TableHead><Headphones className="h-3.5 w-3.5 inline" /></TableHead>
                  <TableHead><FileText className="h-3.5 w-3.5 inline" /></TableHead>
                  <TableHead>Explorations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard?.map(row => (
                  <TableRow key={row.user_id}>
                    <TableCell className="font-medium">{row.prenom || '—'} {row.nom || ''}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.last_seen ? formatDistanceToNow(new Date(row.last_seen), { addSuffix: true, locale: fr }) : '—'}
                    </TableCell>
                    <TableCell>{row.sessions_count}</TableCell>
                    <TableCell className="text-xs">
                      {row.favorite_tabs?.map(t => tabLabels[t] || t).join(', ') || '—'}
                    </TableCell>
                    <TableCell>{row.photos_count}</TableCell>
                    <TableCell>{row.sounds_count}</TableCell>
                    <TableCell>{row.texts_count}</TableCell>
                    <TableCell>{row.explorations_viewed}</TableCell>
                  </TableRow>
                ))}
                {!dashboard?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Aucune activité sur cette période / cet événement.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Timeline */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5" />
              Timeline — <span className="text-muted-foreground font-normal">{periodLabel}</span>
            </h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {timeline?.map(event => (
                <div key={event.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0">
                    {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: fr })}
                  </span>
                  <span className="font-medium w-28 shrink-0 truncate">
                    {event.prenom || '?'} {event.nom || ''}
                  </span>
                  <span className="text-muted-foreground">
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </span>
                  <span className="text-foreground truncate">
                    {tabLabels[event.event_target] || event.event_target}
                  </span>
                </div>
              ))}
              {!timeline?.length && (
                <p className="text-center text-muted-foreground py-6 text-xs">
                  Aucun événement sur cette période / cet événement.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Connexions — <span className="text-muted-foreground font-normal">{periodLabel}</span>
          </h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period_label" tick={{ fontSize: 11 }} className="fill-muted-foreground" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'white', color: '#374151' }}
                  labelStyle={{ color: '#6b7280' }}
                  itemStyle={{ color: '#111827' }}
                  labelFormatter={label => `Période : ${label}`}
                  formatter={(value: number) => [`${value} connexion${value > 1 ? 's' : ''}`, 'Connexions']}
                />
                <Area type="monotone" dataKey="connection_count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ActivityDashboard;
