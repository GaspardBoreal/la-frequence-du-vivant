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
import { 
  GripVertical, 
  MapPin, 
  Calendar, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Footprints,
  Radio,
  Waves
} from 'lucide-react';
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
      className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
        isDragging 
          ? 'scale-105 shadow-2xl bg-gradient-to-br from-white to-sage-50' 
          : 'hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-white via-white to-sage-25'
      }`}
    >
      {/* Motif décoratif de fréquences */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M20,50 Q50,10 80,50 Q50,90 20,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse" />
          <path d="M25,50 Q50,20 75,50 Q50,80 25,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse" style={{animationDelay: '0.2s'}} />
          <path d="M30,50 Q50,30 70,50 Q50,70 30,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse" style={{animationDelay: '0.4s'}} />
        </svg>
      </div>
      
      <div className="relative p-6 border border-sage-100 rounded-xl">
        <div className="flex items-start gap-4">
          {/* Icône et numéro d'ordre */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center shadow-sm">
                <Footprints className="h-5 w-5 text-sage-600" />
              </div>
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground"
              >
                {index + 1}
              </Badge>
            </div>
            
            {/* Poignée de drag stylisée */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 rounded-lg bg-sage-50 hover:bg-sage-100 transition-colors group/drag"
            >
              <GripVertical className="h-4 w-4 text-sage-400 group-hover/drag:text-sage-600" />
            </div>
          </div>
          
          {/* Informations de la marche */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-lg font-semibold text-sage-800 truncate">
                {marche.marche?.nom_marche || `Marché de ${marche.marche?.ville}`}
              </h4>
              <div className="flex items-center gap-1 text-sage-500">
                <Waves className="h-4 w-4" />
                <span className="text-xs">Étape {index + 1}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="text-xs bg-white border-sage-200">
                <MapPin className="h-3 w-3 mr-1.5 text-sage-500" />
                {marche.marche?.ville}
              </Badge>
              
              {marche.marche?.date && (
                <Badge variant="outline" className="text-xs bg-white border-sage-200">
                  <Calendar className="h-3 w-3 mr-1.5 text-sage-500" />
                  {marche.marche.date}
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-sage-50 to-sage-100 border-sage-200">
                <Radio className="h-3 w-3 mr-1.5 text-sage-500" />
                Connexion {index + 1}
              </Badge>
            </div>
            
            {marche.marche?.descriptif_court && (
              <p className="text-sm text-sage-600 leading-relaxed line-clamp-2">
                {marche.marche.descriptif_court}
              </p>
            )}
          </div>
          
          {/* Actions élégantes */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              title="Remonter dans la séquence"
              className="h-8 w-8 p-0 rounded-full hover:bg-sage-100 disabled:opacity-30"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(index)}
              disabled={index === totalCount - 1}
              title="Descendre dans la séquence"
              className="h-8 w-8 p-0 rounded-full hover:bg-sage-100 disabled:opacity-30"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(marche.marche_id)}
              title="Retirer de l'exploration"
              className="h-8 w-8 p-0 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
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
      <Card className="bg-gradient-to-br from-sage-25 to-white border-sage-100">
        <CardContent className="p-12 text-center">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-sage-100 to-sage-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-sage-200 to-sage-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute inset-4 bg-gradient-to-br from-sage-300 to-sage-400 rounded-full opacity-40 flex items-center justify-center">
              <Footprints className="h-8 w-8 text-sage-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-sage-700 mb-2">
            Première étape de votre exploration
          </h3>
          <div className="text-sage-600 mb-4">
            Aucune marche n'a encore été assignée à cette exploration
          </div>
          <p className="text-sm text-sage-500 max-w-md mx-auto leading-relaxed">
            Commencez par sélectionner des marchés dans la section ci-dessous pour créer votre parcours sensoriel unique
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-sage-25 border-sage-100 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
              <Footprints className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl text-sage-800">
              Séquence de l'exploration
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {sortedMarches.length} étape{sortedMarches.length > 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-sage-600">
          <Waves className="h-4 w-4" />
          <span>Organisez le parcours de votre exploration multisensorielle</span>
        </div>
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
            <div className="space-y-4">
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