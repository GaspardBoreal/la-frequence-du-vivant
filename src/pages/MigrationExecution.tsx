
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import MigrationControlPanel from '../components/MigrationControlPanel';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const MigrationExecution = () => {
  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Exécution Migration - Phase 2"
          description="Interface d'exécution pour la migration automatisée des données vers Supabase"
          canonicalUrl="https://la-frequence-du-vivant.lovable.app/admin/migration/execute"
        />
        
        {/* Fond avec gradient simplifié */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-green-500/10 to-blue-500/10"></div>
        
        <div className="relative z-10">
          {/* Header ultra-simplifié */}
          <header className="bg-card/80 backdrop-blur-sm border-b">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-700">
                    Phase 2 - Exécution
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Migration Automatisée
                </h1>
                
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Exécution complète de la migration depuis Google Sheets et Google Drive
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="py-8">
            <MigrationControlPanel />
          </main>

          <Footer />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default MigrationExecution;
