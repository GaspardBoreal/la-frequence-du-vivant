import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFablesMarche, useCreateFable, useUpdateFable } from '@/hooks/useOpus';
import type { FableNarrative, FableVariations } from '@/types/opus';
import { 
  BookOpen, 
  User, 
  Users, 
  Music, 
  Plus, 
  Edit, 
  Eye,
  Save,
  Clock,
  Heart,
  Volume2
} from 'lucide-react';

interface FableWorkshopProps {
  marcheId: string;
  marcheName: string;
  opusId?: string;
}

export const FableWorkshop: React.FC<FableWorkshopProps> = ({
  marcheId,
  marcheName,
  opusId
}) => {
  const { toast } = useToast();
  const { data: fables, isLoading } = useFablesMarche(marcheId);
  const createMutation = useCreateFable();
  const updateMutation = useUpdateFable();
  
  const [editingFable, setEditingFable] = useState<FableNarrative | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<FableNarrative>>({
    titre: '',
    resume: '',
    contenu_principal: '',
    variations: {},
    version: 'V1',
    tags: [],
    statut: 'draft',
    dimensions_associees: [],
    ordre: 1
  });

  const handleCreateNew = () => {
    setFormData({
      titre: '',
      resume: '',
      contenu_principal: '',
      variations: {},
      version: 'V1',
      tags: [],
      statut: 'draft',
      dimensions_associees: [],
      ordre: (fables?.length || 0) + 1
    });
    setIsCreating(true);
  };

  const handleEdit = (fable: FableNarrative) => {
    setFormData(fable);
    setEditingFable(fable);
  };

  const handleSave = async () => {
    try {
      const fableData = {
        ...formData,
        marche_id: marcheId,
        opus_id: opusId
      };

      if (editingFable) {
        await updateMutation.mutateAsync({
          id: editingFable.id,
          ...fableData
        });
        toast({
          title: "Fable mise à jour",
          description: `"${formData.titre}" a été sauvegardée`
        });
      } else {
        await createMutation.mutateAsync(fableData as any);
        toast({
          title: "Nouvelle fable créée",
          description: `"${formData.titre}" a été ajoutée`
        });
      }
      
      setEditingFable(null);
      setIsCreating(false);
      setFormData({});
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la fable",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingFable(null);
    setIsCreating(false);
    setFormData({});
  };

  const updateVariation = (type: 'solo' | 'duo' | 'ensemble', field: string, value: any) => {
    const variations = formData.variations || {};
    setFormData({
      ...formData,
      variations: {
        ...variations,
        [type]: {
          ...(variations[type] || {}),
          [field]: value
        }
      }
    });
  };

  const renderVariationEditor = (type: 'solo' | 'duo' | 'ensemble') => {
    const variation = (formData.variations as FableVariations)?.[type];
    const icons = { solo: User, duo: Users, ensemble: Music };
    const Icon = icons[type];

    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="capitalize">{type}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contenu spécifique</Label>
            <Textarea
              value={variation?.contenu || ''}
              onChange={(e) => updateVariation(type, 'contenu', e.target.value)}
              placeholder={`Version ${type} de la fable...`}
              className="min-h-[120px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={variation?.duree_lecture || ''}
                onChange={(e) => updateVariation(type, 'duree_lecture', parseInt(e.target.value))}
                placeholder="5"
              />
            </div>
            <div>
              <Label>Rythme</Label>
              <Select 
                value={variation?.rythme || ''} 
                onValueChange={(value) => updateVariation(type, 'rythme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lent">Lent</SelectItem>
                  <SelectItem value="modéré">Modéré</SelectItem>
                  <SelectItem value="rapide">Rapide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ambiance sonore</Label>
              <Input
                value={variation?.ambiance_sonore || ''}
                onChange={(e) => updateVariation(type, 'ambiance_sonore', e.target.value)}
                placeholder="Eau qui coule, oiseaux..."
              />
            </div>
            <div>
              <Label>Émotion dominante</Label>
              <Input
                value={variation?.emotion_dominante || ''}
                onChange={(e) => updateVariation(type, 'emotion_dominante', e.target.value)}
                placeholder="Contemplation, mélancolie..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFableCard = (fable: FableNarrative) => (
    <Card key={fable.id} className="group hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{fable.titre}</CardTitle>
            {fable.resume && (
              <p className="text-sm text-muted-foreground mb-3">{fable.resume}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={fable.statut === 'published' ? 'default' : 'secondary'}>
                {fable.statut}
              </Badge>
              <Badge variant="outline">{fable.version}</Badge>
              {fable.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" onClick={() => handleEdit(fable)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground mb-3">
          {fable.contenu_principal.substring(0, 200)}...
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {fable.variations?.solo && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Solo
            </div>
          )}
          {fable.variations?.duo && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Duo
            </div>
          )}
          {fable.variations?.ensemble && (
            <div className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              Ensemble
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderEditor = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {editingFable ? 'Éditer la fable' : 'Nouvelle fable'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{marcheName}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-auto max-h-[80vh]">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <BookOpen className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="solo">
                <User className="h-4 w-4 mr-2" />
                Solo
              </TabsTrigger>
              <TabsTrigger value="duo">
                <Users className="h-4 w-4 mr-2" />
                Duo
              </TabsTrigger>
              <TabsTrigger value="ensemble">
                <Music className="h-4 w-4 mr-2" />
                Ensemble
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titre">Titre de la fable *</Label>
                    <Input
                      id="titre"
                      value={formData.titre || ''}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Le murmure des eaux..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="resume">Résumé</Label>
                    <Textarea
                      id="resume"
                      value={formData.resume || ''}
                      onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                      placeholder="Courte description de la fable..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Version</Label>
                      <Select 
                        value={formData.version || 'V1'} 
                        onValueChange={(value) => setFormData({ ...formData, version: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="V1">V1</SelectItem>
                          <SelectItem value="V2">V2</SelectItem>
                          <SelectItem value="V3">V3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Statut</Label>
                      <Select 
                        value={formData.statut || 'draft'} 
                        onValueChange={(value) => setFormData({ ...formData, statut: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="validated">Validé</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contenu">Contenu principal *</Label>
                  <Textarea
                    id="contenu"
                    value={formData.contenu_principal || ''}
                    onChange={(e) => setFormData({ ...formData, contenu_principal: e.target.value })}
                    placeholder="Il était une fois, au bord de la Dordogne..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="solo">{renderVariationEditor('solo')}</TabsContent>
            <TabsContent value="duo">{renderVariationEditor('duo')}</TabsContent>
            <TabsContent value="ensemble">{renderVariationEditor('ensemble')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atelier des Fables</h1>
          <p className="text-muted-foreground">{marcheName}</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle fable
        </Button>
      </div>

      {(!fables || fables.length === 0) ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune fable pour cette marche</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer la première fable narrative de ce territoire
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Créer la première fable
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fables.map(renderFableCard)}
        </div>
      )}

      {(isCreating || editingFable) && renderEditor()}
    </div>
  );
};