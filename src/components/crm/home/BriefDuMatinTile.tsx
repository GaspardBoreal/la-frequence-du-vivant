import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useCrmMissions } from '@/hooks/useCrmMissions';
import { MISSION_PRIORITY_META, type CrmMission } from '@/types/crmMissions';
import { cn } from '@/lib/utils';

const PRIO_WEIGHT: Record<string, number> = { critique: 100, haute: 60, normale: 30, basse: 10 };

function scoreMission(m: CrmMission): number {
  let s = PRIO_WEIGHT[m.priorite] ?? 0;
  if (m.due_at) {
    const diffH = (new Date(m.due_at).getTime() - Date.now()) / 36e5;
    if (diffH < 0) s += 80; // late
    else if (diffH < 24) s += 50;
    else if (diffH < 72) s += 20;
  }
  return s;
}

export const BriefDuMatinTile: React.FC = () => {
  const { missions, updateStatus } = useCrmMissions({ mine: true });
  const top = React.useMemo(
    () => [...missions]
      .filter(m => m.statut !== 'realisee' && m.statut !== 'archivee')
      .sort((a, b) => scoreMission(b) - scoreMission(a))
      .slice(0, 3),
    [missions],
  );

  return (
    <div className="col-span-12 rounded-2xl border border-[hsl(var(--crm-border))] bg-gradient-to-br from-[hsl(var(--crm-accent-soft))]/40 to-[hsl(var(--crm-surface))] p-4 md:p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[hsl(var(--crm-accent))]/10 blur-2xl" />
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--crm-accent))] to-purple-500 flex items-center justify-center shadow-lg shadow-[hsl(var(--crm-accent-glow))]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[hsl(var(--crm-text))]">Brief du matin</div>
            <div className="text-[11px] crm-muted">Les 3 missions à forte valeur pour vous, maintenant.</div>
          </div>
        </div>
        <Link
          to="/admin/crm/missions"
          className="text-xs font-medium text-[hsl(var(--crm-accent))] hover:underline inline-flex items-center gap-1"
        >
          Toutes les missions <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {top.length === 0 ? (
        <div className="text-center py-6 text-sm text-[hsl(var(--crm-text-muted))]">
          🌿 Aucune mission urgente. Belle journée pour prospecter en pleine conscience.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-3">
          {top.map(m => {
            const prio = MISSION_PRIORITY_META[m.priorite];
            const due = m.due_at ? new Date(m.due_at) : null;
            const late = due && due.getTime() < Date.now();
            return (
              <Link
                key={m.id}
                to="/admin/crm/missions"
                className="group rounded-xl bg-[hsl(var(--crm-surface))] border border-[hsl(var(--crm-border))] p-3 hover:shadow-md transition-all"
                style={{ borderLeft: `3px solid hsl(${prio.hue})` }}
              >
                <div className="text-sm font-medium text-[hsl(var(--crm-text))] line-clamp-2">{m.titre}</div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[hsl(var(--crm-text-muted))]" style={{ color: `hsl(${prio.hue})` }}>● {prio.label}</span>
                  <span className={cn('inline-flex items-center gap-1', late ? 'text-red-600' : 'text-[hsl(var(--crm-text-muted))]')}>
                    {late ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {due ? due.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'Sans échéance'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); updateStatus.mutate({ id: m.id, statut: 'realisee' }); }}
                  className="mt-2 w-full text-[11px] py-1 rounded-md bg-[hsl(var(--crm-accent-soft))] text-[hsl(var(--crm-accent))] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[hsl(var(--crm-accent))] hover:text-white"
                >
                  ✨ Marquer comme réalisée
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
