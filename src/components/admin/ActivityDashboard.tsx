import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, BarChart3, Camera, Headphones, FileText, Clock, User, TrendingUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const ActivityDashboard: React.FC = () => {
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  const { data: globalStats } = useQuery({
    queryKey: ['activity-global-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activity_global_stats');
      if (error) throw error;
      return (data as unknown as Array<{
        active_sessions_7d: number;
        media_uploads_7d: number;
        most_popular_tab: string | null;
        most_active_user_id: string | null;
        most_active_prenom: string | null;
        most_active_nom: string | null;
        total_events_7d: number;
      }>)?.[0] || null;
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ['activity-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_marcheur_activity_dashboard');
      if (error) throw error;
      return data as Array<{
        user_id: string;
        prenom: string | null;
        nom: string | null;
        role: string | null;
        last_seen: string;
        sessions_7d: number;
        favorite_tabs: string[];
        photos_count: number;
        sounds_count: number;
        texts_count: number;
        explorations_viewed: number;
      }>;
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ['activity-timeline', timelineFilter],
    queryFn: async () => {
      const params: { p_limit: number; p_user_filter?: string } = { p_limit: 50 };
      if (timelineFilter !== 'all') params.p_user_filter = timelineFilter;
      const { data, error } = await supabase.rpc('get_activity_timeline', params);
      if (error) throw error;
      return data as Array<{
        id: string;
        user_id: string;
        prenom: string | null;
        nom: string | null;
        event_type: string;
        event_target: string;
        exploration_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;
    },
  });

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Activité des marcheurs</h2>
      </div>

      {/* Global stats cards */}
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            Sessions (7j)
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {globalStats?.active_sessions_7d || 0}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Camera className="h-4 w-4" />
            Médias (7j)
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {globalStats?.media_uploads_7d || 0}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <BarChart3 className="h-4 w-4" />
            Onglet populaire
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground truncate">
            {globalStats?.most_popular_tab
              ? tabLabels[globalStats.most_popular_tab] || globalStats.most_popular_tab
              : '—'}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <User className="h-4 w-4" />
            Plus actif
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground truncate">
            {globalStats?.most_active_prenom
              ? `${globalStats.most_active_prenom} ${globalStats.most_active_nom || ''}`
              : '—'}
          </p>
        </Card>
      </div>

      {/* Per-marcheur table */}
      <h3 className="text-sm font-semibold text-foreground mb-2">Détail par marcheur</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Marcheur</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead>Sessions (7j)</TableHead>
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
                {row.last_seen
                  ? formatDistanceToNow(new Date(row.last_seen), { addSuffix: true, locale: fr })
                  : '—'}
              </TableCell>
              <TableCell>{row.sessions_7d}</TableCell>
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
                Aucune activité enregistrée pour le moment.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Timeline */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Timeline récente
          </h3>
          <Select value={timelineFilter} onValueChange={setTimelineFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Tous les marcheurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les marcheurs</SelectItem>
              {dashboard?.map(row => (
                <SelectItem key={row.user_id} value={row.user_id}>
                  {row.prenom} {row.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            <p className="text-center text-muted-foreground py-6 text-xs">Aucun événement récent.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ActivityDashboard;
