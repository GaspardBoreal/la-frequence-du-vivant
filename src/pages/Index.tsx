
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
      {/* Fond avec texture et gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
      
      {/* Éléments décoratifs inspirés de l'image */}
      <DecorativeElements className="text-gaspard-mint/30" />
      
      <div className="relative z-10">
        {/* Header avec le nouveau design sombre */}
        <header className="bg-card/90 backdrop-blur-sm shadow-2xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center animate-fade-in">
              {/* Titre principal inspiré de l'image */}
              <h1 className="gaspard-title text-4xl md:text-5xl lg:text-6xl mb-3">
                Gaspard Boréal
              </h1>
              
              {/* Titre secondaire en or */}
              <div className="mb-4">
                <h2 className="gaspard-subtitle text-xl md:text-2xl lg:text-3xl">
                  La Fréquence du Vivant
                </h2>
              </div>
              
              {/* Sous-titre poétique */}
              <p className="gaspard-text text-base md:text-lg max-w-3xl mx-auto">
                marche techno-sensible entre vivant, humain et machine
              </p>
              
              {/* Indicateur de région */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
                <span className="text-muted-foreground">Région explorée:</span>
                <span 
                  className="px-4 py-2 rounded-full bg-accent text-accent-foreground font-medium text-sm shadow-lg"
                >
                  {theme.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar avec nouveau style sombre */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
            <SearchBar onSearch={handleSearch} theme={theme} />
          </div>
        </div>

        {/* Main Content avec nouveau layout sombre */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Layer Selector avec nouveau design sombre */}
            <div className="lg:col-span-1 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="gaspard-card rounded-2xl p-6">
                <LayerSelector 
                  layers={layers} 
                  onChange={handleLayerChange} 
                  theme={theme}
                  marchesData={marchesData}
                  onFilteredDataChange={handleFilteredDataChange}
                />
              </div>
            </div>

            {/* Map avec nouveau style sombre */}
            <div className="lg:col-span-3 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="gaspard-card rounded-2xl overflow-hidden">
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

        {/* Sidebar avec nouveau design sombre */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          parcel={selectedParcel}
          theme={theme}
        />
      </div>
      
      {/* Overlay subtil pour l'ambiance */}
      <div className="fixed inset-0 bg-gaspard-dark/20 pointer-events-none z-0"></div>
    </div>
  );
};

export default Index;
