import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EventStatus = 'all' | 'upcoming' | 'past';
export type EventSort = 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc';

export interface EventsFilters {
  search: string;
  type: string; // 'all' | 'none' | MarcheEventType
  status: EventStatus;
  sort: EventSort;
}

export interface PaginatedEventsParams extends EventsFilters {
  page: number;
  pageSize: number;
}

export interface MarcheEventRow {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  event_type: string | null;
  exploration_id: string | null;
  exploration_name: string | null;
  lieu: string | null;
  qr_code: string | null;
  latitude: number | null;
  longitude: number | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  events_count: number;
  marches_count: number;
  total_km: number | null;
  participants_count: number;
}

const normalize = (f: EventsFilters) => ({
  _search: f.search?.trim() || null,
  _type: f.type === 'all' ? null : f.type,
  _status: f.status === 'all' ? null : f.status,
});

export const useMarcheEventsStats = (filters: EventsFilters) =>
  useQuery({
    queryKey: ['marche-events-stats', filters],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.rpc(
        'get_marche_events_dashboard_stats' as any,
        normalize(filters) as any
      );
      if (error) throw error;
      return (data as any) ?? { events_count: 0, marches_count: 0, total_km: null, participants_count: 0 };
    },
    staleTime: 60_000,
  });

export const useMarcheEventsPaginated = (params: PaginatedEventsParams) =>
  useQuery({
    queryKey: ['marche-events-paginated', params],
    queryFn: async (): Promise<{ rows: MarcheEventRow[]; total: number }> => {
      const offset = (params.page - 1) * params.pageSize;
      const { data, error } = await supabase.rpc('get_marche_events_paginated' as any, {
        ...normalize(params),
        _sort: params.sort,
        _limit: params.pageSize,
        _offset: offset,
      } as any);
      if (error) throw error;
      const d = (data as any) ?? { rows: [], total: 0 };
      return { rows: d.rows ?? [], total: d.total ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

export const useMarcheEventsAll = (filters: EventsFilters, enabled: boolean) =>
  useQuery({
    queryKey: ['marche-events-all', filters],
    queryFn: async (): Promise<MarcheEventRow[]> => {
      const { data, error } = await supabase.rpc('get_marche_events_filtered_all' as any, {
        ...normalize(filters),
        _max: 2000,
      } as any);
      if (error) throw error;
      return ((data as any) ?? []) as MarcheEventRow[];
    },
    enabled,
    staleTime: 60_000,
  });

export const useParticipationCountsForEvents = (eventIds: string[]) =>
  useQuery({
    queryKey: ['marche-participation-counts', eventIds.sort().join(',')],
    queryFn: async () => {
      if (eventIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('marche_participations')
        .select('marche_event_id')
        .in('marche_event_id', eventIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        counts[p.marche_event_id] = (counts[p.marche_event_id] || 0) + 1;
      });
      return counts;
    },
    enabled: eventIds.length > 0,
    staleTime: 30_000,
  });
