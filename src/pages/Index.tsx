
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
    <div className="min-h-screen bg-gradient-to-br from-sage-100 via-sage-50 to-sage-100 relative overflow-hidden">
      {/* Éléments décoratifs inspirés de l'image */}
      <DecorativeElements className="text-forest-600" />
      
      <div className="relative z-10">
        {/* Header avec le nouveau design */}
        <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-sage-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              {/* Titre principal inspiré de l'image */}
              <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-light text-sage-800 mb-2">
                Gaspard Boréal
              </h1>
              
              {/* Titre secondaire en lettres capitales */}
              <div className="mb-3">
                <h2 className="font-inter text-xl md:text-2xl lg:text-3xl font-bold text-forest-800 tracking-wide uppercase">
                  La Fréquence du Vivant
                </h2>
              </div>
              
              {/* Sous-titre poétique */}
              <p className="font-inter text-sm md:text-base text-forest-600 font-light leading-relaxed max-w-2xl mx-auto">
                marche techno-sensible entre vivant, humain et machine
              </p>
              
              {/* Indicateur de région */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
                <span className="text-sage-600">Région explorée:</span>
                <span 
                  className="px-3 py-1 rounded-full text-white font-medium text-sm"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {theme.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar avec nouveau style */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchBar onSearch={handleSearch} theme={theme} />
        </div>

        {/* Main Content avec nouveau layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Layer Selector avec nouveau design */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-sage-200/50 p-6">
                <LayerSelector 
                  layers={layers} 
                  onChange={handleLayerChange} 
                  theme={theme}
                  marchesData={marchesData}
                  onFilteredDataChange={handleFilteredDataChange}
                />
              </div>
            </div>

            {/* Map avec nouveau style */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-sage-200/50 overflow-hidden">
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

        {/* Sidebar avec nouveau design */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          parcel={selectedParcel}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default Index;
