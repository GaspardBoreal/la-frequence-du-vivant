import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Footprints, Waves, Sparkles } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import DecorativeParticles from '@/components/DecorativeParticles';
import { useExplorationById, useExplorationMarches } from '@/hooks/useExplorations';
import {
  useAddMarcheToExploration,
  useRemoveMarcheFromExploration,
  useReorderExplorationMarches,
  useUpdateMarchePublicationStatus,
  useBatchUpdatePublicationStatus
} from '@/hooks/useExplorationMarches';
import ExplorationMarcheList from '@/components/admin/ExplorationMarcheList';
import ExplorationMarcheSelector from '@/components/admin/ExplorationMarcheSelector';
import ExplorationGalleryButtons from '@/components/admin/ExplorationGalleryButtons';

const ExplorationMarchesAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMarches, setSelectedMarches] = useState<string[]>([]);

  const { data: exploration, isLoading: isLoadingExploration } = useExplorationById(id || '');
  const { data: explorationMarches = [], isLoading: isLoadingMarches } = useExplorationMarches(id || '');
  
  const addMarcheMutation = useAddMarcheToExploration();
  const removeMarcheMutation = useRemoveMarcheFromExploration();
  const reorderMutation = useReorderExplorationMarches();
  const updateStatusMutation = useUpdateMarchePublicationStatus();
  const batchUpdateStatusMutation = useBatchUpdatePublicationStatus();

  const handleMarcheToggle = (marcheId: string) => {
    setSelectedMarches(prev => 
      prev.includes(marcheId)
        ? prev.filter(id => id !== marcheId)
        : [...prev, marcheId]
    );
  };

  const handleAddSelected = async () => {
    if (!id || selectedMarches.length === 0) return;

    try {
      // Ajouter les marches sélectionnées avec un ordre séquentiel
      const currentMaxOrder = Math.max(...explorationMarches.map(em => em.ordre || 0), 0);
      
      const promises = selectedMarches.map((marcheId, index) =>
        addMarcheMutation.mutateAsync({
          explorationId: id,
          marcheId,
          ordre: currentMaxOrder + index + 1
        })
      );

      await Promise.all(promises);
      setSelectedMarches([]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout des marches:', error);
    }
  };

  const handleRemoveMarche = (marcheId: string) => {
    if (!id) return;
    
    removeMarcheMutation.mutate({
      explorationId: id,
      marcheId
    });
  };

  const handleReorderMarches = (marcheOrders: { marcheId: string; ordre: number }[]) => {
    if (!id) return;
    
    reorderMutation.mutate({
      explorationId: id,
      marcheOrders
    });
  };

  const handleUpdatePublicationStatus = (marcheId: string, status: 'published_public' | 'published_readers' | 'draft') => {
    if (!id) return;
    
    updateStatusMutation.mutate({
      explorationId: id,
      marcheId,
      publicationStatus: status
    });
  };

  const handleBatchUpdateStatus = (marcheIds: string[], status: 'published_public' | 'published_readers' | 'draft') => {
    if (!id) return;
    
    batchUpdateStatusMutation.mutate({
      explorationId: id,
      marcheIds,
      publicationStatus: status
    });
  };

  if (isLoadingExploration || isLoadingMarches) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-primary/5 via-transparent to-gaspard-accent/10"></div>
        <DecorativeParticles />
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3">
              <div className="w-2 h-2 bg-gaspard-primary rounded-full animate-gentle-float"></div>
              <div className="w-2 h-2 bg-gaspard-secondary rounded-full animate-gentle-float animation-delay-300"></div>
              <div className="w-2 h-2 bg-gaspard-accent rounded-full animate-gentle-float animation-delay-600"></div>
            </div>
            <p className="text-gaspard-muted mt-4 font-light">
              Révélation de l'univers narratif...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-primary/5 via-transparent to-gaspard-accent/10"></div>
        <DecorativeParticles />
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-gaspard-accent/40 mx-auto mb-6 animate-soft-pulse" />
            <h3 className="gaspard-main-title text-xl font-semibold text-gaspard-primary mb-4">
              Exploration introuvable
            </h3>
            <p className="text-gaspard-muted mb-8 font-light leading-relaxed">
              Cette essence narrative semble avoir disparu dans les méandres du temps
            </p>
            <Button 
              onClick={() => navigate('/admin/explorations')}
              className="bg-gradient-to-r from-gaspard-primary to-gaspard-secondary hover:from-gaspard-primary/90 hover:to-gaspard-secondary/90 text-white rounded-2xl px-8 py-3 shadow-lg shadow-gaspard-primary/20 hover:shadow-xl hover:shadow-gaspard-primary/30 transition-all duration-300 hover:scale-105 border-0"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Retour à l'Atelier
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Orchestre de Marches - ${exploration.name} - La Fréquence du Vivant`}
        description={`Atelier sensible pour tisser les étapes de l'exploration "${exploration.name}"`}
        keywords="marches, exploration, techno-sensible, narratif, composition"
      />
      
      {/* Univers immersif principal */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Arrière-plan composé avec dégradés organiques */}
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-primary/5 via-transparent to-gaspard-accent/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--gaspard-secondary-rgb)/0.1,transparent_70%)]"></div>
        
        {/* Particules décoratives */}
        <DecorativeParticles />
        
        {/* Contenu principal */}
        <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
          
          {/* Navigation poétique */}
          <div className="mb-8 animate-fade-in">
            <Button 
              variant="ghost"
              onClick={() => navigate('/admin/explorations')}
              className="mb-6 text-gaspard-muted hover:text-gaspard-primary hover:bg-gaspard-primary/10 rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 group"
            >
              <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
              Retour à l'Atelier de Création
            </Button>
          </div>

          {/* En-tête poétique */}
          <header className="text-center mb-16 animate-fade-in">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Footprints className="h-8 w-8 text-gaspard-accent animate-soft-pulse" />
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gaspard-primary to-transparent rounded-full"></div>
              <Waves className="h-6 w-6 text-gaspard-secondary animate-gentle-float" />
            </div>
            
            <h1 className="gaspard-main-title text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gaspard-primary via-gaspard-secondary to-gaspard-accent bg-clip-text text-transparent">
              Orchestre de Marches
            </h1>
            
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-gaspard-primary mb-3">
                {exploration.name}
              </h2>
              
              {exploration.description && (
                <div className="gaspard-category text-lg text-gaspard-muted leading-relaxed font-light prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: exploration.description }}>
                </div>
              )}
            </div>
            
            {/* Ligne décorative animée */}
            <div className="mt-8 w-24 h-0.5 bg-gradient-to-r from-gaspard-primary to-gaspard-accent mx-auto rounded-full opacity-60"></div>
          </header>

          {/* Composition des séquences */}
          <div className="space-y-12 animate-fade-in animation-delay-300">
            {/* Liste des marches assignées */}
            <ExplorationMarcheList
              explorationMarches={explorationMarches}
              onReorder={handleReorderMarches}
              onRemove={handleRemoveMarche}
              onUpdatePublicationStatus={handleUpdatePublicationStatus}
              onBatchUpdateStatus={handleBatchUpdateStatus}
            />

            {/* Sélecteur de nouvelles marches */}
            <ExplorationMarcheSelector
              explorationId={id || ''}
              selectedMarches={selectedMarches}
              onMarcheToggle={handleMarcheToggle}
              onAddSelected={handleAddSelected}
            />

            {/* Boutons d'accès aux galeries publiques */}
            <ExplorationGalleryButtons explorationSlug={exploration.slug} />
          </div>
        </div>

        {/* Texture de fond subtile */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
      </div>
    </>
  );
};

export default ExplorationMarchesAdmin;