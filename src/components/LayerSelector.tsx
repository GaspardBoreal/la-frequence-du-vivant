
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
      <BioacousticFilters 
        marches={marchesData}
        onFilterChange={onFilteredDataChange}
        theme={theme}
      />
    </div>
  );
};

export default LayerSelector;
