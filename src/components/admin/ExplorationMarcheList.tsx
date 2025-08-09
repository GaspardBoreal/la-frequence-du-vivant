import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Calendar, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ExplorationMarche } from '@/hooks/useExplorations';

interface SortableMarcheItemProps {
  marche: ExplorationMarche;
  index: number;
  totalCount: number;
  onRemove: (marcheId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const SortableMarcheItem: React.FC<SortableMarcheItemProps> = ({
  marche,
  index,
  totalCount,
  onRemove,
  onMoveUp,
  onMoveDown
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: marche.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white border border-sage-200 rounded-lg p-4 hover:border-sage-300 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Badge d'ordre */}
        <Badge variant="outline" className="text-xs min-w-[2rem] justify-center">
          {index + 1}
        </Badge>
        
        {/* Poignée de drag */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-sage-400 hover:text-sage-600"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        {/* Informations de la marche */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sage-800 truncate">
              {marche.marche?.nom_marche || `Marché de ${marche.marche?.ville}`}
            </h4>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {marche.marche?.ville}
            </Badge>
            
            {marche.marche?.date && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {marche.marche.date}
              </Badge>
            )}
          </div>
          
          {marche.marche?.descriptif_court && (
            <p className="text-sm text-sage-600 line-clamp-2">
              {marche.marche.descriptif_court}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            title="Monter"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
            title="Descendre"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(marche.marche_id)}
            className="text-red-600 hover:text-red-700"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ExplorationMarcheListProps {
  explorationMarches: ExplorationMarche[];
  onReorder: (marcheOrders: { marcheId: string; ordre: number }[]) => void;
  onRemove: (marcheId: string) => void;
}

const ExplorationMarcheList: React.FC<ExplorationMarcheListProps> = ({
  explorationMarches,
  onReorder,
  onRemove
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedMarches = [...explorationMarches].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedMarches.findIndex(item => item.id === active.id);
      const newIndex = sortedMarches.findIndex(item => item.id === over.id);
      
      const newOrder = arrayMove(sortedMarches, oldIndex, newIndex);
      const marcheOrders = newOrder.map((marche, index) => ({
        marcheId: marche.marche_id,
        ordre: index + 1
      }));
      
      onReorder(marcheOrders);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...sortedMarches];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      
      const marcheOrders = newOrder.map((marche, i) => ({
        marcheId: marche.marche_id,
        ordre: i + 1
      }));
      
      onReorder(marcheOrders);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sortedMarches.length - 1) {
      const newOrder = [...sortedMarches];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      const marcheOrders = newOrder.map((marche, i) => ({
        marcheId: marche.marche_id,
        ordre: i + 1
      }));
      
      onReorder(marcheOrders);
    }
  };

  if (sortedMarches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-sage-600 mb-4">
            Aucune marche assignée à cette exploration
          </div>
          <p className="text-sm text-sage-500">
            Utilisez la section ci-dessous pour ajouter des marches
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-sage-800">
          Marches de l'exploration ({sortedMarches.length})
        </CardTitle>
        <p className="text-sm text-sage-600">
          Glissez-déposez pour réorganiser ou utilisez les boutons
        </p>
      </CardHeader>
      
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedMarches.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedMarches.map((marche, index) => (
                <SortableMarcheItem
                  key={marche.id}
                  marche={marche}
                  index={index}
                  totalCount={sortedMarches.length}
                  onRemove={onRemove}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};

export default ExplorationMarcheList;