import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import SearchBar from '../components/SearchBar';
import LayerSelector from '../components/LayerSelector';
import InteractiveMap from '../components/InteractiveMap';
import Sidebar from '../components/Sidebar';
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
    marchesTechnoSensibles: true, // Coché par défaut
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

  const handleFilteredDataChange = (data: MarcheTechnoSensible[]) => {
    setFilteredMarchesData(data);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--theme-background', theme.colors.background);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{ backgroundColor: theme.colors.background }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-yellow-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🌾</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Explorateur Agricole
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>Région:</span>
                <span 
                  className="px-3 py-1 rounded-full text-white font-medium"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {theme.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBar onSearch={handleSearch} theme={theme} />
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Layer Selector */}
            <div className="lg:col-span-1">
              <LayerSelector 
                layers={layers} 
                onChange={handleLayerChange} 
                theme={theme}
                marchesData={marchesData}
                onFilteredDataChange={handleFilteredDataChange}
              />
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
    </div>
  );
};

export default Index;
