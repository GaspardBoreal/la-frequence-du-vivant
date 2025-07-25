
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
    if (layerName === 'radius') return;
    
    onChange({
      ...layers,
      [layerName]: !layers[layerName]
    });
  };

  const handleRadiusChange = (radius: number) => {
    onChange({
      ...layers,
      radius
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Couches de données</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="weatherStations"
            checked={layers.weatherStations}
            onChange={() => handleLayerToggle('weatherStations')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="weatherStations" className="ml-2 text-sm text-gray-700">
            Stations météo
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="parcelles"
            checked={layers.parcelles}
            onChange={() => handleLayerToggle('parcelles')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="parcelles" className="ml-2 text-sm text-gray-700">
            Parcelles
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="parcellesPAC"
            checked={layers.parcellesPAC}
            onChange={() => handleLayerToggle('parcellesPAC')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="parcellesPAC" className="ml-2 text-sm text-gray-700">
            Parcelles PAC
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="immediateTransactions"
            checked={layers.immediateTransactions}
            onChange={() => handleLayerToggle('immediateTransactions')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="immediateTransactions" className="ml-2 text-sm text-gray-700">
            Transactions immobilières
          </label>
        </div>

        <div className="mt-6">
          <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
            Rayon de recherche: {layers.radius}m
          </label>
          <input
            type="range"
            id="radius"
            min="50"
            max="500"
            value={layers.radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: theme.colors.primary }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50m</span>
            <span>500m</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerSelector;
