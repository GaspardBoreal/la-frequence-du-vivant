
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import MarcheList from '../components/admin/MarcheList';
import MarcheForm from '../components/admin/MarcheForm';
import AdminFilters from '../components/admin/AdminFilters';
import { toast } from 'sonner';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';

type ViewMode = 'list' | 'create' | 'edit';

const MarcheAdmin = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingMarcheId, setEditingMarcheId] = useState<string | null>(null);
  const [filteredMarches, setFilteredMarches] = useState<MarcheTechnoSensible[]>([]);

  const { data: marches = [], isLoading, error, refetch } = useSupabaseMarches();

  useEffect(() => {
    if (marches && marches.length > 0) {
      setFilteredMarches(marches);
    }
  }, [marches]);

  const handleBack = () => {
    navigate('/');
  };

  const handleCreate = () => {
    setViewMode('create');
    setEditingMarcheId(null);
  };

  const handleEdit = (marcheId: string) => {
    setEditingMarcheId(marcheId);
    setViewMode('edit');
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingMarcheId(null);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <h2 className="text-2xl font-bold mb-4">Erreur de chargement</h2>
          <p className="mb-4">Impossible de charger les marches depuis Supabase.</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={handleBack} variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground text-center flex-1">
            Administration des Marches
          </h1>
          
          <div className="flex justify-end">
            {viewMode === 'list' && (
              <Button onClick={handleCreate} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Marche
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Administration</span>
            <span>→</span>
            {viewMode === 'list' && <span>Liste des marches ({filteredMarches.length} résultat{filteredMarches.length > 1 ? 's' : ''})</span>}
            {viewMode === 'create' && <span>Nouvelle marche</span>}
            {viewMode === 'edit' && <span>Modification de marche</span>}
          </div>
        </div>

        {/* Filtres - uniquement en mode liste */}
        {viewMode === 'list' && !isLoading && marches.length > 0 && (
          <AdminFilters
            marches={marches}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Content */}
        <div className="gaspard-card rounded-xl p-6">
          {viewMode === 'list' && (
            <>
              {isLoading ? (
                <div className="text-center text-foreground py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  <p className="mt-2">Chargement des marches...</p>
                </div>
              ) : (
                <MarcheList
                  marches={filteredMarches}
                  isLoading={false}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </>
          )}

          {(viewMode === 'create' || viewMode === 'edit') && (
            <MarcheForm
              mode={viewMode}
              marcheId={editingMarcheId}
              onCancel={handleCancel}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MarcheAdmin;
