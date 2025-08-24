
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import MarcheList from '../components/admin/MarcheList';
import MarcheForm from '../components/admin/MarcheForm';
import DataCollectionPanel from '../components/admin/DataCollectionPanel';
import AdminFilters from '../components/admin/AdminFilters';
import DataInsightsPromoBanner from '../components/DataInsightsPromoBanner';
import PhotoGalleryAdmin from '../components/admin/PhotoGalleryAdmin';
import MarcheTextesAdmin from '../components/admin/MarcheTextesAdmin';
import TextesLitterairesGalleryAdmin from '../components/admin/TextesLitterairesGalleryAdmin';
import { toast } from 'sonner';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';

type ViewMode = 'list' | 'create' | 'edit';

const MarcheAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
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
    navigate('/access-admin-gb2025');
  };

  const handleCreate = () => {
    setViewMode('create');
    setEditingMarcheId(null);
  };

  const handleEdit = (marcheId: string) => {
    setEditingMarcheId(marcheId);
    setViewMode('edit');
    setActiveTab('create'); // Switch to create tab for editing
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
            {/* Removed "Nouvelle Marche" button as requested */}
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

        {/* Data Insights Promotional Banner */}
        {viewMode === 'list' && !isLoading && marches.length > 0 && (
          <DataInsightsPromoBanner />
        )}

        {/* Filtres - uniquement en mode liste */}
        {viewMode === 'list' && !isLoading && marches.length > 0 && (
          <AdminFilters
            marches={marches}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Content */}
        <div className="gaspard-card rounded-xl p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="list">Liste des Marches</TabsTrigger>
              <TabsTrigger value="create">
                {viewMode === 'edit' ? 'Modifier une Marche' : 'Créer une Marche'}
              </TabsTrigger>
              <TabsTrigger value="texts">
                Textes Littéraires
              </TabsTrigger>
              <TabsTrigger value="gallery">
                Galerie Photos
              </TabsTrigger>
              <TabsTrigger value="data" className="relative">
                Collecte de Données
                <Sparkles className="w-3 h-3 ml-1 text-accent animate-pulse" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
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
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4">
              <MarcheForm
                mode={viewMode === 'edit' ? 'edit' : 'create'}
                marcheId={editingMarcheId}
                onCancel={() => {
                  setActiveTab('list');
                  handleCancel();
                }}
                onSuccess={() => {
                  handleSuccess();
                  setActiveTab('list');
                }}
              />
            </TabsContent>

            <TabsContent value="texts" className="space-y-4">
              <TextesLitterairesGalleryAdmin marches={filteredMarches} />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4">
              <PhotoGalleryAdmin marches={filteredMarches} />
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <DataCollectionPanel marches={filteredMarches} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MarcheAdmin;
