import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, History, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useApiMcpIncidents, type ApiMcpIncident } from '@/hooks/useApiMcpIncidents';
import { useApiMcpRegistry } from '@/hooks/useApiMcpRegistry';

const STATUS_LABEL: Record<string, string> = {
  green: 'à jour',
  orange: 'en retard',
  red: 'critique',
  unknown: 'inconnu',
};

const STATUS_CLASS: Record<string, string> = {
  green: 'text-emerald-300 border-emerald-400/30',
  orange: 'text-amber-300 border-amber-400/30',
  red: 'text-rose-300 border-rose-400/30',
  unknown: 'text-emerald-200/50 border-white/15',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const Row: React.FC<{ inc: ApiMcpIncident; label: string }> = ({ inc, label }) => (
  <li className="py-3 border-b border-emerald-400/10 last:border-0">
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {inc.outcome === 'success' ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
      )}
      <span className="font-medium text-emerald-50">{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full border text-[10px] uppercase tracking-wide ${STATUS_CLASS[inc.status_at_action] ?? STATUS_CLASS.unknown}`}>
        {STATUS_LABEL[inc.status_at_action] ?? inc.status_at_action}
      </span>
      <span className="text-emerald-200/50 ml-auto tabular-nums">{fmtDate(inc.created_at)}</span>
    </div>
    {inc.detail && (
      <p className="mt-1 text-xs text-emerald-100/70 leading-relaxed">{inc.detail}</p>
    )}
  </li>
);

/** Journal complet, affiché en bas de la page admin. */
export const ApiIncidentsLog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { data: incidents } = useApiMcpIncidents();
  const { data: registry } = useApiMcpRegistry();

  const labels = useMemo(() => {
    const m = new Map<string, string>();
    (registry ?? []).forEach((e) => m.set(e.slug, e.name));
    return m;
  }, [registry]);

  const rows = (incidents ?? []).filter((i) => filter === 'all' || i.slug === filter);
  const slugs = Array.from(new Set((incidents ?? []).map((i) => i.slug)));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-5 py-4 rounded-2xl bg-emerald-950/60 border border-emerald-400/15 text-emerald-100 hover:bg-emerald-900/60 transition-colors">
        <History className="w-4 h-4 text-emerald-300" />
        <span className="text-sm font-medium">Historique des incidents</span>
        <span className="text-xs text-emerald-200/50">
          {incidents?.length ? `${incidents.length} entrée${incidents.length > 1 ? 's' : ''}` : 'aucune entrée'}
        </span>
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 rounded-2xl bg-emerald-950/50 border border-emerald-400/10 p-5">
        {slugs.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] border ${filter === 'all' ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-100' : 'border-emerald-400/15 text-emerald-200/60'}`}
            >
              Toutes
            </button>
            {slugs.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-full text-[11px] border ${filter === s ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-100' : 'border-emerald-400/15 text-emerald-200/60'}`}
              >
                {labels.get(s) ?? s}
              </button>
            ))}
          </div>
        )}
        {rows.length === 0 ? (
          <p className="text-xs text-emerald-200/60">
            Aucune relance enregistrée pour l'instant. Chaque action lancée depuis cette page apparaîtra ici.
          </p>
        ) : (
          <ul>
            {rows.map((inc) => (
              <Row key={inc.id} inc={inc} label={labels.get(inc.slug) ?? inc.slug} />
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

/** Rappel compact des 3 dernières actions pour une API donnée. */
export const ApiIncidentsMini: React.FC<{ slug: string; label: string }> = ({ slug, label }) => {
  const { data: incidents } = useApiMcpIncidents(slug, 3);
  if (!incidents?.length) return null;
  return (
    <ul className="mt-3">
      {incidents.map((inc) => (
        <Row key={inc.id} inc={inc} label={label} />
      ))}
    </ul>
  );
};

export default ApiIncidentsLog;
