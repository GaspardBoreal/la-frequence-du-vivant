import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import ContributionItem, { type ContributionItemProps } from './ContributionItem';

interface DraggableContributionGridProps {
  items: (Omit<ContributionItemProps, 'isOwner'> & { id: string })[];
  viewMode: 'immersion' | 'fiche';
  onReorder: (reorderedIds: { id: string; ordre: number }[]) => void;
  onUpdate?: ContributionItemProps['onUpdate'];
  onDelete?: ContributionItemProps['onDelete'];
  onClick?: (index: number) => void;
  getGpsDistance?: (id: string) => ContributionItemProps['gpsDistance'];
}

// ─── Sortable wrapper ───
const SortableItem: React.FC<{
  id: string;
  isDragActive: boolean;
  children: React.ReactNode;
}> = ({ id, isDragActive, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group ${isDragging ? 'z-50 ring-1 ring-emerald-400/40 rounded-xl' : ''}`}>
      {/* Grip handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute top-1 left-1 z-20 cursor-grab active:cursor-grabbing rounded p-0.5 transition-opacity ${
          isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <GripVertical className="w-3 h-3 text-white/70" />
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

const DraggableContributionGrid: React.FC<DraggableContributionGridProps> = ({
  items,
  viewMode,
  onReorder,
  onUpdate,
  onDelete,
  onClick,
  getGpsDistance,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    // Compute new order
    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((item, idx) => ({ id: item.id, ordre: idx + 1 }));
    onReorder(updates);
  };

  const ids = items.map(i => i.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={`grid ${viewMode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'}`}>
          {items.map((item, i) => (
            <SortableItem key={item.id} id={item.id} isDragActive={!!activeId}>
              <ContributionItem
                id={item.id}
                type={item.type}
                titre={item.titre}
                description={item.description}
                url={item.url}
                externalUrl={item.externalUrl}
                contenu={item.contenu}
                typeTexte={item.typeTexte}
                isPublic={item.isPublic}
                isOwner={true}
                createdAt={item.createdAt}
                viewMode={viewMode}
                gpsDistance={getGpsDistance?.(item.id) ?? null}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onClick={() => onClick?.(i)}
              />
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DraggableContributionGrid;
