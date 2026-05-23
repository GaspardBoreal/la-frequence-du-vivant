import React, { useMemo, useState } from 'react';
import { useApiMcpRegistry, type ApiMcpEntry } from '@/hooks/useApiMcpRegistry';
import { useApiMcpHealth } from '@/hooks/useApiMcpHealth';
import { FAMILY_META, FAMILY_ORDER } from '@/lib/apiMcpFamilies';
import ApiCard from '@/components/api-mcp/ApiCard';
import ApiStoryDrawer from '@/components/api-mcp/ApiStoryDrawer';
import { Network } from 'lucide-react';

interface Props {
  showHealth?: boolean;
  title?: string;
  subtitle?: string;
}

const ApiMcpGrid: React.FC<Props> = ({
  showHealth = false,
  title = 'L\'écosystème vivant de l\'application',
  subtitle = 'Chaque API, chaque flux, chaque connexion devient une constellation. Cliquez pour découvrir leur histoire.',
}) => {
  const { data: registry, isLoading } = useApiMcpRegistry();
  const { data: health } = useApiMcpHealth();
  const [selected, setSelected] = useState<ApiMcpEntry | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ApiMcpEntry[]>();
    (registry ?? []).forEach((e) => {
      const arr = map.get(e.family) ?? [];
      arr.push(e);
      map.set(e.family, arr);
    });
    return map;
  }, [registry]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-emerald-400/10">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,168,0.3),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(115,255,184,0.2),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-xs text-emerald-200">
            <Network className="w-3 h-3" />
            API & MCP — L'écosystème
          </div>
          <h1 className="text-4xl md:text-5xl font-serif leading-tight">{title}</h1>
          <p className="text-emerald-100/70 max-w-2xl mx-auto">{subtitle}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {isLoading && (
          <div className="text-center text-emerald-200/60 py-20">Chargement de la constellation…</div>
        )}

        {FAMILY_ORDER.map((fam) => {
          const items = grouped.get(fam) ?? [];
          if (!items.length) return null;
          const meta = FAMILY_META[fam];
          const Icon = meta.icon;
          return (
            <section key={fam} className="space-y-5">
              <div className="flex items-end justify-between gap-4 border-b border-emerald-400/10 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Icon className="w-5 h-5" />
                    <h2 className="text-2xl font-serif text-emerald-50">{meta.label}</h2>
                  </div>
                  <p className="text-sm text-emerald-200/60 italic mt-1">« {meta.tagline} »</p>
                </div>
                <div className="text-xs text-emerald-200/50">
                  {items.length} intégration{items.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map((e) => (
                  <ApiCard
                    key={e.id}
                    entry={e}
                    health={health?.[e.slug]}
                    onOpen={() => setSelected(e)}
                    showAdminBadge={showHealth}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <ApiStoryDrawer
        entry={selected}
        health={selected ? health?.[selected.slug] : undefined}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default ApiMcpGrid;
