
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
        
        {/* Fond avec gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/50 to-secondary/30"></div>
        
        <div className="relative z-10">
          {/* Header simplifié */}
          <header className="bg-card/40 backdrop-blur-lg shadow-2xl border-b border-border/20">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-950/30 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-xs uppercase tracking-wide text-blue-300">
                    Administration
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-white">Migration</span><br />
                  <span className="text-blue-500">Supabase V1</span>
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
