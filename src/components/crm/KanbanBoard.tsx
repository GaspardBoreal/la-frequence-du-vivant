import React, { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { OpportunityCard } from './OpportunityCard';
import { PipelineNavigator } from './PipelineNavigator';
import { KANBAN_COLUMNS, type CrmOpportunity, type OpportunityStatus } from '@/types/crm';
import { useCrmOpportunities } from '@/hooks/useCrmOpportunities';
import { OpportunityDocsIndexProvider } from '@/hooks/useOpportunitiesDocumentsIndex';

interface KanbanBoardProps {
  onEditOpportunity?: (opportunity: CrmOpportunity) => void;
  onDeleteOpportunity?: (id: string) => void;
  filterPredicate?: (opportunity: CrmOpportunity) => boolean;
  /** Si fourni, masque les colonnes dont l'id n'est pas dans la liste. */
  visibleStages?: OpportunityStatus[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onEditOpportunity,
  onDeleteOpportunity,
  filterPredicate,
  visibleStages,
}) => {
  const { opportunitiesByStatus: rawByStatus, updateStatus } = useCrmOpportunities();
  const opportunitiesByStatus = React.useMemo(() => {
    if (!filterPredicate) return rawByStatus;
    const out: typeof rawByStatus = {} as any;
    for (const [k, list] of Object.entries(rawByStatus)) {
      (out as any)[k] = (list as CrmOpportunity[]).filter(filterPredicate);
    }
    return out;
  }, [rawByStatus, filterPredicate]);
  const visibleColumns = React.useMemo(() => {
    if (!visibleStages || visibleStages.length === KANBAN_COLUMNS.length) return KANBAN_COLUMNS;
    const set = new Set(visibleStages);
    const filtered = KANBAN_COLUMNS.filter((c) => set.has(c.id));
    return filtered.length > 0 ? filtered : KANBAN_COLUMNS;
  }, [visibleStages]);
  const [activeOpportunity, setActiveOpportunity] = useState<CrmOpportunity | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'ArrowRight') { scrollRef.current?.scrollBy({ left: 296, behavior: 'smooth' }); }
    else if (e.key === 'ArrowLeft') { scrollRef.current?.scrollBy({ left: -296, behavior: 'smooth' }); }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedId = active.id as string;
    
    // Find the opportunity being dragged
    for (const opportunities of Object.values(opportunitiesByStatus)) {
      const found = opportunities.find(o => o.id === draggedId);
      if (found) {
        setActiveOpportunity(found);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);

    if (!over) return;

    const opportunityId = active.id as string;
    const newStatus = over.id as OpportunityStatus;

    // Check if dropped on a column (not on another card)
    if (KANBAN_COLUMNS.some(col => col.id === newStatus)) {
      // Find current status
      let currentStatus: OpportunityStatus | null = null;
      for (const [status, opportunities] of Object.entries(opportunitiesByStatus)) {
        if (opportunities.some(o => o.id === opportunityId)) {
          currentStatus = status as OpportunityStatus;
          break;
        }
      }

      // Only update if status changed
      if (currentStatus && currentStatus !== newStatus) {
        updateStatus.mutate({ id: opportunityId, statut: newStatus });
      }
    }
  };

  return (
    <OpportunityDocsIndexProvider>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative outline-none"
      >
        <PipelineNavigator
          scrollRef={scrollRef}
          columns={visibleColumns}
          opportunitiesByStatus={opportunitiesByStatus}
        />
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 min-h-[500px] scroll-smooth"
        >
          {visibleColumns.map((column) => (
            <div key={column.id} data-col-id={column.id} className="shrink-0">
              <KanbanColumn
                column={column}
                opportunities={opportunitiesByStatus[column.id] || []}
                onEditOpportunity={onEditOpportunity}
                onDeleteOpportunity={onDeleteOpportunity}
              />
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeOpportunity && (
          <OpportunityCard
            opportunity={activeOpportunity}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
    </OpportunityDocsIndexProvider>
  );
};
