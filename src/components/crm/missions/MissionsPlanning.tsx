import React from 'react';
import { ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { MISSION_PRIORITY_META, MISSION_STATUS_META, type CrmMission } from '@/types/crmMissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Props {
  missions: CrmMission[];
  onOpen: (m: CrmMission) => void;
  onReschedule?: (id: string, newDueAtISO: string) => void;
}

const DAY_MS = 86400000;
const HOUR_START = 8;
const HOUR_END = 19; // inclusive — last slot row
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const ROW_H = 56; // px per hour
const SLOT_ID = (dayIdx: number, hour: number) => `slot_${dayIdx}_${hour}`;

function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0,0,0,0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export const MissionsPlanning: React.FC<Props> = ({ missions, onOpen, onReschedule }) => {
  const { activeMembers } = useTeamMembers();
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()));
  const [active, setActive] = React.useState<CrmMission | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));
  const start = weekStart.getTime();
  const end = start + 7 * DAY_MS;

  const inWeek = missions.filter(m => {
    if (!m.due_at) return false;
    const t = new Date(m.due_at).getTime();
    return t >= start && t < end;
  });
  const unscheduled = missions.filter(m => !m.due_at);

  // Now indicator
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to ~current hour on mount
  React.useEffect(() => {
    const h = Math.max(HOUR_START, Math.min(HOUR_END, now.getHours()));
    const top = (h - HOUR_START - 1) * ROW_H;
    scrollRef.current?.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = (e: DragStartEvent) => {
    const m = missions.find(x => x.id === e.active.id);
    if (m) setActive(m);
  };
  const handleEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over || !onReschedule) return;
    const overId = String(e.over.id);
    if (!overId.startsWith('slot_')) return;
    const [, dayIdxStr, hourStr] = overId.split('_');
    const dayIdx = parseInt(dayIdxStr, 10);
    const hour = parseInt(hourStr, 10);
    const m = missions.find(x => x.id === e.active.id);
    if (!m) return;
    const target = new Date(days[dayIdx]);
    const prev = m.due_at ? new Date(m.due_at) : null;
    const min = prev ? prev.getMinutes() : 0;
    target.setHours(hour, min, 0, 0);
    const iso = target.toISOString();
    if (iso !== m.due_at) onReschedule(m.id, iso);
  };

  const fmtDay = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  const todayStr = new Date().toDateString();
  const nowHourPct = (now.getHours() + now.getMinutes() / 60 - HOUR_START) / (HOUR_END - HOUR_START + 1);

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="rounded-2xl border border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--crm-border))] gap-3">
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
          <div className="text-[11px] text-[hsl(var(--crm-text-muted))] flex items-center gap-1">
            <Clock className="h-3 w-3" /> {HOUR_START}h – {HOUR_END}h · {inWeek.length} mission{inWeek.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Day headers */}
        <div className="grid border-b border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface-2))]" style={{ gridTemplateColumns: '64px repeat(7, minmax(0,1fr))' }}>
          <div />
          {days.map(d => {
            const isToday = d.toDateString() === todayStr;
            return (
              <div key={d.toISOString()} className={cn(
                'px-2 py-2 text-[11px] font-medium text-center border-l border-[hsl(var(--crm-border))]',
                isToday && 'text-[hsl(var(--crm-accent))]'
              )}>
                <div className="capitalize">{fmtDay(d)}</div>
                {isToday && <div className="text-[9px] uppercase tracking-wider opacity-70">Aujourd'hui</div>}
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div ref={scrollRef} className="relative overflow-auto" style={{ maxHeight: '70vh' }}>
          <div className="grid relative" style={{ gridTemplateColumns: '64px repeat(7, minmax(0,1fr))' }}>
            {/* Hour rail + cells */}
            {HOURS.map(h => (
              <React.Fragment key={h}>
                <div
                  className="text-[10px] text-[hsl(var(--crm-text-muted))] pr-2 pt-1 text-right border-t border-[hsl(var(--crm-border))]/60 tabular-nums"
                  style={{ height: ROW_H }}
                >
                  {String(h).padStart(2,'0')}:00
                </div>
                {days.map((d, dayIdx) => (
                  <SlotCell key={`${dayIdx}-${h}`} dayIdx={dayIdx} hour={h} isToday={d.toDateString() === todayStr}>
                    {inWeek
                      .filter(m => {
                        const t = new Date(m.due_at!);
                        return t.toDateString() === d.toDateString() && t.getHours() === h;
                      })
                      .map(m => <DraggableMission key={m.id} mission={m} onOpen={() => onOpen(m)} />)}
                  </SlotCell>
                ))}
              </React.Fragment>
            ))}

            {/* Now indicator */}
            {days.some(d => d.toDateString() === todayStr) && nowHourPct >= 0 && nowHourPct <= 1 && (
              <div
                className="absolute left-[64px] right-0 pointer-events-none z-10"
                style={{ top: nowHourPct * HOURS.length * ROW_H }}
              >
                <div className="relative h-px bg-[hsl(var(--crm-accent))]/70">
                  <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[hsl(var(--crm-accent))] shadow-[0_0_8px_hsl(var(--crm-accent))]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unscheduled tray */}
        {unscheduled.length > 0 && (
          <div className="border-t border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface-2))]/50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))] mb-1.5 flex items-center gap-1">
              <Users className="h-3 w-3" /> À planifier ({unscheduled.length}) — glissez dans le calendrier
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {unscheduled.slice(0, 30).map(m => (
                <div key={m.id} className="shrink-0 w-44"><DraggableMission mission={m} onOpen={() => onOpen(m)} compact /></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {active && <MissionChip mission={active} dragging />}
      </DragOverlay>
    </DndContext>
  );
};

// ─── Slot cell ────────────────────────────────────────────────
const SlotCell: React.FC<{ dayIdx: number; hour: number; isToday: boolean; children: React.ReactNode }> = ({ dayIdx, hour, isToday, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: SLOT_ID(dayIdx, hour) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-t border-l border-[hsl(var(--crm-border))]/60 p-1 space-y-1 transition-colors relative',
        isToday && 'bg-[hsl(var(--crm-accent))]/[0.025]',
        isOver && 'bg-[hsl(var(--crm-accent))]/15 ring-1 ring-inset ring-[hsl(var(--crm-accent))]/40',
      )}
      style={{ height: ROW_H }}
    >
      {children}
    </div>
  );
};

// ─── Draggable mission chip ────────────────────────────────────
const DraggableMission: React.FC<{ mission: CrmMission; onOpen: () => void; compact?: boolean }> = ({ mission, onOpen, compact }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: mission.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      className={cn('cursor-grab active:cursor-grabbing', isDragging && 'opacity-30')}
    >
      <MissionChip mission={mission} compact={compact} />
    </div>
  );
};

const MissionChip: React.FC<{ mission: CrmMission; compact?: boolean; dragging?: boolean }> = ({ mission, compact, dragging }) => {
  const prio = MISSION_PRIORITY_META[mission.priorite];
  const status = MISSION_STATUS_META[mission.statut];
  const time = mission.due_at ? new Date(mission.due_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div
      className={cn(
        'group rounded-md px-1.5 py-1 text-[11px] leading-tight backdrop-blur-sm overflow-hidden',
        'border border-transparent hover:border-white/20 hover:scale-[1.02] transition-all',
        dragging && 'shadow-2xl ring-2 ring-[hsl(var(--crm-accent))] rotate-1 scale-105',
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${prio.hue} / 0.18), hsl(${prio.hue} / 0.08))`,
        borderLeft: `3px solid hsl(${prio.hue})`,
        color: `hsl(${prio.hue})`,
      }}
      title={`${mission.titre}${time ? ` · ${time}` : ''}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-[9px] shrink-0 opacity-80">{status.emoji}</span>
        <span className="truncate font-medium">{mission.titre}</span>
      </div>
      {!compact && time && (
        <div className="text-[9px] opacity-70 tabular-nums">{time}</div>
      )}
    </div>
  );
};
