import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OpportunityCard } from './OpportunityCard';
import type { CrmOpportunity, KanbanColumn as KanbanColumnType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  opportunities: CrmOpportunity[];
  onEditOpportunity?: (opportunity: CrmOpportunity) => void;
  onDeleteOpportunity?: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  opportunities,
  onEditOpportunity,
  onDeleteOpportunity,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const opportunityIds = opportunities.map(o => o.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg p-2",
        isOver && "ring-2 ring-primary/50 bg-muted/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", column.color)} />
          <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {opportunities.length}
        </span>
      </div>

      {/* Cards Container */}
      <SortableContext items={opportunityIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1 min-h-[200px] overflow-y-auto">
          {opportunities.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground italic">
              Aucune opportunité
            </div>
          ) : (
            opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onEdit={onEditOpportunity}
                onDelete={onDeleteOpportunity}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};
