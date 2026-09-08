import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApiMcpGrid from '@/components/api-mcp/ApiMcpGrid';
import ApiRemediateButton from '@/components/api-mcp/ApiRemediateButton';
import ApiIncidentsLog from '@/components/api-mcp/ApiIncidentsLog';
import { useApiMcpRegistry } from '@/hooks/useApiMcpRegistry';
import { useApiMcpHealth, formatFreshness } from '@/hooks/useApiMcpHealth';

const AdminApiMcp: React.FC = () => {
  const { data: registry } = useApiMcpRegistry();
  const { data: health } = useApiMcpHealth();

  const counts = React.useMemo(() => {
    const c = { green: 0, orange: 0, red: 0, unknown: 0 };
    (registry ?? []).forEach((e) => {
      const s = health?.[e.slug]?.status ?? 'unknown';
      c[s] += 1;
    });
    return c;
  }, [registry, health]);

  const alerts = React.useMemo(
    () =>
      (registry ?? [])
        .map((e) => ({ entry: e, h: health?.[e.slug] }))
        .filter(({ h }) => h?.status === 'red' || h?.status === 'orange'),
    [registry, health],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-emerald-950 text-emerald-50">
        <div className="max-w-6xl mx-auto px-6 pt-4 flex items-center justify-between">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm" className="bg-transparent border-emerald-400/30 text-emerald-200 hover:bg-emerald-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Admin
            </Button>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-emerald-300">Santé live :</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {counts.green}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {counts.orange}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> {counts.red}</span>
            <span className="flex items-center gap-1 text-emerald-200/50"><span className="w-2 h-2 rounded-full bg-white/30" /> {counts.unknown}</span>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <div className="rounded-2xl border border-amber-400/25 bg-amber-950/30 p-5 space-y-4">
              <div className="flex items-center gap-2 text-amber-200">
                <AlertTriangle className="w-4 h-4" />
                <h2 className="text-sm font-semibold">
                  {alerts.length} alerte{alerts.length > 1 ? 's' : ''} à traiter
                </h2>
              </div>
              <ul className="space-y-3">
                {alerts.map(({ entry, h }) => (
                  <li
                    key={entry.slug}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-950/50 border border-emerald-400/10 px-4 py-3"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${h?.status === 'red' ? 'bg-rose-500' : 'bg-amber-400'}`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-emerald-50">{entry.name}</div>
                      <div className="text-[11px] text-emerald-200/60">
                        Dernière mise à jour {formatFreshness(h?.freshness ?? null)}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <ApiRemediateButton slug={entry.slug} name={entry.name} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <ApiMcpGrid
        showHealth
        title="API & MCP — Tableau de bord admin"
        subtitle="Métriques live, santé des intégrations critiques, et plongée détaillée dans chaque flux."
      />

      <div className="bg-emerald-950 text-emerald-50">
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <ApiIncidentsLog />
        </div>
      </div>
    </div>
  );
};

export default AdminApiMcp;
