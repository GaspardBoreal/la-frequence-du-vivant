import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeft, Search, Plus, List, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseMarches } from '../../../hooks/useSupabaseMarches';
import MarcheListMobile from './MarcheListMobile';
import MarcheFormMobile from './MarcheFormMobile';
import MarcheFiltersMobile from './MarcheFiltersMobile';
import { toast } from 'sonner';
import { MarcheTechnoSensible } from '../../../utils/googleSheetsApi';

type MobileViewMode = 'home' | 'filters' | 'list' | 'create' | 'edit';

const MarcheAdminMobile = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<MobileViewMode>('home');
  const [editingMarcheId, setEditingMarcheId] = useState<string | null>(null);
  const [filteredMarches, setFilteredMarches] = useState<MarcheTechnoSensible[]>([]);

  const { data: marches = [], isLoading, error, refetch } = useSupabaseMarches();

  useEffect(() => {
    if (marches && marches.length > 0) {
      setFilteredMarches(marches);
    }
  }, [marches]);

  const handleBack = () => {
    navigate('/access-admin-gb2025');
  };

  const handleReturnHome = () => {
    setViewMode('home');
    setEditingMarcheId(null);
  };

  const handleEdit = (marcheId: string) => {
    setEditingMarcheId(marcheId);
    setViewMode('edit');
  };

  const handleSuccess = () => {
    toast.success('Marche sauvegardée avec succès !');
    setViewMode('list');
    setEditingMarcheId(null);
    refetch();
  };

  const handleFilterChange = (filtered: MarcheTechnoSensible[]) => {
    setFilteredMarches(filtered);
  };

  const handleDelete = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-foreground">
          <h2 className="text-xl font-bold mb-4">Erreur de chargement</h2>
          <p className="mb-4 text-sm">Impossible de charger les marches.</p>
          <Button onClick={handleBack} variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Écran d'accueil mobile
  if (viewMode === 'home') {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="mb-4 w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
            
            <h1 className="text-2xl font-bold text-foreground text-center">
              Admin Marches
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {marches.length} marche{marches.length > 1 ? 's' : ''} disponible{marches.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions principales */}
          <div className="space-y-4">
            <Button 
              onClick={() => setViewMode('filters')} 
              className="w-full h-14 text-lg"
              variant="outline"
            >
              <Search className="h-5 w-5 mr-3" />
              Filtrer les marches
            </Button>

            <Button 
              onClick={() => setViewMode('list')} 
              className="w-full h-14 text-lg"
              variant="outline"
            >
              <List className="h-5 w-5 mr-3" />
              Voir toutes les marches
            </Button>

            <Button 
              onClick={() => setViewMode('create')} 
              className="w-full h-14 text-lg"
            >
              <Plus className="h-5 w-5 mr-3" />
              Créer une nouvelle marche
            </Button>
          </div>

          {/* Lien vers la version complète */}
          <div className="mt-8 pt-6 border-t border-border">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/admin/marches?force-desktop=1'}
              className="w-full text-sm text-muted-foreground"
            >
              <Eye className="h-4 w-4 mr-2" />
              Accéder à la version complète
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Écran de filtres
  if (viewMode === 'filters') {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={handleReturnHome}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Filtrer les marches</h1>
          </div>

          <MarcheFiltersMobile 
            marches={marches}
            onFilterChange={handleFilterChange}
            onViewResults={() => setViewMode('list')}
            resultsCount={filteredMarches.length}
          />
        </div>
      </div>
    );
  }

  // Écran de liste
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={handleReturnHome}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Liste des marches</h1>
              <p className="text-sm text-muted-foreground">
                {filteredMarches.length} résultat{filteredMarches.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button 
              onClick={() => setViewMode('create')}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <p className="mt-2 text-sm">Chargement...</p>
            </div>
          ) : (
            <MarcheListMobile
              marches={filteredMarches}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    );
  }

  // Écran de création/édition
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={handleReturnHome}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">
              {viewMode === 'edit' ? 'Modifier' : 'Créer'} une marche
            </h1>
          </div>

          <MarcheFormMobile
            mode={viewMode === 'edit' ? 'edit' : 'create'}
            marcheId={editingMarcheId}
            onCancel={handleReturnHome}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default MarcheAdminMobile;