import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MousePointerClick, Users, AlertCircle, TrendingUp, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type Row = {
  id: string;
  user_id: string | null;
  prenom: string | null;
  nom: string | null;
  query: string;
  event_id: string | null;
  marche_id: string | null;
  scope: string | null;
  results_count: number | null;
  clicked_kind: string | null;
  clicked_id: string | null;
  route: string | null;
  created_at: string;
};

const PERIODS = [
  { key: '1d', label: '24 h', hours: 24 },
  { key: '7d', label: '7 jours', hours: 24 * 7 },
  { key: '30d', label: '30 jours', hours: 24 * 30 },
  { key: '90d', label: '90 jours', hours: 24 * 90 },
] as const;

const SCOPES = ['all', 'global', 'event', 'admin'] as const;

const normalize = (s: string) =>
  s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const RecherchesPanel: React.FC = () => {
  const [periodKey, setPeriodKey] = useState<typeof PERIODS[number]['key']>('7d');
  const [scope, setScope] = useState<typeof SCOPES[number]>('all');
  const [filter, setFilter] = useState('');

  const since = useMemo(() => {
    const p = PERIODS.find(x => x.key === periodKey)!;
    return new Date(Date.now() - p.hours * 3600 * 1000).toISOString();
  }, [periodKey]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-search-logs', since, scope],
    staleTime: 60_000,
    queryFn: async (): Promise<Row[]> => {
      let q = supabase
        .from('search_logs')
        .select('id,user_id,prenom,nom,query,event_id,marche_id,scope,results_count,clicked_kind,clicked_id,route,created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (scope !== 'all') q = q.eq('scope', scope);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const n = normalize(filter);
    return rows.filter(r => normalize(r.query).includes(n));
  }, [rows, filter]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const uniqueQueries = new Set(filtered.map(r => normalize(r.query))).size;
    const uniqueUsers = new Set(filtered.map(r => r.user_id).filter(Boolean)).size;
    const clicked = filtered.filter(r => !!r.clicked_kind).length;
    const zero = filtered.filter(r => (r.results_count ?? 0) === 0).length;
    return {
      total,
      uniqueQueries,
      uniqueUsers,
      clickRate: total ? Math.round((clicked / total) * 100) : 0,
      zero,
      zeroRate: total ? Math.round((zero / total) * 100) : 0,
    };
  }, [filtered]);

  const topQueries = useMemo(() => {
    const map = new Map<string, { display: string; count: number; clicks: number; totalResults: number; last: string }>();
    for (const r of filtered) {
      const k = normalize(r.query);
      const cur = map.get(k) ?? { display: r.query, count: 0, clicks: 0, totalResults: 0, last: r.created_at };
      cur.count += 1;
      cur.totalResults += r.results_count ?? 0;
      if (r.clicked_kind) cur.clicks += 1;
      if (r.created_at > cur.last) cur.last = r.created_at;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 50);
  }, [filtered]);

  const zeroResults = useMemo(
    () =>
      topQueries
        .filter(q => q.totalResults === 0)
        .slice(0, 30),
    [topQueries]
  );

  const kindDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = r.clicked_kind ?? '— sans clic';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const scopeDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = r.scope ?? 'unknown';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const recent = filtered.slice(0, 50);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {PERIODS.map(p => (
            <Button
              key={p.key}
              size="sm"
              variant={periodKey === p.key ? 'default' : 'outline'}
              onClick={() => setPeriodKey(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {SCOPES.map(s => (
            <Button
              key={s}
              size="sm"
              variant={scope === s ? 'default' : 'outline'}
              onClick={() => setScope(s)}
            >
              {s === 'all' ? 'Tous' : s}
            </Button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filtrer une requête…"
            className="pl-8 h-9"
          />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Search className="h-3.5 w-3.5" />Recherches</div>
          <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="h-3.5 w-3.5" />Requêtes uniques</div>
          <p className="text-2xl font-bold text-foreground">{kpis.uniqueQueries}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="h-3.5 w-3.5" />Marcheurs actifs</div>
          <p className="text-2xl font-bold text-foreground">{kpis.uniqueUsers}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><MousePointerClick className="h-3.5 w-3.5" />Taux de clic</div>
          <p className="text-2xl font-bold text-foreground">{kpis.clickRate}%</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><AlertCircle className="h-3.5 w-3.5" />0 résultat</div>
          <p className="text-2xl font-bold text-foreground">{kpis.zero} <span className="text-sm font-normal text-muted-foreground">({kpis.zeroRate}%)</span></p>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement…
        </div>
      )}

      {/* Top requêtes */}
      <Card className="p-4">
        <h3 className="text-base font-semibold text-foreground mb-3">Top requêtes</h3>
        {topQueries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune recherche sur cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 px-2">Requête</th>
                  <th className="py-2 px-2 text-right">Occurrences</th>
                  <th className="py-2 px-2 text-right">Résultats moy.</th>
                  <th className="py-2 px-2 text-right">Taux de clic</th>
                  <th className="py-2 px-2 text-right">Dernière</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/40">
                    <td className="py-2 px-2 font-medium text-foreground">{q.display}</td>
                    <td className="py-2 px-2 text-right">{q.count}</td>
                    <td className="py-2 px-2 text-right">{(q.totalResults / q.count).toFixed(1)}</td>
                    <td className="py-2 px-2 text-right">{Math.round((q.clicks / q.count) * 100)}%</td>
                    <td className="py-2 px-2 text-right text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(q.last), { addSuffix: true, locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Zero results + distributions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Requêtes sans résultat
          </h3>
          {zeroResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune requête infructueuse 🌿</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {zeroResults.map((q, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-foreground truncate">{q.display}</span>
                  <Badge variant="outline">{q.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Répartition par type de clic</h3>
            <ul className="space-y-1 text-sm">
              {kindDist.map(([k, n]) => {
                const pct = kpis.total ? Math.round((n / kpis.total) * 100) : 0;
                return (
                  <li key={k}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                      <span>{k}</span>
                      <span>{n} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Répartition par scope</h3>
            <ul className="space-y-1 text-sm">
              {scopeDist.map(([k, n]) => {
                const pct = kpis.total ? Math.round((n / kpis.total) * 100) : 0;
                return (
                  <li key={k}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                      <span>{k}</span>
                      <span>{n} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>

      {/* Flux récent */}
      <Card className="p-4">
        <h3 className="text-base font-semibold text-foreground mb-3">Flux récent (50 dernières)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Quand</th>
                <th className="py-2 px-2">Marcheur</th>
                <th className="py-2 px-2">Requête</th>
                <th className="py-2 px-2 text-right">Rés.</th>
                <th className="py-2 px-2">Clic</th>
                <th className="py-2 px-2">Route</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/40">
                  <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {r.prenom || r.nom ? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim() : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-2 px-2 font-medium text-foreground">{r.query}</td>
                  <td className="py-2 px-2 text-right">{r.results_count ?? 0}</td>
                  <td className="py-2 px-2">
                    {r.clicked_kind ? (
                      <Badge variant="secondary" className="text-xs">{r.clicked_kind}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {r.route ? (
                      <a
                        href={r.route}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 truncate max-w-[280px]"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{r.route}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RecherchesPanel;
