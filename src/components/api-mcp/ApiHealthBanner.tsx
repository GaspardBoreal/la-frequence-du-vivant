import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useApiMcpRegistry } from '@/hooks/useApiMcpRegistry';
import { useApiMcpHealth } from '@/hooks/useApiMcpHealth';

/**
 * Discreet admin banner: only renders if at least one critical API
 * is in red/orange health status. Click → admin API & MCP page.
 */
const ApiHealthBanner: React.FC = () => {
  const { data: registry } = useApiMcpRegistry();
  const { data: health } = useApiMcpHealth();

  const issues = useMemo(() => {
    if (!registry || !health) return [];
    return registry
      .filter((e) => e.is_critical)
      .map((e) => ({ entry: e, h: health[e.slug] }))
      .filter(({ h }) => h?.status === 'red' || h?.status === 'orange');
  }, [registry, health]);

  if (issues.length === 0) return null;

  const worst = issues.some((i) => i.h?.status === 'red') ? 'red' : 'orange';
  const colors =
    worst === 'red'
      ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200'
      : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200';

  return (
    <Link
      to="/admin/outils/api-mcp"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors} hover:opacity-90 transition-opacity mb-4`}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <strong>{issues.length} API critique{issues.length > 1 ? 's' : ''}</strong> nécessite{issues.length > 1 ? 'nt' : ''} votre attention :{' '}
        {issues.map((i) => i.entry.name).join(', ')}
      </div>
      <ArrowRight className="w-4 h-4 flex-shrink-0" />
    </Link>
  );
};

export default ApiHealthBanner;
