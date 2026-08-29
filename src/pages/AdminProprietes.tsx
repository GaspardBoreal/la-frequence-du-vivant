import React, { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trees, List, Map as MapIcon, RadioTower,
  ArrowUp, ArrowDown, ChevronsUpDown, ChevronRight,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import PaginationControls from '@/components/admin/marche-events/PaginationControls';
import ProprietesKpiBar from '@/components/admin/proprietes/ProprietesKpiBar';
import ProprietesFilters from '@/components/admin/proprietes/ProprietesFilters';
import ProprietesMapView from '@/components/admin/proprietes/ProprietesMapView';
import type {
  ProprieteListRow, ProprietesFilterValues, ProprietesKpiCounts, ProprietesKpiKey,
} from '@/components/admin/proprietes/types';
import { DEFAULT_FILTERS, formatSurface } from '@/components/admin/proprietes/types';

const sb = supabase as any;

type CompanyLite = { id: string; denomination: string | null; nom_complet: string | null };
type MarcheurLite = { id: string; prenom: string | null; nom: string | null };

type SortKey = 'nom' | 'surface_hectares' | 'created_at';

const LIST_COLUMNS =
  'id, nom, slug, is_active, ville, code_postal, departement, region, surface_hectares, latitude, longitude, owner_company_id, main_walker_id, photo_hero_url, created_at';

/** Nettoie une saisie pour le mini-langage .or() de PostgREST. */
const escapeOr = (s: string) => s.replace(/[%,()."\\]/g, ' ').replace(/\s+/g, ' ').trim();

const AdminProprietes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- État piloté par l'URL (filtres partageables) -----------------------
  const filters: ProprietesFilterValues = {
    q: searchParams.get('q') ?? '',
    statut: (searchParams.get('statut') as ProprietesFilterValues['statut']) || 'all',
    region: searchParams.get('region') || 'all',
    dept: searchParams.get('dept') || 'all',
    entreprise: searchParams.get('entreprise') || 'all',
    gps: (searchParams.get('gps') as ProprietesFilterValues['gps']) || 'all',
    sondes: (searchParams.get('sondes') as ProprietesFilterValues['sondes']) || 'all',
    periode: (searchParams.get('periode') as ProprietesFilterValues['periode']) || 'all',
    du: searchParams.get('du') ?? '',
    au: searchParams.get('au') ?? '',
  };
  const vue = searchParams.get('vue') === 'carte' ? 'carte' : 'table';
  const tri: SortKey = (searchParams.get('tri') as SortKey) || 'created_at';
  const dir: 'asc' | 'desc' =
    searchParams.get('dir') === 'asc' || searchParams.get('dir') === 'desc'
      ? (searchParams.get('dir') as 'asc' | 'desc')
      : 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.max(10, parseInt(searchParams.get('ps') || '20', 10) || 20);

  const updateParams = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    });
    if (resetPage) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const setFilters = (v: ProprietesFilterValues) =>
    updateParams({
      q: v.q || null,
      statut: v.statut,
      region: v.region,
      dept: v.dept,
      entreprise: v.entreprise,
      gps: v.gps,
      sondes: v.sondes,
      periode: v.periode,
      du: v.periode === 'plage' ? v.du || null : null,
      au: v.periode === 'plage' ? v.au || null : null,
    });

  // ---- Référentiels --------------------------------------------------------
  const { data: companies = [] } = useQuery<CompanyLite[]>({
    queryKey: ['admin-proprietes', 'companies'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('crm_companies')
        .select('id, denomination, nom_complet')
        .order('denomination')
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as CompanyLite[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: marcheurs = [] } = useQuery<MarcheurLite[]>({
    queryKey: ['admin-proprietes', 'marcheurs'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('community_profiles')
        .select('id, prenom, nom')
        .not('user_id', 'is', null)
        .order('prenom', { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as MarcheurLite[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ---- Sondes IoT par propriété (table petite, chargée entièrement) -------
  const { data: sondesRows = [] } = useQuery<{ propriete_id: string | null }[]>({
    queryKey: ['admin-proprietes', 'sondes'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('iot_capteurs')
        .select('propriete_id')
        .not('propriete_id', 'is', null)
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as { propriete_id: string | null }[];
    },
    staleTime: 60 * 1000,
  });

  const sondesCount = useMemo(() => {
    const map: Record<string, number> = {};
    sondesRows.forEach((r) => {
      if (r.propriete_id) map[r.propriete_id] = (map[r.propriete_id] ?? 0) + 1;
    });
    return map;
  }, [sondesRows]);
  const idsAvecSondes = useMemo(() => Object.keys(sondesCount).sort(), [sondesCount]);

  // ---- Facettes région / département (dérivées des données réelles) -------
  const { data: facetRows = [] } = useQuery<{ region: string | null; departement: string | null }[]>({
    queryKey: ['admin-proprietes', 'facets'],
    queryFn: async () => {
      const { data, error } = await sb.from('proprietes').select('region, departement').limit(5000);
      if (error) throw error;
      return (data ?? []) as { region: string | null; departement: string | null }[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const regions = useMemo(
    () => [...new Set(facetRows.map((r) => r.region).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr')),
    [facetRows],
  );
  const departements = useMemo(
    () => [...new Set(facetRows.map((r) => r.departement).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr')),
    [facetRows],
  );

  // ---- KPI globaux (comptes exacts, requêtes HEAD légères) ----------------
  const { data: kpis } = useQuery<ProprietesKpiCounts>({
    queryKey: ['admin-proprietes', 'kpis', idsAvecSondes.length],
    queryFn: async () => {
      const head = async (build: (q: any) => any) => {
        const { count, error } = await build(sb.from('proprietes').select('*', { count: 'exact', head: true }));
        if (error) throw error;
        return count ?? 0;
      };
      const [total, actives, geolocalisees] = await Promise.all([
        head((q) => q),
        head((q) => q.eq('is_active', true)),
        head((q) => q.not('latitude', 'is', null).not('longitude', 'is', null)),
      ]);
      return {
        total,
        actives,
        archivees: total - actives,
        geolocalisees,
        avecSondes: idsAvecSondes.length,
      };
    },
    staleTime: 60 * 1000,
  });

  // ---- Application des filtres ---------------------------------------------
  const applyFilters = (query: any): any => {
    let q = query;
    const search = escapeOr(filters.q);
    if (search) {
      q = q.or(`nom.ilike.%${search}%,ville.ilike.%${search}%,code_postal.ilike.%${search}%`);
    }
    if (filters.statut !== 'all') q = q.eq('is_active', filters.statut === 'actives');
    if (filters.region !== 'all') q = q.eq('region', filters.region);
    if (filters.dept !== 'all') q = q.eq('departement', filters.dept);
    if (filters.entreprise !== 'all') q = q.eq('owner_company_id', filters.entreprise);
    if (filters.gps === 'avec') q = q.not('latitude', 'is', null).not('longitude', 'is', null);
    if (filters.gps === 'sans') q = q.or('latitude.is.null,longitude.is.null');
    if (filters.sondes === 'avec') {
      q = idsAvecSondes.length > 0
        ? q.in('id', idsAvecSondes)
        : q.eq('id', '00000000-0000-0000-0000-000000000000');
    }
    return q;
  };

  // ---- Liste paginée (vue Table) -------------------------------------------
  const listQuery = useQuery<{ rows: ProprieteListRow[]; total: number }>({
    queryKey: ['admin-proprietes', 'list', filters, tri, dir, page, pageSize, idsAvecSondes],
    enabled: vue === 'table',
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const { data, error, count } = await applyFilters(
        sb.from('proprietes').select(LIST_COLUMNS, { count: 'exact' }),
      )
        .order(tri, { ascending: dir === 'asc', nullsFirst: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return { rows: (data ?? []) as ProprieteListRow[], total: count ?? 0 };
    },
    placeholderData: (prev: { rows: ProprieteListRow[]; total: number } | undefined) => prev,
  });

  // ---- Ensemble filtré complet (vue Carte) ----------------------------------
  const mapQuery = useQuery<ProprieteListRow[]>({
    queryKey: ['admin-proprietes', 'map', filters, idsAvecSondes],
    enabled: vue === 'carte',
    queryFn: async () => {
      const { data, error } = await applyFilters(sb.from('proprietes').select(LIST_COLUMNS))
        .order('nom', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as ProprieteListRow[];
    },
    placeholderData: (prev: ProprieteListRow[] | undefined) => prev,
  });

  const companyById = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c])), [companies]);
  const marcheurById = useMemo(() => Object.fromEntries(marcheurs.map((m) => [m.id, m])), [marcheurs]);

  const activeKpi: ProprietesKpiKey | null =
    filters.statut === 'actives'
      ? 'actives'
      : filters.statut === 'archivees'
        ? 'archivees'
        : filters.sondes === 'avec'
          ? 'sondes'
          : filters.gps === 'avec'
            ? 'geo'
            : null;

  const onKpiToggle = (k: ProprietesKpiKey) => {
    if (k === 'actives') updateParams({ statut: filters.statut === 'actives' ? null : 'actives' });
    if (k === 'archivees') updateParams({ statut: filters.statut === 'archivees' ? null : 'archivees' });
    if (k === 'geo') updateParams({ gps: filters.gps === 'avec' ? null : 'avec' });
    if (k === 'sondes') updateParams({ sondes: filters.sondes === 'avec' ? null : 'avec' });
  };

  const toggleSort = (key: SortKey) => {
    if (tri === key) updateParams({ dir: dir === 'asc' ? 'desc' : 'asc' }, false);
    else updateParams({ tri: key, dir: 'asc' });
  };

  const SortableHead: React.FC<{ k: SortKey; children: React.ReactNode; className?: string }> = ({ k, children, className }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
      >
        {children}
        {tri === k
          ? (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </TableHead>
  );

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const entrepriseOptions = useMemo(
    () => companies.map((c) => ({ id: c.id, nom: c.denomination ?? c.nom_complet ?? '(sans nom)' })),
    [companies],
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-2">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />Retour Admin
            </Button>
          </Link>
          <Button onClick={() => navigate('/admin/proprietes/nouvelle')}>
            <Plus className="mr-2 h-4 w-4" />Nouvelle propriété
          </Button>
        </div>

        <div className="mb-6 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold">
            <Trees className="h-8 w-8 text-emerald-600" />
            Propriétés
          </h1>
          <p className="mt-2 text-muted-foreground">
            Jardins, vignobles et exploitations — console de gestion Fréquence Jardin
          </p>
        </div>

        <div className="space-y-4">
          <ProprietesKpiBar
            counts={kpis ?? { total: 0, actives: 0, archivees: 0, geolocalisees: 0, avecSondes: 0 }}
            active={activeKpi}
            onToggle={onKpiToggle}
          />

          <ProprietesFilters
            values={filters}
            onChange={setFilters}
            regions={regions}
            departements={departements}
            entreprises={entrepriseOptions}
          />

          {/* Bascule Table | Carte */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => updateParams({ vue: null }, false)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  vue === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Table
              </button>
              <button
                type="button"
                onClick={() => updateParams({ vue: 'carte' }, false)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  vue === 'carte' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" /> Carte
              </button>
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {vue === 'table' ? `${total} propriété${total > 1 ? 's' : ''}` : `${(mapQuery.data ?? []).length} propriété${(mapQuery.data ?? []).length > 1 ? 's' : ''}`}
            </div>
          </div>

          {vue === 'carte' ? (
            mapQuery.isLoading && !mapQuery.data ? (
              <Card className="p-8 text-center text-muted-foreground">Chargement de la carte…</Card>
            ) : (
              <ProprietesMapView rows={mapQuery.data ?? []} sondesCount={sondesCount} />
            )
          ) : (
            <Card className="overflow-hidden">
              {listQuery.isLoading && !listQuery.data ? (
                <p className="py-8 text-center text-muted-foreground">Chargement…</p>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Trees className="mx-auto mb-3 h-12 w-12 opacity-40" />
                  {JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS)
                    ? 'Aucune propriété. Créez la première.'
                    : 'Aucune propriété ne correspond aux filtres.'}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHead k="nom">Nom</SortableHead>
                          <TableHead>Lieu</TableHead>
                          <SortableHead k="surface_hectares">Surface</SortableHead>
                          <TableHead>Entreprise</TableHead>
                          <TableHead className="hidden lg:table-cell">Marcheur référent</TableHead>
                          <TableHead className="hidden md:table-cell">Sondes</TableHead>
                          <TableHead>Statut</TableHead>
                          <SortableHead k="created_at" className="hidden xl:table-cell">Création</SortableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((p) => {
                          const sondes = sondesCount[p.id] ?? 0;
                          const referent = p.main_walker_id ? marcheurById[p.main_walker_id] : null;
                          return (
                            <TableRow
                              key={p.id}
                              className="cursor-pointer"
                              onClick={() => navigate(`/admin/proprietes/${p.id}`)}
                            >
                              <TableCell>
                                <div className="font-medium">{p.nom}</div>
                                {p.slug && <div className="font-mono text-[11px] text-muted-foreground">/{p.slug}</div>}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {[p.code_postal, p.ville].filter(Boolean).join(' ') || '—'}
                                {p.departement && <span className="hidden sm:inline"> · {p.departement}</span>}
                              </TableCell>
                              <TableCell className="text-sm">{formatSurface(p.surface_hectares)}</TableCell>
                              <TableCell className="text-sm">
                                {p.owner_company_id
                                  ? (companyById[p.owner_company_id]?.denomination ?? companyById[p.owner_company_id]?.nom_complet ?? '—')
                                  : '—'}
                              </TableCell>
                              <TableCell className="hidden text-sm lg:table-cell">
                                {referent ? `${referent.prenom ?? ''} ${referent.nom ?? ''}`.trim() : '—'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {sondes > 0 ? (
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    <RadioTower className="h-3 w-3" />
                                    {sondes}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {p.is_active ? (
                                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">Active</Badge>
                                ) : (
                                  <Badge variant="outline">Archivée</Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                                {new Date(p.created_at).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="px-3">
                    <PaginationControls
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={(p) => updateParams({ page: String(p) }, false)}
                      onPageSizeChange={(s) => updateParams({ ps: String(s) })}
                    />
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProprietes;
