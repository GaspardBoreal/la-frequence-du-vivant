import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import {
  useAddMarcheToExploration,
  useRemoveMarcheFromExploration,
  useReorderExplorationMarches
} from '@/hooks/useExplorationMarches';
import ExplorationMarcheList from '@/components/admin/ExplorationMarcheList';
import ExplorationMarcheSelector from '@/components/admin/ExplorationMarcheSelector';

const ExplorationMarchesAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMarches, setSelectedMarches] = useState<string[]>([]);

  const { data: exploration, isLoading: isLoadingExploration } = useExploration(id || '');
  const { data: explorationMarches = [], isLoading: isLoadingMarches } = useExplorationMarches(id || '');
  
  const addMarcheMutation = useAddMarcheToExploration();
  const removeMarcheMutation = useRemoveMarcheFromExploration();
  const reorderMutation = useReorderExplorationMarches();

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

  if (isLoadingExploration || isLoadingMarches) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <p className="text-sage-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sage-600 mb-4">Exploration non trouvée</p>
              <Button onClick={() => navigate('/admin/explorations')}>
                Retour aux explorations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Gestion des marches - ${exploration.name} - Admin`}
        description={`Interface d'administration pour gérer les marches de l'exploration "${exploration.name}"`}
        keywords="admin, exploration, marches, gestion"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/explorations')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux explorations
              </Button>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-sage-600" />
              <div>
                <h1 className="text-3xl font-bold text-sage-800">
                  Gestion des marches
                </h1>
                <p className="text-sage-600">
                  {exploration.name}
                </p>
              </div>
            </div>
            
            {exploration.description && (
              <p className="text-sage-600 mt-2">
                {exploration.description}
              </p>
            )}
          </div>

          <div className="grid gap-8">
            {/* Liste des marches assignées */}
            <ExplorationMarcheList
              explorationMarches={explorationMarches}
              onReorder={handleReorderMarches}
              onRemove={handleRemoveMarche}
            />

            {/* Sélecteur de nouvelles marches */}
            <ExplorationMarcheSelector
              explorationId={id || ''}
              selectedMarches={selectedMarches}
              onMarcheToggle={handleMarcheToggle}
              onAddSelected={handleAddSelected}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ExplorationMarchesAdmin;