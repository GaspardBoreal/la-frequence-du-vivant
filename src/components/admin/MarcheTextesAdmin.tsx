// Admin interface for managing literary texts of a marche
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SecureRichTextEditor } from '@/components/ui/secure-rich-text-editor';
import {
  useMarcheTextes,
  useCreateMarcheTexte,
  useUpdateMarcheTexte,
  useDeleteMarcheTexte,
  useReorderMarcheTextes,
  MarcheTexte,
  MarcheTexteInput,
} from '@/hooks/useMarcheTextes';
import {
  TEXT_TYPES_REGISTRY,
  TextType,
  getTextTypeInfo,
  getTextTypesByFamily,
} from '@/types/textTypes';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MarcheTextesAdminProps {
  marcheId: string;
  marcheName?: string;
}

interface TexteFormData {
  titre: string;
  contenu: string;
  type_texte: TextType;
  metadata: Record<string, any>;
}

// Sortable text card component
function SortableTexteCard({ texte, onEdit, onDelete, onPreview }: {
  texte: MarcheTexte;
  onEdit: (texte: MarcheTexte) => void;
  onDelete: (id: string) => void;
  onPreview: (texte: MarcheTexte) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: texte.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo = getTextTypeInfo(texte.type_texte);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-4 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab hover:cursor-grabbing text-muted-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {typeInfo.icon} {typeInfo.label}
            </Badge>
            <span className="text-sm font-medium">{texte.titre}</span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {texte.contenu}
          </p>
          
          {texte.metadata && Object.keys(texte.metadata).length > 0 && (
            <div className="text-xs text-muted-foreground">
              Métadonnées: {Object.keys(texte.metadata).join(', ')}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPreview(texte)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(texte)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(texte.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Text form dialog
function TexteFormDialog({ 
  isOpen, 
  onClose, 
  texte, 
  marcheId 
}: {
  isOpen: boolean;
  onClose: () => void;
  texte?: MarcheTexte;
  marcheId: string;
}) {
  const [formData, setFormData] = useState<TexteFormData>({
    titre: texte?.titre || '',
    contenu: texte?.contenu || '',
    type_texte: texte?.type_texte || 'poeme',
    metadata: texte?.metadata || {},
  });

  // Sync form when opening or when texte changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        titre: texte?.titre || '',
        contenu: texte?.contenu || '',
        type_texte: (texte?.type_texte as TextType) || 'poeme',
        metadata: texte?.metadata || {},
      });
    }
  }, [isOpen, texte]);

  const createMutation = useCreateMarcheTexte();
  const updateMutation = useUpdateMarcheTexte();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (texte) {
      await updateMutation.mutateAsync({
        id: texte.id,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync({
        marche_id: marcheId,
        ...formData,
      });
    }
    
    onClose();
  };

  const selectedTypeInfo = getTextTypeInfo(formData.type_texte);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" key={texte?.id || 'new'}>
        <DialogHeader>
          <DialogTitle>
            {texte ? 'Modifier le texte' : 'Nouveau texte'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                placeholder="Titre du texte..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type de texte</Label>
              <Select 
                value={formData.type_texte} 
                onValueChange={(value: TextType) => setFormData(prev => ({ ...prev, type_texte: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTextTypesByFamily('poetique').map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                  <Separator />
                  {getTextTypesByFamily('narrative').map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                  <Separator />
                  {getTextTypesByFamily('terrain').map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                  <Separator />
                  {getTextTypesByFamily('hybride').map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTypeInfo && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{selectedTypeInfo.label}:</strong> {selectedTypeInfo.description}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="contenu">Contenu</Label>
            <SecureRichTextEditor
              value={formData.contenu}
              onChange={(value) => setFormData(prev => ({ ...prev, contenu: value }))}
              placeholder="Écrivez votre texte ici..."
              className="min-h-[300px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {texte ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Preview dialog
function TextePreviewDialog({ 
  texte, 
  isOpen, 
  onClose 
}: {
  texte?: MarcheTexte;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!texte) return null;

  const typeInfo = getTextTypeInfo(texte.type_texte);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary">
              {typeInfo.icon} {typeInfo.label}
            </Badge>
            {texte.titre}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div 
            className={`prose prose-sm max-w-none ${typeInfo.adaptiveStyle.fontFamily === 'serif' ? 'font-serif' : 
              typeInfo.adaptiveStyle.fontFamily === 'monospace' ? 'font-mono' : 'font-sans'
            }`}
          >
            <div className="whitespace-pre-wrap">{texte.contenu}</div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function MarcheTextesAdmin({ marcheId, marcheName }: MarcheTextesAdminProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTexte, setEditingTexte] = useState<MarcheTexte | undefined>();
  const [previewTexte, setPreviewTexte] = useState<MarcheTexte | undefined>();

  const { data: textes = [], isLoading } = useMarcheTextes(marcheId);
  const deleteMutation = useDeleteMarcheTexte();
  const reorderMutation = useReorderMarcheTextes();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = textes.findIndex(t => t.id === active.id);
      const newIndex = textes.findIndex(t => t.id === over.id);
      
      const newOrder = arrayMove(textes, oldIndex, newIndex);
      const textIds = newOrder.map(t => t.id);
      
      reorderMutation.mutate({ marcheId, textIds });
    }
  };

  const handleEdit = (texte: MarcheTexte) => {
    setEditingTexte(texte);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce texte ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePreview = (texte: MarcheTexte) => {
    setPreviewTexte(texte);
    setIsPreviewOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTexte(undefined);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTexte(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Chargement des textes...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Textes littéraires
            </CardTitle>
            {marcheName && (
              <p className="text-sm text-muted-foreground mt-1">
                {marcheName} • {textes.length} texte{textes.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau texte
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {textes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucun texte littéraire pour cette marche.</p>
            <p className="text-sm">Cliquez sur "Nouveau texte" pour commencer.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={textes.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {textes.map((texte) => (
                  <SortableTexteCard
                    key={texte.id}
                    texte={texte}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <TexteFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        texte={editingTexte}
        marcheId={marcheId}
      />

      <TextePreviewDialog
        texte={previewTexte}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </Card>
  );
}