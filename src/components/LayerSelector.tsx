import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LayerConfig } from '../types';
import { RegionalTheme } from '../utils/regionalThemes';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import AdvancedFilters from './AdvancedFilters';

interface LayerSelectorProps {
  layers: LayerConfig;
  onChange: (layers: LayerConfig) => void;
  theme: RegionalTheme;
  marchesData: MarcheTechnoSensible[];
  onFilteredDataChange: (data: MarcheTechnoSensible[]) => void;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ 
  layers, 
  onChange, 
  theme, 
  marchesData,
  onFilteredDataChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleLayerToggle = (layerName: keyof LayerConfig) => {
    const newLayers = {
      ...layers,
      [layerName]: !layers[layerName]
    };
    onChange(newLayers);
    
    // Si on désactive les marches, on masque les filtres
    if (layerName === 'marchesTechnoSensibles' && !newLayers.marchesTechnoSensibles) {
      setShowFilters(false);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Couches de données</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="marchesTechnoSensibles"
                checked={layers.marchesTechnoSensibles}
                onChange={() => handleLayerToggle('marchesTechnoSensibles')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="marchesTechnoSensibles" className="ml-2 text-sm text-gray-700">
                Marche Techno-sensible
              </label>
            </div>
            
            {layers.marchesTechnoSensibles && (
              <button
                onClick={toggleFilters}
                className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full transition-colors hover:bg-gray-100"
                style={{ 
                  backgroundColor: showFilters ? theme.colors.primary : 'transparent',
                  color: showFilters ? 'white' : theme.colors.primary
                }}
              >
                <span>Filtres</span>
                {showFilters ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="openData"
              checked={layers.openData}
              onChange={() => handleLayerToggle('openData')}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="openData" className="ml-2 text-sm text-gray-700">
              OpenData
            </label>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {layers.marchesTechnoSensibles && showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <AdvancedFilters 
            data={marchesData}
            onFilterChange={onFilteredDataChange}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};

export default LayerSelector;
