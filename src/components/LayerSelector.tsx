
import React from 'react';
import { LayerConfig } from '../pages/Index';
import { RegionalTheme } from '../utils/regionalThemes';

interface LayerSelectorProps {
  layers: LayerConfig;
  onChange: (layers: LayerConfig) => void;
  theme: RegionalTheme;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ layers, onChange, theme }) => {
  const handleLayerToggle = (layerName: keyof LayerConfig) => {
    onChange({
      ...layers,
      [layerName]: !layers[layerName]
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Couches de données</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="marchesTechnoSensibles"
            checked={layers.marchesTechnoSensibles}
            onChange={() => handleLayerToggle('marchesTechnoSensibles')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="marchesTechnoSensibles" className="ml-2 text-sm text-gray-700">
            Marches TechnoSensibles
          </label>
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
  );
};

export default LayerSelector;
