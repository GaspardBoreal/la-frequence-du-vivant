import React from 'react';
import { useParams } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import ExplorationForm from '@/components/admin/ExplorationForm';

const ExplorationFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  return (
    <>
      <SEOHead 
        title={`${isEdit ? 'Modifier' : 'Créer'} une exploration - Admin`}
        description={`Interface d'administration pour ${isEdit ? 'modifier' : 'créer'} une exploration thématique`}
        keywords="admin, exploration, création, édition"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-8">
        <div className="container mx-auto px-4">
          <ExplorationForm explorationId={id} />
        </div>
      </div>
    </>
  );
};

export default ExplorationFormPage;