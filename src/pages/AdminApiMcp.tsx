import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApiMcpGrid from '@/components/api-mcp/ApiMcpGrid';
import { useApiMcpRegistry } from '@/hooks/useApiMcpRegistry';
import { useApiMcpHealth } from '@/hooks/useApiMcpHealth';

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
      </div>
      <ApiMcpGrid
        showHealth
        title="API & MCP — Tableau de bord admin"
        subtitle="Métriques live, santé des intégrations critiques, et plongée détaillée dans chaque flux."
      />
    </div>
  );
};

export default AdminApiMcp;
