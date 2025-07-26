
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import MarcheForm from '../components/admin/MarcheForm';
import MarcheList from '../components/admin/MarcheList';

type ViewMode = 'list' | 'create' | 'edit';

const MarcheAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { data: marches, isLoading } = useSupabaseMarches();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMarcheId, setSelectedMarcheId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedMarcheId(null);
    setViewMode('create');
  };

  const handleEdit = (marcheId: string) => {
    setSelectedMarcheId(marcheId);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedMarcheId(null);
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedMarcheId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center">
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

        {/* Navigation breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <span>Administration</span>
          <span className="mx-2">→</span>
          {viewMode === 'list' && <span>Liste des marches</span>}
          {viewMode === 'create' && <span>Créer une marche</span>}
          {viewMode === 'edit' && <span>Modifier une marche</span>}
        </div>

        <Card className="p-6">
          {/* Content based on view mode */}
          {viewMode === 'list' && (
            <MarcheList 
              marches={marches || []}
              isLoading={isLoading}
              onEdit={handleEdit}
            />
          )}

          {(viewMode === 'create' || viewMode === 'edit') && (
            <MarcheForm
              mode={viewMode}
              marcheId={selectedMarcheId}
              onCancel={handleBackToList}
              onSuccess={handleSuccess}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default MarcheAdmin;
