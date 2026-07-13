import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CarteMdVView = 'map' | 'timeline' | 'wall' | 'constellation' | 'list';
export type ZoneFilter = 'all' | 'pioneer' | 'documented';
export type StatusFilter = 'all' | 'upcoming' | 'past';
export type SeasonFilter = 'all' | 'upcoming' | 'this_month' | 'spring' | 'summer' | 'autumn' | 'winter';

export interface CarteMdVFilters {
  search: string;
  types: string[];       // event_type values
  categories: string[];  // category values
  status: StatusFilter;
  season: SeasonFilter;
  minSpecies: number;    // 0..100
  zone: ZoneFilter;
  needAudio: boolean;
  needPhotos: boolean;
  solVivantEnabled: boolean;
  solVivantCategories: string[];
  view: CarteMdVView;
}

export const DEFAULT_FILTERS: CarteMdVFilters = {
  search: '',
  types: [],
  categories: [],
  status: 'all',
  season: 'all',
  minSpecies: 0,
  zone: 'all',
  needAudio: false,
  needPhotos: false,
  solVivantEnabled: false,
  solVivantCategories: [],
  view: 'map',
};

export interface CarteMdVEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  event_type: string | null;
  category: string | null;
  lieu: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  max_participants: number | null;
  is_public: boolean | null;
  public_slug: string | null;
  exploration_id: string | null;
  exploration_name: string | null;
  participants_count: number;
  species_count: number;
  has_audio: boolean;
  has_marcheur_photos: boolean;
}

export interface SolVivantPoint {
  id: string;
  external_id: string;
  name: string;
  category: string | null;
  categories: string[];
  latitude: number;
  longitude: number;
  street_address: string | null;
  website: string | null;
  description: string | null;
  synced_at: string | null;
}

export interface HeroStats {
  events_count: number;
  marches_count: number;
  total_km: number;
  marcheurs_count: number;
  participations_count: number;
  species_count: number;
  computed_at?: string;
}

/* ---------- Filters state synced with URL ---------- */

export function useCarteMdVFilters() {
  const [params, setParams] = useSearchParams();

  const filters: CarteMdVFilters = useMemo(() => ({
    search: params.get('q') ?? '',
    types: params.get('type')?.split(',').filter(Boolean) ?? [],
    categories: params.get('cat')?.split(',').filter(Boolean) ?? [],
    status: (params.get('status') as StatusFilter) || DEFAULT_FILTERS.status,
    season: (params.get('season') as SeasonFilter) || DEFAULT_FILTERS.season,
    minSpecies: Number(params.get('minSpecies') ?? 0) || 0,
    zone: (params.get('zone') as ZoneFilter) || DEFAULT_FILTERS.zone,
    needAudio: params.get('audio') === '1',
    needPhotos: params.get('photos') === '1',
    solVivantEnabled: params.get('sv') === '1',
    solVivantCategories: params.get('svc')?.split(',').filter(Boolean) ?? [],
    view: (params.get('view') as CarteMdVView) || DEFAULT_FILTERS.view,
  }), [params]);

  const update = useCallback((next: Partial<CarteMdVFilters>) => {
    const merged = { ...filters, ...next };
    const p = new URLSearchParams();
    const currentTab = params.get('tab');
    if (currentTab) p.set('tab', currentTab);
    if (merged.search) p.set('q', merged.search);
    if (merged.types.length) p.set('type', merged.types.join(','));
    if (merged.categories.length) p.set('cat', merged.categories.join(','));
    if (merged.status !== DEFAULT_FILTERS.status) p.set('status', merged.status);
    if (merged.season !== DEFAULT_FILTERS.season) p.set('season', merged.season);
    if (merged.minSpecies > 0) p.set('minSpecies', String(merged.minSpecies));
    if (merged.zone !== DEFAULT_FILTERS.zone) p.set('zone', merged.zone);
    if (merged.needAudio) p.set('audio', '1');
    if (merged.needPhotos) p.set('photos', '1');
    if (merged.solVivantEnabled) p.set('sv', '1');
    if (merged.solVivantCategories.length) p.set('svc', merged.solVivantCategories.join(','));
    if (merged.view !== DEFAULT_FILTERS.view) p.set('view', merged.view);
    setParams(p, { replace: true });
  }, [filters, params, setParams]);

  return { filters, update };
}

