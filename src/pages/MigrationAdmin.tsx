
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import MigrationAdminPanel from '../components/MigrationAdminPanel';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const MigrationAdmin = () => {
  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Administration Migration - La Fréquence du Vivant"
          description="Interface d'administration pour la migration des données vers Supabase"
          canonicalUrl="https://la-frequence-du-vivant.lovable.app/admin/migration"
        />
        
        {/* Fond avec gradient simplifié */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-blue-500/10 to-purple-500/10"></div>
        
        <div className="relative z-10">
          {/* Header ultra-simplifié */}
          <header className="bg-card/80 backdrop-blur-sm border-b">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700">
                    Administration
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Migration Supabase V1
                </h1>
                
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Interface d'administration pour migrer vos données vers Supabase
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="py-8">
            <MigrationAdminPanel />
          </main>

          <Footer />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default MigrationAdmin;
