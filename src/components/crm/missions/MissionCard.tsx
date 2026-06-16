import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Flame, AlertTriangle } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { MISSION_PRIORITY_META, type CrmMission } from '@/types/crmMissions';
import { cn } from '@/lib/utils';

interface Props { mission: CrmMission; onOpen: () => void; }

function fmtDue(dueIso: string | null): { label: string; tone: 'late' | 'soon' | 'normal' | 'none' } {
  if (!dueIso) return { label: 'Sans échéance', tone: 'none' };
  const due = new Date(dueIso).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const diffH = Math.round(diffMs / 36e5);
  const absH = Math.abs(diffH);
  const day = 24;
  let label = '';
  if (absH < 1) label = diffMs >= 0 ? "à l'instant" : "à l'instant";
  else if (absH < day) label = diffMs >= 0 ? `dans ${absH} h` : `il y a ${absH} h`;
  else label = diffMs >= 0 ? `dans ${Math.round(absH / day)} j` : `il y a ${Math.round(absH / day)} j`;
  const tone = diffMs < 0 ? 'late' : diffMs < 36 * 36e5 ? 'soon' : 'normal';
  return { label, tone };
}

export const MissionCard: React.FC<Props> = ({ mission, onOpen }) => {
  const { activeMembers } = useTeamMembers();
  const assigneeMembers = (mission.assignees ?? [])
    .map(a => activeMembers.find(m => m.user_id === a.user_id))
    .filter(Boolean) as typeof activeMembers;

  const prio = MISSION_PRIORITY_META[mission.priorite];
  const due = fmtDue(mission.due_at);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative w-full text-left rounded-xl border bg-[hsl(var(--crm-surface))] p-3 hover:bg-[hsl(var(--crm-surface-2))] transition-all',
        'border-[hsl(var(--crm-border))] hover:shadow-md',
      )}
      style={{ borderLeft: `3px solid hsl(${prio.hue})` }}
    >
      {mission.priorite === 'critique' && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none animate-pulse"
          style={{ boxShadow: `inset 0 0 0 1px hsl(${prio.hue} / 0.5)` }}
        />
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[hsl(var(--crm-text))] line-clamp-2">
            {mission.titre}
          </div>
          {mission.tags?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {mission.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--crm-surface-2))] text-[hsl(var(--crm-text-muted))]">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        {mission.priorite === 'critique' && <Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {assigneeMembers.slice(0, 3).map(m => (
            <Avatar key={m.id} className="h-6 w-6 ring-2 ring-[hsl(var(--crm-surface))]">
              <AvatarImage src={m.photo_url ?? undefined} />
              <AvatarFallback className="text-[9px] bg-[hsl(var(--crm-accent-soft))] text-[hsl(var(--crm-accent))]">
                {(m.prenom?.[0] ?? '?') + (m.nom?.[0] ?? '')}
              </AvatarFallback>
            </Avatar>
          ))}
          {assigneeMembers.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-[hsl(var(--crm-surface-2))] text-[10px] flex items-center justify-center ring-2 ring-[hsl(var(--crm-surface))]">
              +{assigneeMembers.length - 3}
            </div>
          )}
          {assigneeMembers.length === 0 && (
            <div className="h-6 px-2 rounded-full bg-[hsl(var(--crm-surface-2))] text-[10px] flex items-center text-[hsl(var(--crm-text-muted))]">
              non assigné
            </div>
          )}
        </div>

        <div
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium',
            due.tone === 'late' && 'text-red-600 animate-pulse',
            due.tone === 'soon' && 'text-amber-600',
            due.tone === 'normal' && 'text-[hsl(var(--crm-text-muted))]',
            due.tone === 'none' && 'text-[hsl(var(--crm-text-muted))]/60',
          )}
        >
          {due.tone === 'late' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {due.label}
        </div>
      </div>
    </button>
  );
};
