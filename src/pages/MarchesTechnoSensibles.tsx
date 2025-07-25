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
  console.log('🚀 MarchesTechnoSensibles component rendering...');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);
  const [layers, setLayers] = useState<LayerConfig>({
    marchesTechnoSensibles: true
  });
  const [selectedParcel, setSelectedParcel] = useState<SelectedParcel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filteredMarchesData, setFilteredMarchesData] = useState<MarcheTechnoSensible[]>([]);
  console.log('🔄 Current state:', {
    theme: theme.name,
    layers,
    filteredMarchesData: filteredMarchesData.length
  });

  // Fetch marches data
  const {
    data: marchesData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['marchesTechnoSensibles'],
    queryFn: fetchMarchesTechnoSensibles,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  console.log('📊 Query status:', {
    isLoading,
    error,
    dataLength: marchesData.length
  });

  // Initialiser les données filtrées avec toutes les données au début
  useEffect(() => {
    console.log('🔄 Updating filtered data with:', marchesData.length, 'items');
    setFilteredMarchesData(marchesData);
  }, [marchesData]);
  const handleLayerChange = (newLayers: LayerConfig) => {
    console.log('🗂️ Layer change:', newLayers);
    setLayers(newLayers);
  };
  const handleParcelClick = (parcel: SelectedParcel) => {
    console.log('🎯 Parcel clicked:', parcel);
    setSelectedParcel(parcel);
    setSidebarOpen(true);
  };
  const handleCloseSidebar = () => {
    console.log('❌ Closing sidebar');
    setSidebarOpen(false);
    setSelectedParcel(null);
  };

  // Stabiliser la fonction avec useCallback pour éviter les re-rendus
  const handleFilteredDataChange = useCallback((data: MarcheTechnoSensible[]) => {
    console.log('🔍 Filtered data changed:', data.length, 'items');
    setFilteredMarchesData(data);
  }, []);
  useEffect(() => {
    console.log('🎨 Setting theme CSS variables for:', theme.name);
    document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--theme-background', theme.colors.background);
  }, [theme]);
  console.log('📱 About to render component structure');
  if (error) {
    console.error('❌ Error in MarchesTechnoSensibles:', error);
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600">Une erreur est survenue lors du chargement des données.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Recharger la page
          </button>
        </div>
      </div>;
  }
  return <HelmetProvider>
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
              <div className="text-center space-y-4 animate-fade-in">
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
                  <span style={{
                  color: '#4ade80'
                }}>Interactive</span>
                </h1>
                
                {/* Sous-titre */}
                <p className="gaspard-subtitle max-w-2xl mx-auto">
                  Explorez les territoires de l'art, de la science et de la poésie
                </p>
                
                {/* Meta informations avec interligne réduit */}
                
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="space-y-6">
              {/* Layer Selector et filtres en largeur */}
              <div className="animate-fade-in" style={{
              animationDelay: '0.3s'
            }}>
                <LayerSelector layers={layers} onChange={handleLayerChange} theme={theme} marchesData={marchesData} onFilteredDataChange={handleFilteredDataChange} />
              </div>

              {/* Map en pleine largeur */}
              <div className="animate-fade-in" style={{
              animationDelay: '0.5s'
            }}>
                <div className="gaspard-card rounded-xl overflow-hidden shadow-2xl">
                  {isLoading ? <div className="h-96 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Chargement de la carte...</p>
                      </div>
                    </div> : <InteractiveMap searchResult={null} layers={layers} theme={theme} onParcelClick={handleParcelClick} filteredMarchesData={filteredMarchesData} />}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />

          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} selectedParcel={selectedParcel} />
        </div>
        
        {/* Overlay d'ambiance vert émeraude */}
        <div className="fixed inset-0 bg-primary/5 pointer-events-none z-0"></div>
      </div>
    </HelmetProvider>;
};
export default MarchesTechnoSensibles;