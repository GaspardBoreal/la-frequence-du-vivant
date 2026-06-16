import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MISSION_PRIORITY_META, type CrmMission } from '@/types/crmMissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Props {
  missions: CrmMission[];
  onOpen: (m: CrmMission) => void;
}

const DAY_MS = 86400000;

function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0,0,0,0);
  const day = (x.getDay() + 6) % 7; // monday-based
  x.setDate(x.getDate() - day);
  return x;
}

export const MissionsPlanning: React.FC<Props> = ({ missions, onOpen }) => {
  const { activeMembers } = useTeamMembers();
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()));

  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));
  const start = weekStart.getTime();
  const end = start + 7 * DAY_MS;

  const inWeek = missions.filter(m => {
    if (!m.due_at) return false;
    const t = new Date(m.due_at).getTime();
    return t >= start && t < end;
  });

  // Group by assignee (or unassigned)
  type Lane = { key: string; label: string; member?: any; items: CrmMission[] };
  const lanes: Lane[] = [];
  const ensureLane = (key: string, label: string, member?: any) => {
    let l = lanes.find(x => x.key === key);
    if (!l) { l = { key, label, member, items: [] }; lanes.push(l); }
    return l;
  };
  for (const m of inWeek) {
    if (!m.assignees || m.assignees.length === 0) {
      ensureLane('__none', 'Non assigné').items.push(m);
    } else {
      for (const a of m.assignees) {
        const member = activeMembers.find(x => x.user_id === a.user_id);
        const label = member ? `${member.prenom} ${member.nom}` : 'Inconnu';
        ensureLane(a.user_id, label, member).items.push(m);
      }
    }
  }

  const fmtDay = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
  const todayStr = new Date().toDateString();

  return (
    <div className="rounded-2xl border border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--crm-border))]">
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(new Date(start - 7 * DAY_MS))} className="h-7 w-7 rounded-md hover:bg-[hsl(var(--crm-surface-2))] flex items-center justify-center">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-xs px-2 h-7 rounded-md hover:bg-[hsl(var(--crm-surface-2))]">
            Aujourd'hui
          </button>
          <button onClick={() => setWeekStart(new Date(start + 7 * DAY_MS))} className="h-7 w-7 rounded-md hover:bg-[hsl(var(--crm-surface-2))] flex items-center justify-center">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm font-medium text-[hsl(var(--crm-text))]">
          Semaine du {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        <div className="text-[11px] text-[hsl(var(--crm-text-muted))]">
          {inWeek.length} mission{inWeek.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid" style={{ gridTemplateColumns: '160px repeat(7, minmax(0,1fr))' }}>
            <div className="border-b border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface-2))] p-2 text-[11px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">
              Bizdev
            </div>
            {days.map(d => (
              <div
                key={d.toISOString()}
                className={cn(
                  'border-b border-l border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface-2))] p-2 text-[11px] font-medium text-center',
                  d.toDateString() === todayStr && 'text-[hsl(var(--crm-accent))]'
                )}
              >
                {fmtDay(d)}
              </div>
            ))}

            {lanes.length === 0 && (
              <>
                <div className="p-3 text-xs text-[hsl(var(--crm-text-muted))] italic">—</div>
                <div className="col-span-7 p-6 text-center text-sm text-[hsl(var(--crm-text-muted))]">
                  Aucune mission planifiée cette semaine.
                </div>
              </>
            )}

            {lanes.map(lane => (
              <React.Fragment key={lane.key}>
                <div className="border-b border-[hsl(var(--crm-border))] p-2 flex items-center gap-2 min-h-[64px]">
                  {lane.member && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={lane.member.photo_url ?? undefined} />
                      <AvatarFallback className="text-[9px]">{(lane.member.prenom?.[0] ?? '?') + (lane.member.nom?.[0] ?? '')}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-xs font-medium truncate">{lane.label}</span>
                </div>
                {days.map(d => {
                  const dayStart = d.getTime();
                  const dayItems = lane.items.filter(m => {
                    const t = new Date(m.due_at!).getTime();
                    return t >= dayStart && t < dayStart + DAY_MS;
                  });
                  return (
                    <div key={d.toISOString()} className="border-b border-l border-[hsl(var(--crm-border))] p-1 min-h-[64px] space-y-1">
                      {dayItems.map(m => {
                        const prio = MISSION_PRIORITY_META[m.priorite];
                        return (
                          <button
                            key={m.id}
                            onClick={() => onOpen(m)}
                            className="w-full text-left text-[11px] px-1.5 py-1 rounded-md truncate hover:scale-[1.02] transition-transform"
                            style={{
                              background: `hsl(${prio.hue} / 0.15)`,
                              borderLeft: `2px solid hsl(${prio.hue})`,
                              color: `hsl(${prio.hue})`,
                            }}
                            title={m.titre}
                          >
                            {m.titre}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
