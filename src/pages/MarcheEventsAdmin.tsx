import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Plus, List, Map as MapIcon, BarChart3, Lightbulb, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import EventsKpiBanner from '@/components/admin/marche-events/EventsKpiBanner';
import EventsFiltersBar from '@/components/admin/marche-events/EventsFiltersBar';
import EventsListTab from '@/components/admin/marche-events/EventsListTab';
import EventsMapTab from '@/components/admin/marche-events/EventsMapTab';
import EventsAnalyticsTab from '@/components/admin/marche-events/EventsAnalyticsTab';
import EventsRecommendationsTab from '@/components/admin/marche-events/EventsRecommendationsTab';
import ProfilsPanel from '@/components/admin/community/ProfilsPanel';
import {
  useMarcheEventsStats,
  type EventsFilters,
  type EventSort,
  type EventStatus,
} from '@/hooks/useMarcheEventsQuery';

const PAGE_SIZE_KEY = 'marche-events-admin:pageSize';
const DEFAULT_PAGE_SIZE = 20;

const MarcheEventsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // URL state
  const tab = params.get('tab') ?? 'list';
  const search = params.get('q') ?? '';
  const type = params.get('type') ?? 'all';
  const status = (params.get('status') as EventStatus) ?? 'all';
  const sort = (params.get('sort') as EventSort) ?? 'date_desc';
  const page = Math.max(1, Number(params.get('page') ?? '1'));
  const pageSize = Number(
    params.get('size') ?? (typeof window !== 'undefined' ? localStorage.getItem(PAGE_SIZE_KEY) : null) ?? DEFAULT_PAGE_SIZE
  );

  const debouncedSearch = useDebounce(search, 300);

  const filters: EventsFilters = useMemo(
    () => ({ search: debouncedSearch, type, status, sort }),
    [debouncedSearch, type, status, sort]
  );

  const updateParams = (updates: Record<string, string | number | null>, opts?: { resetPage?: boolean }) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '' || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    if (opts?.resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const handleFilterChange = (next: Partial<EventsFilters>) => {
    const map: Record<keyof EventsFilters, string> = {
      search: 'q',
      type: 'type',
      status: 'status',
      sort: 'sort',
    };
    const updates: Record<string, string | null> = {};
    Object.entries(next).forEach(([k, v]) => {
      const key = map[k as keyof EventsFilters];
      updates[key] = v && v !== 'all' ? String(v) : null;
    });
    updateParams(updates, { resetPage: true });
  };

  const handlePageChange = (p: number) => updateParams({ page: p === 1 ? null : p });
  const handlePageSizeChange = (s: number) => {
    try { localStorage.setItem(PAGE_SIZE_KEY, String(s)); } catch {}
    updateParams({ size: s === DEFAULT_PAGE_SIZE ? null : s, page: null });
  };
  const handleTabChange = (t: string) => updateParams({ tab: t === 'list' ? null : t });

  const { data: stats, isLoading: statsLoading } = useMarcheEventsStats(filters);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 flex-wrap">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground flex-1 min-w-0 truncate">
            Événements de Marche
          </h1>
          <Button onClick={() => navigate('/admin/marche-events/nouveau')} size="sm">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nouvel événement</span>
          </Button>
        </div>

        {/* KPI Banner sticky */}
        <EventsKpiBanner stats={stats} isLoading={statsLoading} />

        {/* Filtres */}
        <EventsFiltersBar
          filters={{ search, type, status, sort }}
          onChange={handleFilterChange}
        />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="list" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
              <List className="h-4 w-4" /><span>Liste</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
              <MapIcon className="h-4 w-4" /><span>Carte</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" /><span>Analyse</span>
            </TabsTrigger>
            <TabsTrigger value="reco" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
              <Lightbulb className="h-4 w-4" /><span className="hidden xs:inline">Recommandations</span>
              <span className="xs:hidden">Reco</span>
            </TabsTrigger>
            <TabsTrigger value="profils" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
              <Sparkles className="h-4 w-4" /><span>Profils</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <EventsListTab
              filters={filters}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </TabsContent>
          <TabsContent value="map" className="mt-4">
            <EventsMapTab filters={filters} active={tab === 'map'} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <EventsAnalyticsTab filters={filters} active={tab === 'analytics'} />
          </TabsContent>
          <TabsContent value="reco" className="mt-4">
            <EventsRecommendationsTab filters={filters} active={tab === 'reco'} />
          </TabsContent>
          <TabsContent value="profils" className="mt-4">
            <ProfilsPanel />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default MarcheEventsAdmin;
