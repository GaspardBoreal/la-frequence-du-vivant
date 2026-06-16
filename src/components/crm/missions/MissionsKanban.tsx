import React from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { MissionCard } from './MissionCard';
import { MISSION_STATUS_META, MISSION_STATUSES, type CrmMission, type CrmMissionStatus } from '@/types/crmMissions';
import { cn } from '@/lib/utils';

interface Props {
  missions: CrmMission[];
  onOpen: (m: CrmMission) => void;
  onStatusChange: (id: string, status: CrmMissionStatus) => void;
}

export const MissionsKanban: React.FC<Props> = ({ missions, onOpen, onStatusChange }) => {
  const [active, setActive] = React.useState<CrmMission | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = React.useMemo(() => {
    const out: Record<CrmMissionStatus, CrmMission[]> = { a_faire: [], en_cours: [], realisee: [], archivee: [] };
    for (const m of missions) out[m.statut]?.push(m);
    return out;
  }, [missions]);

  const handleStart = (e: DragStartEvent) => {
    const m = missions.find(x => x.id === e.active.id);
    if (m) setActive(m);
  };
  const handleEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const status = e.over.id as CrmMissionStatus;
    const m = missions.find(x => x.id === e.active.id);
    if (m && m.statut !== status && MISSION_STATUSES.includes(status)) {
      onStatusChange(m.id, status);
      if (status === 'realisee') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ['#0D6B58','#22c55e','#fef3c7','#86efac'] });
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MISSION_STATUSES.map(status => (
          <KanbanCol key={status} status={status} missions={byStatus[status]} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{active && <MissionCard mission={active} onOpen={() => {}} />}</DragOverlay>
    </DndContext>
  );
};

const KanbanCol: React.FC<{ status: CrmMissionStatus; missions: CrmMission[]; onOpen: (m: CrmMission) => void }> = ({ status, missions, onOpen }) => {
  const meta = MISSION_STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl border bg-[hsl(var(--crm-surface))]/40 backdrop-blur-sm p-3 min-h-[400px] transition-colors',
        'border-[hsl(var(--crm-border))]',
        isOver && 'bg-[hsl(var(--crm-accent-soft))]/40 border-[hsl(var(--crm-accent))]',
      )}
      style={{ borderTopColor: `hsl(${meta.hue})`, borderTopWidth: 2 }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.emoji}</span>
          <h3 className="text-sm font-semibold text-[hsl(var(--crm-text))]">{meta.label}</h3>
        </div>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: `hsl(${meta.hue} / 0.15)`, color: `hsl(${meta.hue})` }}
        >
          {missions.length}
        </span>
      </div>
      <div className="space-y-2">
        {missions.length === 0 && (
          <div className="text-xs text-center py-8 text-[hsl(var(--crm-text-muted))]/60 italic">
            Déposer une mission ici
          </div>
        )}
        {missions.map(m => <DraggableCard key={m.id} mission={m} onOpen={() => onOpen(m)} />)}
      </div>
    </div>
  );
};

const DraggableCard: React.FC<{ mission: CrmMission; onOpen: () => void }> = ({ mission, onOpen }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: mission.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && 'opacity-30')}>
      <MissionCard mission={mission} onOpen={onOpen} />
    </div>
  );
};
