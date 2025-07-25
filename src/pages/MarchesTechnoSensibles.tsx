
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import LayerSelector from '../components/LayerSelector';
import InteractiveMap from '../components/InteractiveMap';
import Sidebar from '../components/Sidebar';
import DecorativeElements from '../components/DecorativeElements';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { RegionalTheme, REGIONAL_THEMES } from '../utils/regionalThemes';
import { fetchParcelData } from '../utils/lexiconApi';
import { fetchMarchesTechnoSensibles, MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { LayerConfig, SelectedParcel } from '../types/index';

const MarchesTechnoSensibles = () => {
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);
  const [layers, setLayers] = useState<LayerConfig>({
    marchesTechnoSensibles: true,
    openData: false,
  });
  const [selectedParcel, setSelectedParcel] = useState<SelectedParcel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filteredMarchesData, setFilteredMarchesData] = useState<MarcheTechnoSensible[]>([]);

  // Fetch marches data
  const { data: marchesData = [] } = useQuery({
    queryKey: ['marchesTechnoSensibles'],
    queryFn: fetchMarchesTechnoSensibles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialiser les données filtrées avec toutes les données au début
  useEffect(() => {
    setFilteredMarchesData(marchesData);
  }, [marchesData]);

  const handleLayerChange = (newLayers: LayerConfig) => {
    setLayers(newLayers);
  };

  const handleParcelClick = (parcel: SelectedParcel) => {
    setSelectedParcel(parcel);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedParcel(null);
  };

  // Stabiliser la fonction avec useCallback pour éviter les re-rendus
  const handleFilteredDataChange = useCallback((data: MarcheTechnoSensible[]) => {
    setFilteredMarchesData(data);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--theme-background', theme.colors.background);
  }, [theme]);

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SEOHead />
        
        {/* Fond avec gradient vert émeraude profond */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/50 to-secondary/30"></div>
        
        {/* Éléments décoratifs */}
        <DecorativeElements className="text-accent/20" />
        
        <div className="relative z-10">
          {/* Header avec typographie exacte */}
          <header className="bg-card/40 backdrop-blur-lg shadow-2xl border-b border-border/20">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <div className="text-center space-y-6 animate-fade-in">
                {/* Catégorie avec design exact */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-950/30 border border-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-xs uppercase tracking-wide text-green-300">
                    Marches Techno-Sensibles
                  </span>
                </div>
                
                {/* Titre principal - taille réduite */}
                <h1 className="font-crimson font-normal leading-tight text-3xl md:text-4xl lg:text-5xl">
                  <span className="text-white">Cartographie</span><br />
                  <span style={{ color: '#4ade80' }}>Interactive</span>
                </h1>
                
                {/* Sous-titre */}
                <p className="gaspard-subtitle max-w-2xl mx-auto">
                  Explorez les territoires de l'art, de la science et de la poésie
                </p>
                
                {/* Meta informations avec interligne réduit */}
                <div className="flex items-center justify-center space-x-4 pt-2">
                  <span className="text-white text-sm">2025</span>
                  <span className="text-white">•</span>
                  <span className="text-white text-sm">Gaspard Boréal</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - remonté avec moins d'espacement */}
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="space-y-6">
              {/* Layer Selector en largeur */}
              <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
                <div className="gaspard-card rounded-xl p-6">
                  <LayerSelector 
                    layers={layers} 
                    onChange={handleLayerChange} 
                    theme={theme}
                    marchesData={marchesData}
                    onFilteredDataChange={handleFilteredDataChange}
                  />
                </div>
              </div>

              {/* Map en pleine largeur */}
              <div className="animate-fade-in" style={{animationDelay: '0.5s'}}>
                <div className="gaspard-card rounded-xl overflow-hidden shadow-2xl">
                  <InteractiveMap
                    searchResult={null}
                    layers={layers}
                    theme={theme}
                    onParcelClick={handleParcelClick}
                    filteredMarchesData={filteredMarchesData}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />

          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleCloseSidebar}
            selectedParcel={selectedParcel}
          />
        </div>
        
        {/* Overlay d'ambiance vert émeraude */}
        <div className="fixed inset-0 bg-primary/5 pointer-events-none z-0"></div>
      </div>
    </HelmetProvider>
  );
};

export default MarchesTechnoSensibles;
