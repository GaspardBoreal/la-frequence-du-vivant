import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/slugGenerator';
import { useQueryClient } from '@tanstack/react-query';
import { useExplorationById } from '@/hooks/useExplorations';

interface ExplorationFormData {
  name: string;
  slug: string;
  description: string;
  cover_image_url: string;
  language: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  published: boolean;
}

interface ExplorationFormProps {
  explorationId?: string;
  initialData?: Partial<ExplorationFormData>;
  onSuccess?: () => void;
}

const ExplorationForm: React.FC<ExplorationFormProps> = ({
  explorationId,
  initialData,
  onSuccess
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  
  // Récupérer l'exploration si on a un ID
  const { data: existingExploration, isLoading: isLoadingExploration } = useExplorationById(explorationId || '');
  
  const [formData, setFormData] = useState<ExplorationFormData>({
    name: '',
    slug: '',
    description: '',
    cover_image_url: '',
    language: 'fr',
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    published: false
  });

  // Mettre à jour les données du formulaire quand l'exploration est chargée
  useEffect(() => {
    if (existingExploration) {
      setFormData({
        name: existingExploration.name,
        slug: existingExploration.slug,
        description: existingExploration.description || '',
        cover_image_url: existingExploration.cover_image_url || '',
        language: existingExploration.language,
        meta_title: existingExploration.meta_title || '',
        meta_description: existingExploration.meta_description || '',
        meta_keywords: existingExploration.meta_keywords || [],
        published: existingExploration.published
      });
    } else if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        cover_image_url: initialData.cover_image_url || '',
        language: initialData.language || 'fr',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        meta_keywords: initialData.meta_keywords || [],
        published: initialData.published || false
      });
    }
  }, [existingExploration, initialData]);

  const handleInputChange = (field: keyof ExplorationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate slug from name
    if (field === 'name' && !explorationId) {
      const slug = createSlug(value, '');
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.meta_keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        meta_keywords: [...prev.meta_keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      meta_keywords: prev.meta_keywords.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom de l\'exploration est requis');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Le slug est requis');
      return;
    }

    setIsLoading(true);

    try {
      const explorationData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        cover_image_url: formData.cover_image_url.trim() || null,
        language: formData.language,
        meta_title: formData.meta_title.trim() || null,
        meta_description: formData.meta_description.trim() || null,
        meta_keywords: formData.meta_keywords,
        published: formData.published
      };

      if (explorationId) {
        // Mise à jour
        const { error } = await supabase
          .from('explorations')
          .update(explorationData)
          .eq('id', explorationId);

        if (error) throw error;
        toast.success('Exploration mise à jour avec succès');
      } else {
        // Création
        const { error } = await supabase
          .from('explorations')
          .insert(explorationData);

        if (error) throw error;
        toast.success('Exploration créée avec succès');
      }

      // Invalider tous les caches liés à cette exploration
      queryClient.invalidateQueries({ queryKey: ['admin-explorations'] });
      queryClient.invalidateQueries({ queryKey: ['explorations'] });
      
      if (explorationId) {
        queryClient.invalidateQueries({ queryKey: ['exploration-by-id', explorationId] });
      }
      
      if (formData.slug) {
        queryClient.invalidateQueries({ queryKey: ['exploration', formData.slug] });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin/explorations');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <Button 
          onClick={() => navigate('/admin/explorations')}
          className="flex items-center gap-2 mb-6 bg-gaspard-gold/40 text-white border-gaspard-gold/50 hover:bg-gaspard-gold/60 hover:text-white font-medium shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux explorations
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in animation-delay-300">
        <Card className="gaspard-glass border-gaspard-cream/40 bg-white/15 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="gaspard-main-title text-white text-xl font-bold">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white font-medium">Nom de l'exploration *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Exploration des marches urbaines"
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-white font-medium">Slug URL *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="exploration-marches-urbaines"
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
                required
              />
              {formData.slug && formData.published && (
                <div className="mt-2">
                  <a
                    href={`${window.location.origin}/explorations/${formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gaspard-gold hover:text-gaspard-gold/80 transition-colors duration-200 group"
                  >
                    <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="underline decoration-gaspard-gold/50 group-hover:decoration-gaspard-gold font-medium">
                      {window.location.origin}/explorations/{formData.slug}
                    </span>
                  </a>
                </div>
              )}
              {!formData.published && (
                <p className="text-sm text-white/80 mt-1 font-medium">
                  URL: /explorations/{formData.slug} (sera disponible après publication)
                </p>
              )}
              {!formData.slug && (
                <p className="text-sm text-white/80 mt-1 font-medium">
                  URL: /explorations/[slug-auto-généré]
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-white font-medium">Description</Label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Description de l'exploration..."
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cover_image" className="text-white font-medium">URL de l'image de couverture</Label>
              <Input
                id="cover_image"
                value={formData.cover_image_url}
                onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => handleInputChange('published', checked)}
              />
              <Label htmlFor="published" className="text-white font-medium">Publier l'exploration</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="gaspard-glass border-gaspard-cream/40 bg-white/15 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="gaspard-main-title text-white text-xl font-bold">SEO et métadonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta_title" className="text-white font-medium">Titre SEO</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => handleInputChange('meta_title', e.target.value)}
                placeholder="Titre optimisé pour les moteurs de recherche"
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
                maxLength={60}
              />
              <p className="text-sm text-white/90 mt-1 font-medium">
                {formData.meta_title.length}/60 caractères
              </p>
            </div>

            <div>
              <Label htmlFor="meta_description" className="text-white font-medium">Description SEO</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                placeholder="Description pour les moteurs de recherche"
                className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
                rows={3}
                maxLength={160}
              />
              <p className="text-sm text-white/90 mt-1 font-medium">
                {formData.meta_description.length}/160 caractères
              </p>
            </div>

            <div>
              <Label className="text-white font-medium">Mots-clés SEO</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Ajouter un mot-clé"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} className="bg-gaspard-gold/40 text-white border-gaspard-gold/50 hover:bg-gaspard-gold/60 font-medium">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.meta_keywords.map((keyword, index) => (
                  <Badge key={index} className="bg-gaspard-gold/40 text-white border-gaspard-gold/50 flex items-center gap-1 font-medium">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-red-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 animate-fade-in animation-delay-600">
          <Button 
            type="button" 
            onClick={() => navigate('/admin/explorations')}
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 font-medium shadow-lg"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-gaspard-gold/50 hover:bg-gaspard-gold/70 text-white border-gaspard-gold/60 font-medium shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Enregistrement...' : (explorationId ? 'Mettre à jour' : 'Créer l\'exploration')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExplorationForm;