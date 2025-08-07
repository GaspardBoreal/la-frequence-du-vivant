
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { LayerConfig } from '../types';
import { RegionalTheme } from '../utils/regionalThemes';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import BioacousticFilters from './BioacousticFilters';

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

  const handleToggle = () => {
    const newLayers = {
      ...layers,
      marchesTechnoSensibles: !layers.marchesTechnoSensibles
    };
    onChange(newLayers);
    
    // Si on désactive, on masque les filtres
    if (!newLayers.marchesTechnoSensibles) {
      setShowFilters(false);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="space-y-4">
      {/* Bandeau principal redesigné */}
      <div className="gaspard-glass rounded-2xl p-6 shadow-xl border border-accent/20">
        <div className="flex items-center justify-between">
          {/* Section gauche avec toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-accent/20">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Marches Techno-Sensibles
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explorez les territoires hybrides
                </p>
              </div>
            </div>
            
            {/* Toggle switch design */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {layers.marchesTechnoSensibles ? 'Actif' : 'Inactif'}
              </span>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  layers.marchesTechnoSensibles 
                    ? 'bg-accent' 
                    : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    layers.marchesTechnoSensibles ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section droite avec filtres */}
          {layers.marchesTechnoSensibles && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {marchesData.length} marches disponibles
              </div>
              <button
                onClick={toggleFilters}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  showFilters 
                    ? 'bg-accent text-accent-foreground shadow-lg' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="text-sm font-medium">Filtres</span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panneau de filtres */}
      {layers.marchesTechnoSensibles && showFilters && (
        <div className="gaspard-glass rounded-2xl p-6 shadow-xl border border-accent/20 animate-fade-in">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-1 h-6 bg-accent rounded-full"></div>
            <h4 className="text-lg font-medium text-foreground">
              Filtres avancés
            </h4>
          </div>
          <BioacousticFilters 
            marches={marchesData}
            onFilterChange={onFilteredDataChange}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};

export default LayerSelector;
