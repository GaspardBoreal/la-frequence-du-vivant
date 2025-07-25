import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import SearchBar from '../components/SearchBar';
import LayerSelector from '../components/LayerSelector';
import InteractiveMap from '../components/InteractiveMap';
import Sidebar from '../components/Sidebar';
import DecorativeElements from '../components/DecorativeElements';
import { RegionalTheme, REGIONAL_THEMES } from '../utils/regionalThemes';
import { fetchParcelData } from '../utils/lexiconApi';
import { fetchMarchesTechnoSensibles, MarcheTechnoSensible } from '../utils/googleSheetsApi';

export interface SearchResult {
  coordinates: [number, number];
  address: string;
  region: string;
}

export interface LayerConfig {
  marchesTechnoSensibles: boolean;
  openData: boolean;
}

export interface SelectedParcel {
  id: string;
  coordinates: [number, number];
  data: any;
}

const Index = () => {
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
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

  const handleSearch = (result: SearchResult) => {
    setSearchResult(result);
    // Update theme based on region
    const regionKey = result.region.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (REGIONAL_THEMES[regionKey]) {
      setTheme(REGIONAL_THEMES[regionKey]);
    }
    toast.success(`Recherche effectuée: ${result.address}`);
  };

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
    <div className="min-h-screen bg-background relative overflow-hidden">
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
                  Bioacoustique & Poésie
                </span>
              </div>
              
              {/* Titre principal - structure exacte avec couleurs spécifiques */}
              <h1 className="font-crimson font-normal leading-tight text-6xl md:text-7xl lg:text-8xl">
                <span className="text-white">La Fréquence</span><br />
                <span style={{ color: '#4ade80' }}>du Vivant</span>
              </h1>
              
              {/* Sous-titre */}
              <p className="gaspard-subtitle max-w-2xl mx-auto">
                Marche techno-sensible entre vivant, humain et machine
              </p>
              
              {/* Meta informations */}
              <div className="flex items-center justify-center space-x-4 pt-8">
                <span className="gaspard-meta">2025</span>
                <span className="text-accent">•</span>
                <span className="gaspard-author">Gaspard Boréal</span>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
            <SearchBar onSearch={handleSearch} theme={theme} />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Layer Selector */}
            <div className="lg:col-span-1 animate-fade-in" style={{animationDelay: '0.5s'}}>
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

            {/* Map */}
            <div className="lg:col-span-3 animate-fade-in" style={{animationDelay: '0.7s'}}>
              <div className="gaspard-card rounded-xl overflow-hidden shadow-2xl">
                <InteractiveMap
                  searchResult={searchResult}
                  layers={layers}
                  theme={theme}
                  onParcelClick={handleParcelClick}
                  filteredMarchesData={filteredMarchesData}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          parcel={selectedParcel}
          theme={theme}
        />
      </div>
      
      {/* Overlay d'ambiance vert émeraude */}
      <div className="fixed inset-0 bg-primary/5 pointer-events-none z-0"></div>
    </div>
  );
};

export default Index;
