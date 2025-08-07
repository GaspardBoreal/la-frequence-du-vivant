
import React, { useState } from 'react';
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
  // Auto-activer les marches si pas déjà fait
  React.useEffect(() => {
    if (!layers.marchesTechnoSensibles) {
      onChange({
        ...layers,
        marchesTechnoSensibles: true
      });
    }
  }, [layers, onChange]);

  return (
    <div className="space-y-4">
      {/* Filtres directement accessibles */}
      <div className="gaspard-glass rounded-2xl p-6 shadow-xl border border-accent/20 animate-fade-in">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-1 h-6 bg-accent rounded-full"></div>
          <h4 className="text-lg font-medium text-foreground">
            Filtres des Marches Techno-Sensibles
          </h4>
        </div>
        <BioacousticFilters 
          marches={marchesData}
          onFilterChange={onFilteredDataChange}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default LayerSelector;
