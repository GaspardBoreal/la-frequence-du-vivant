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
  Waves,
  Settings2,
  Eye,
  Users,
  EyeOff
} from 'lucide-react';
import { ExplorationMarche } from '@/hooks/useExplorations';
import PublicationStatusSelect from './PublicationStatusSelect';
import { stripHtml } from '@/utils/textUtils';

interface SortableMarcheItemProps {
  marche: ExplorationMarche;
  index: number;
  totalCount: number;
  onRemove: (marcheId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onUpdatePublicationStatus: (marcheId: string, status: 'published_public' | 'published_readers' | 'draft') => void;
  isUpdatingStatus?: boolean;
}

const SortableMarcheItem: React.FC<SortableMarcheItemProps> = ({
  marche,
  index,
  totalCount,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdatePublicationStatus,
  isUpdatingStatus = false
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

  const isVisibleToReaders = marche.publication_status === 'published_public' || marche.publication_status === 'published_readers';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 backdrop-blur-xl border ${
        isDragging 
          ? 'scale-105 shadow-2xl bg-gradient-to-br from-gaspard-background/60 to-gaspard-background/40 border-gaspard-primary/40 shadow-gaspard-primary/20' 
          : `hover:scale-[1.02] hover:shadow-xl ${
              isVisibleToReaders 
                ? 'bg-gradient-to-br from-gaspard-accent/25 via-gaspard-accent/15 to-gaspard-primary/20 border-gaspard-accent/50 shadow-xl shadow-gaspard-accent/20 border-l-4 border-l-gaspard-accent' 
                : 'bg-gradient-to-br from-gaspard-background/30 to-gaspard-background/10 border-gaspard-primary/20 shadow-lg shadow-gaspard-primary/5'
            } hover:border-gaspard-accent/30`
      } ${isVisibleToReaders ? 'animate-gentle-glow' : ''}`}
    >
      {/* Effet de surbrillance dorée pour les marches visibles aux lecteurs */}
      {isVisibleToReaders && (
        <div className="absolute inset-0 bg-gradient-to-r from-gaspard-accent/10 via-transparent to-gaspard-accent/5 pointer-events-none animate-gentle-float"></div>
      )}
      
      {/* Motif décoratif de fréquences élégant */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path 
            d="M20,50 Q50,10 80,50 Q50,90 20,50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.3" 
            className={`animate-gentle-float ${isVisibleToReaders ? 'text-gaspard-accent' : 'text-gaspard-primary'}`} 
          />
          <path 
            d="M25,50 Q50,20 75,50 Q50,80 25,50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.3" 
            className={`animate-gentle-float animation-delay-300 ${isVisibleToReaders ? 'text-gaspard-accent' : 'text-gaspard-accent'}`} 
          />
          <path 
            d="M30,50 Q50,30 70,50 Q50,70 30,50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.3" 
            className={`animate-gentle-float animation-delay-600 ${isVisibleToReaders ? 'text-gaspard-accent' : 'text-gaspard-secondary'}`} 
          />
        </svg>
      </div>
      
      <div className={`relative p-8 border-0 rounded-2xl backdrop-blur-sm ${
        isVisibleToReaders ? 'bg-gradient-to-br from-gaspard-accent/8 to-transparent' : ''
      }`}>
        <div className="flex items-start gap-4">
          {/* Icône et numéro d'ordre */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl ${
                isVisibleToReaders 
                  ? 'bg-gradient-to-br from-gaspard-accent/40 to-gaspard-accent/60 shadow-xl shadow-gaspard-accent/30' 
                  : 'bg-gradient-to-br from-gaspard-primary/30 to-gaspard-accent/40 shadow-xl'
              } flex items-center justify-center backdrop-blur-sm`}>
                <Footprints className={`h-6 w-6 ${isVisibleToReaders ? 'text-gaspard-background' : 'text-gaspard-background'}`} />
              </div>
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-gaspard-accent to-gaspard-secondary text-gaspard-background shadow-lg"
              >
                {index + 1}
              </Badge>
            </div>
            
            {/* Poignée de drag stylisée */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-3 rounded-xl bg-gaspard-primary/10 hover:bg-gaspard-primary/20 transition-colors group/drag backdrop-blur-sm"
            >
              <GripVertical className="h-5 w-5 text-gaspard-secondary group-hover/drag:text-gaspard-primary transition-colors duration-300" />
            </div>
          </div>
          
          {/* Informations de la marche */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-xl font-bold text-gaspard-primary truncate leading-tight mb-2">
                {marche.marche?.nom_marche || `Marché de ${marche.marche?.ville}`}
              </h4>
              <div className="flex items-center gap-2 text-gaspard-secondary mb-4">
                <Waves className="h-4 w-4" />
                <span className="text-sm font-light">Étape {index + 1}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="px-3 py-1.5 text-xs bg-gradient-to-r from-gaspard-background/60 to-gaspard-background/40 backdrop-blur-sm border border-gaspard-primary/30 rounded-full flex items-center gap-2">
                <MapPin className="h-3 w-3 text-gaspard-primary" />
                <span className="text-gaspard-primary font-medium">{marche.marche?.ville}</span>
              </div>
              
              {marche.marche?.date && (
                <div className="px-3 py-1.5 text-xs bg-gradient-to-r from-gaspard-background/60 to-gaspard-background/40 backdrop-blur-sm border border-gaspard-accent/30 rounded-full flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-gaspard-accent" />
                  <span className="text-gaspard-accent font-medium">{marche.marche.date}</span>
                </div>
              )}
              
              <div className="px-3 py-1.5 text-xs bg-gradient-to-r from-gaspard-secondary/20 to-gaspard-accent/20 backdrop-blur-sm border border-gaspard-secondary/30 rounded-full flex items-center gap-2">
                <Radio className="h-3 w-3 text-gaspard-secondary" />
                <span className="text-gaspard-secondary font-medium">Connexion {index + 1}</span>
              </div>
            </div>

            {/* Sélecteur de statut de publication avec indicateur visuel */}
            <div className="mb-4 flex items-center gap-3">
              <PublicationStatusSelect
                value={(marche.publication_status as any) || 'published_public'}
                onChange={(status) => onUpdatePublicationStatus(marche.marche_id, status)}
                variant="compact"
                isLoading={isUpdatingStatus}
              />
              {isVisibleToReaders && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-200 rounded-full">
                  <Eye className="h-3 w-3 text-green-700" />
                  <span className="text-xs font-bold text-green-800">Visible aux lecteurs</span>
                </div>
              )}
            </div>
            
            {marche.marche?.descriptif_court && (
              <p className="text-sm text-gaspard-secondary leading-relaxed line-clamp-2 font-light">
                {stripHtml(marche.marche.descriptif_court)}
              </p>
            )}
          </div>
          
          {/* Actions élégantes et subtiles */}
          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              title="Remonter dans la séquence"
              className="h-10 w-10 p-0 rounded-xl hover:bg-gaspard-primary/20 disabled:opacity-30 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            >
              <ArrowUp className="h-4 w-4 text-gaspard-primary" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(index)}
              disabled={index === totalCount - 1}
              title="Descendre dans la séquence"
              className="h-10 w-10 p-0 rounded-xl hover:bg-gaspard-primary/20 disabled:opacity-30 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            >
              <ArrowDown className="h-4 w-4 text-gaspard-primary" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(marche.marche_id)}
              title="Retirer de l'exploration"
              className="h-10 w-10 p-0 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            >
              <Trash2 className="h-4 w-4" />
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
  onUpdatePublicationStatus: (marcheId: string, status: 'published_public' | 'published_readers' | 'draft') => void;
  onBatchUpdateStatus: (marcheIds: string[], status: 'published_public' | 'published_readers' | 'draft') => void;
  isUpdatingStatus?: boolean;
}

