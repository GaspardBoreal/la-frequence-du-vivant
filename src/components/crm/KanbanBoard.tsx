import React, { useState } from 'react';
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
import { KANBAN_COLUMNS, type CrmOpportunity, type OpportunityStatus } from '@/types/crm';
import { useCrmOpportunities } from '@/hooks/useCrmOpportunities';

interface KanbanBoardProps {
  onEditOpportunity?: (opportunity: CrmOpportunity) => void;
  onDeleteOpportunity?: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onEditOpportunity,
  onDeleteOpportunity,
}) => {
  const { opportunitiesByStatus, updateStatus } = useCrmOpportunities();
  const [activeOpportunity, setActiveOpportunity] = useState<CrmOpportunity | null>(null);

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            opportunities={opportunitiesByStatus[column.id] || []}
            onEditOpportunity={onEditOpportunity}
            onDeleteOpportunity={onDeleteOpportunity}
          />
        ))}
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
  );
};
