import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Edit3, Upload, Play, Pause, Volume2 } from 'lucide-react';
import { PageAudioUpload } from '@/components/admin/PageAudioUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ExplorationPage {
  id: string;
  exploration_id: string;
  type: string;
  ordre: number;
  nom: string;
  description?: string;
  config: any;
}

interface Props {
  explorationId: string;
}

const PAGE_TYPES = [
  { value: 'intro-accueil', label: 'Page d\'accueil', description: 'Page de présentation générale de l\'exploration' },
  { value: 'intro-auteur', label: 'Page auteur', description: 'Page où l\'auteur écrit un texte narratif pour introduire l\'exploration' },
  { value: 'marches', label: 'Page marches', description: 'Utiliser le modèle ci-dessous' },
  { value: 'fin-feedback', label: 'Page Feedback', description: 'Inciter convaincre les lecteurs de faire des feed back sur l\'app et les contenus (poèmes, haïku, photo, sons …)' },
  { value: 'fin-precommande', label: 'Page pré commande', description: 'Inciter convaincre les lecteurs à acheter l\'ouvrage en pré commandes' },
];

function SortablePageItem({ page, onEdit, onDelete }: { page: ExplorationPage; onEdit: (page: ExplorationPage) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pageType = PAGE_TYPES.find(t => t.value === page.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-4 flex items-center gap-4"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
            Ordre {page.ordre}
          </span>
          <span className="text-sm font-medium">{page.nom}</span>
        </div>
        <p className="text-sm text-muted-foreground">{page.description || pageType?.description}</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(page)}>
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(page.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SpecificPagesManager({ explorationId }: Props) {
  const [pages, setPages] = useState<ExplorationPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<ExplorationPage | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [formType, setFormType] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');

  const getPlaceholderForType = (type: string) => {
    switch (type) {
      case 'intro-accueil':
        return "Rédigez ici le texte narratif d'introduction qui apparaîtra sous le titre de l'exploration...";
      case 'intro-auteur':
        return "Rédigez ici le texte narratif de présentation de l'auteur...";
      case 'fin-feedback':
        return "Rédigez ici le texte d'incitation au feedback...";
      case 'fin-precommande':
        return "Rédigez ici le texte d'incitation à la précommande...";
      default:
        return "Rédigez ici le contenu narratif de cette page...";
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadPages = async () => {
    if (!explorationId) return;
    setLoading(true);
    
    try {
      const { data, error } = await (supabase as any).rpc('get_exploration_pages', {
        exploration_id_param: explorationId
      });
      
      if (error) throw error;
      setPages((data || []) as ExplorationPage[]);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Erreur lors du chargement des pages');
      setPages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPages();
  }, [explorationId]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex(p => p.id === active.id);
    const newIndex = pages.findIndex(p => p.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally first
    const newPages = [...pages];
    const [movedPage] = newPages.splice(oldIndex, 1);
    newPages.splice(newIndex, 0, movedPage);
    
    // Update ordre values
    const updatedPages = newPages.map((page, index) => ({
      ...page,
      ordre: index + 1
    }));
    
    setPages(updatedPages);
    
    // Save new order to database
    try {
      await (supabase as any).rpc('update_pages_order', {
        page_ids: updatedPages.map(p => p.id),
        new_orders: updatedPages.map(p => p.ordre)
      });
      toast.success('Ordre des pages mis à jour');
    } catch (error) {
      console.error('Error updating page order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
      loadPages(); // Reload on error
    }
  };

  const handleAdd = () => {
    setEditingPage(null);
    setFormType('');
    setFormNom('');
    setFormDescription('');
    setFormAudioUrl('');
    setShowForm(true);
  };

  const handleEdit = (page: ExplorationPage) => {
    setEditingPage(page);
    setFormType(page.type);
    setFormNom(page.nom);
    setFormDescription(page.description || '');
    setFormAudioUrl(page.config?.audioUrl || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formType || !formNom.trim()) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    console.log('🔧 Saving page:', { 
      editingPage: editingPage?.id, 
      formType, 
      formNom: formNom.trim(), 
      formDescription: formDescription.trim() 
    });

    const pageType = PAGE_TYPES.find(t => t.value === formType);
    const nextOrdre = editingPage ? editingPage.ordre : Math.max(0, ...pages.map(p => p.ordre)) + 1;

    // Prepare config with audio URL
    const config = formAudioUrl ? { audioUrl: formAudioUrl } : {};

    try {
      let result;
      if (editingPage) {
        console.log('🔧 Updating existing page with ID:', editingPage.id);
        result = await (supabase as any).rpc('update_exploration_page', {
          page_id: editingPage.id,
          page_type: formType,
          page_nom: formNom.trim(),
          page_description: formDescription.trim() || pageType?.description || '',
          page_config: config
        });
        console.log('🔧 Update result:', result);
        
        if (result.error) {
          throw result.error;
        }
        
        toast.success('Page mise à jour avec succès');
      } else {
        console.log('🔧 Creating new page');
        result = await (supabase as any).rpc('insert_exploration_page', {
          exploration_id_param: explorationId,
          page_type: formType,
          page_ordre: nextOrdre,
          page_nom: formNom.trim(),
          page_description: formDescription.trim() || pageType?.description || '',
          page_config: config
        });
        console.log('🔧 Insert result:', result);
        
        if (result.error) {
          throw result.error;
        }
        
        toast.success('Page ajoutée avec succès');
      }
      
      console.log('🔧 Reloading pages after successful save...');
      await loadPages(); // Force reload to get fresh data
      setShowForm(false);
      console.log('🔧 Save operation completed successfully');
      
    } catch (error) {
      console.error('❌ Error saving page:', error);
      toast.error(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;

    try {
      await (supabase as any).rpc('delete_exploration_page', {
        page_id: pageId
      });
      
      setPages(pages.filter(p => p.id !== pageId));
      toast.success('Page supprimée');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Chargement des pages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">P1 · Pages spécifiques</h2>
          <p className="text-sm text-foreground/70 mt-1">
            Gérez la séquence de pages de votre exploration. Glissez-déposez pour réorganiser.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune page configurée. Commencez par ajouter une page d'accueil.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {pages.map(page => (
                <SortablePageItem 
                  key={page.id} 
                  page={page} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Form Modal */}
      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{editingPage ? 'Modifier la page' : 'Ajouter une page'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="page-type">Type de page *</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="page-nom">Nom de la page *</Label>
              <Input
                id="page-nom"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Ex: Page d'accueil"
              />
            </div>

            <div>
              <Label htmlFor="page-description">
                Texte narratif de la page
              </Label>
              <RichTextEditor
                value={formDescription}
                onChange={setFormDescription}
                placeholder={getPlaceholderForType(formType)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Narration audio</Label>
              <div className="mt-2">
                <PageAudioUpload
                  pageId={editingPage?.id}
                  currentAudioUrl={formAudioUrl}
                  onAudioUploaded={(audioUrl) => {
                    setFormAudioUrl(audioUrl);
                  }}
                  onAudioDeleted={() => {
                    setFormAudioUrl('');
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>
                {editingPage ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}