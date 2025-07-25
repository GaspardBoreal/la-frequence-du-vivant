
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { CloudSun, Wheat, Building, TrendingUp } from 'lucide-react';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig } from '../pages/Index';

interface LayerSelectorProps {
  layers: LayerConfig;
  onChange: (layers: LayerConfig) => void;
  theme: RegionalTheme;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ layers, onChange, theme }) => {
  const handleLayerToggle = (layer: keyof Omit<LayerConfig, 'radius'>) => {
    onChange({
      ...layers,
      [layer]: !layers[layer]
    });
  };

  const handleRadiusChange = (value: number[]) => {
    onChange({
      ...layers,
      radius: value[0]
    });
  };

  const layerItems = [
    {
      key: 'weatherStations' as const,
      label: 'Stations Météo',
      icon: CloudSun,
      description: 'Stations météorologiques'
    },
    {
      key: 'parcelles' as const,
      label: 'Parcelles',
      icon: Wheat,
      description: 'Parcelles cadastrales'
    },
    {
      key: 'parcellesPAC' as const,
      label: 'Parcelles PAC',
      icon: Building,
      description: 'Parcelles agricoles PAC'
    },
    {
      key: 'immediateTransactions' as const,
      label: 'Transactions',
      icon: TrendingUp,
      description: 'Transactions immobilières'
    }
  ];

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
          Couches de données
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layer toggles */}
        <div className="space-y-4">
          {layerItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.key} className="flex items-start space-x-3">
                <Checkbox
                  id={item.key}
                  checked={layers[item.key]}
                  onCheckedChange={() => handleLayerToggle(item.key)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={item.key}
                    className="flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <IconComponent className="h-4 w-4" style={{ color: theme.colors.primary }} />
                    {item.label}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Radius selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Rayon de recherche: {layers.radius}m
          </Label>
          <Slider
            value={[layers.radius]}
            onValueChange={handleRadiusChange}
            min={50}
            max={500}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>50m</span>
            <span>500m</span>
          </div>
        </div>

        {/* Active layers summary */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium mb-2">Couches actives:</p>
          <div className="flex flex-wrap gap-1">
            {layerItems
              .filter(item => layers[item.key])
              .map(item => (
                <span
                  key={item.key}
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: theme.colors.secondary }}
                >
                  {item.label}
                </span>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayerSelector;
