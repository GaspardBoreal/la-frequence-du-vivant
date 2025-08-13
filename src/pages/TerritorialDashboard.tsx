import React from 'react';
import SEOHead from '@/components/SEOHead';
import { TerritorialDashboard } from '@/components/insights/TerritorialDashboard';

const TerritorialDashboardPage: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Tableau de Bord Territorial - Analyses pour Animateurs de Territoire"
        description="Analyses multidimensionnelles pour responsables territoriaux, biodiversité, environnement et développement économique"
        keywords="territorial, biodiversité, développement, aménagement, analyse"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <TerritorialDashboard />
        </div>
      </div>
    </>
  );
};

export default TerritorialDashboardPage;