const ExplorationMarcheList: React.FC<ExplorationMarcheListProps> = ({
  explorationMarches,
  onReorder,
  onRemove,
  onUpdatePublicationStatus,
  onBatchUpdateStatus,
  isUpdatingStatus = false
}) => {
  const [selectedMarches, setSelectedMarches] = React.useState<string[]>([]);
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gaspard-background/40 via-gaspard-background/20 to-transparent backdrop-blur-xl border border-gaspard-primary/20 shadow-2xl shadow-gaspard-primary/10">
        {/* Particules de fond */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gaspard-primary/5 rounded-full blur-3xl animate-gentle-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gaspard-accent/5 rounded-full blur-3xl animate-gentle-float animation-delay-300"></div>
        </div>
        
        <div className="relative p-12 text-center">
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-gaspard-primary/20 to-gaspard-accent/30 rounded-full animate-gentle-float"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-gaspard-accent/30 to-gaspard-secondary/40 rounded-full animate-gentle-float animation-delay-300"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-gaspard-secondary/40 to-gaspard-primary/50 rounded-full flex items-center justify-center animate-gentle-float animation-delay-600">
              <Footprints className="h-8 w-8 text-gaspard-background animate-soft-pulse" />
            </div>
          </div>
          
          <h3 className="gaspard-main-title text-2xl font-bold text-gaspard-primary mb-4">
            Première étape de votre exploration
          </h3>
          <div className="text-lg text-gaspard-secondary mb-6 font-light">
            Aucune marche n'a encore été assignée à cette exploration
          </div>
          <p className="text-sm text-gaspard-muted max-w-md mx-auto leading-relaxed font-light">
            Commencez par sélectionner des territoires dans la section d'enrichissement pour créer votre parcours sensoriel unique
          </p>
          
          {/* Ligne décorative */}
          <div className="mt-8 w-16 h-0.5 bg-gradient-to-r from-gaspard-primary to-gaspard-accent mx-auto rounded-full opacity-60"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gaspard-background/40 via-gaspard-background/20 to-transparent backdrop-blur-xl border border-gaspard-primary/20 shadow-2xl shadow-gaspard-primary/10">
      {/* Particules de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gaspard-accent/5 rounded-full blur-3xl animate-gentle-float"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gaspard-primary/5 rounded-full blur-3xl animate-gentle-float animation-delay-300"></div>
      </div>
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gaspard-primary/20 to-gaspard-accent/30 flex items-center justify-center backdrop-blur-sm">
              <Footprints className="h-5 w-5 text-gaspard-primary" />
            </div>
            <h3 className="gaspard-main-title text-4xl font-bold text-gaspard-primary">
              Séquence de l'exploration
            </h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gaspard-accent animate-gentle-float"></div>
              <span className="text-sm text-gaspard-muted font-light">
                {sortedMarches.length} étape{sortedMarches.length > 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Compteur marches visibles aux lecteurs */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gaspard-accent animate-gentle-float"></div>
              <span className="text-sm text-gaspard-secondary font-medium">
                {sortedMarches.filter(m => 
                  m.publication_status === 'published_public' || 
                  m.publication_status === 'published_readers'
                ).length} marche{sortedMarches.filter(m => 
                  m.publication_status === 'published_public' || 
                  m.publication_status === 'published_readers'
                ).length > 1 ? 's' : ''} visible{sortedMarches.filter(m => 
                  m.publication_status === 'published_public' || 
                  m.publication_status === 'published_readers'
                ).length > 1 ? 's' : ''} aux lecteurs
              </span>
            </div>
            
            {/* Actions simplifiées pour les lecteurs */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBatchUpdateStatus(sortedMarches.map(m => m.marche_id), 'published_public')}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Eye className="h-3 w-3 mr-1" />
                Tout cocher pour les lecteurs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBatchUpdateStatus(sortedMarches.map(m => m.marche_id), 'draft')}
                className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Tout décocher pour les lecteurs
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-8 text-sm text-gaspard-secondary font-light">
          <Waves className="h-4 w-4" />
          <span>Orchestrez le parcours de votre exploration multisensorielle</span>
        </div>
        <div className="relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedMarches.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {sortedMarches.map((marche, index) => (
                  <SortableMarcheItem
                    key={marche.id}
                    marche={marche}
                    index={index}
                    totalCount={sortedMarches.length}
                    onRemove={onRemove}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onUpdatePublicationStatus={onUpdatePublicationStatus}
                    isUpdatingStatus={isUpdatingStatus}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default ExplorationMarcheList;