/* ---------- Data hooks ---------- */

export function useCarteMdVEvents() {
  return useQuery({
    queryKey: ['carte-mdv-events'],
    queryFn: async (): Promise<CarteMdVEvent[]> => {
      const { data, error } = await supabase.rpc('get_marches_map_events' as any);
      if (error) throw error;
      return (data ?? []) as CarteMdVEvent[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCarteMdVHeroStats() {
  return useQuery({
    queryKey: ['carte-mdv-hero-stats'],
    queryFn: async (): Promise<HeroStats> => {
      const { data, error } = await supabase.rpc('get_carte_mdv_hero_stats' as any);
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      return row ?? { events_count: 0, marches_count: 0, total_km: 0, marcheurs_count: 0, participations_count: 0, species_count: 0 };
    },
    staleTime: 5 * 60_000,
    refetchOnMount: 'always',
  });
}

export function useSolVivantPoints(enabled: boolean) {
  return useQuery({
    queryKey: ['carte-sol-vivant-points'],
    enabled,
    queryFn: async (): Promise<SolVivantPoint[]> => {
      const { data, error } = await supabase
        .from('carte_sol_vivant_points' as any)
        .select('id, external_id, name, category, categories, latitude, longitude, street_address, website, description, synced_at')
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as SolVivantPoint[];
    },
    staleTime: 30 * 60_000,
  });
}

export interface SolVivantPointDetail extends SolVivantPoint {
  email: string | null;
  raw: any;
  external_id: string;
  external_updated_at: string | null;
}

export function useSolVivantPointDetail(id: string | null) {
  return useQuery({
    queryKey: ['carte-sol-vivant-point-detail', id],
    enabled: !!id,
    queryFn: async (): Promise<SolVivantPointDetail | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('carte_sol_vivant_points' as any)
        .select('id, external_id, name, category, categories, latitude, longitude, street_address, website, email, description, synced_at, external_updated_at, raw')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as SolVivantPointDetail | null;
    },
    staleTime: 30 * 60_000,
  });
}

/* ---------- Filtering ---------- */

function matchSeason(dateISO: string, season: SeasonFilter): boolean {
  if (season === 'all') return true;
  const d = new Date(dateISO);
  const now = new Date();
  if (season === 'upcoming') return d >= now;
  if (season === 'this_month')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const m = d.getMonth() + 1;
  if (season === 'spring') return m >= 3 && m <= 5;
  if (season === 'summer') return m >= 6 && m <= 8;
  if (season === 'autumn') return m >= 9 && m <= 11;
  if (season === 'winter') return m === 12 || m <= 2;
  return true;
}

export function applyFilters(events: CarteMdVEvent[], f: CarteMdVFilters): CarteMdVEvent[] {
  const now = Date.now();
  const q = f.search.trim().toLowerCase();
  return events.filter((e) => {
    if (f.types.length && (!e.event_type || !f.types.includes(e.event_type))) return false;
    if (f.categories.length && (!e.category || !f.categories.includes(e.category))) return false;

    const eventTime = new Date(e.date_marche).getTime();
    if (f.status === 'upcoming' && eventTime < now) return false;
    if (f.status === 'past' && eventTime >= now) return false;

    if (!matchSeason(e.date_marche, f.season)) return false;

    if (f.minSpecies > 0 && (e.species_count ?? 0) < f.minSpecies) return false;

    if (f.zone === 'pioneer' && (e.species_count ?? 0) > 5) return false;
    if (f.zone === 'documented' && (e.species_count ?? 0) < 10) return false;

    if (f.needAudio && !e.has_audio) return false;
    if (f.needPhotos && !e.has_marcheur_photos) return false;

    if (q) {
      const hay = [e.title, e.lieu, e.exploration_name, e.description]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
