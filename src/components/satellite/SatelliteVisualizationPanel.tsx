import React from 'react';
import { motion } from 'framer-motion';
import { Satellite, Palette, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';

interface SatelliteVisualizationPanelProps {
  visualizationType: 'trueColor' | 'ndvi' | 'ndviColorized';
  onVisualizationChange: (type: 'trueColor' | 'ndvi' | 'ndviColorized') => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  ndviTimeSeries?: {
    dates: string[];
    ndviValues: number[];
    cloudCover: number[];
  };
  className?: string;
}

const SatelliteVisualizationPanel: React.FC<SatelliteVisualizationPanelProps> = ({
  visualizationType,
  onVisualizationChange,
  selectedDate,
  onDateChange,
  ndviTimeSeries,
  className = ""
}) => {
  const visualizationOptions = [
    {
      type: 'trueColor' as const,
      label: 'Couleurs Naturelles',
      icon: Palette,
      description: 'Vision humaine du paysage',
      color: 'from-blue-500 to-green-500'
    },
    {
      type: 'ndvi' as const,
      label: 'NDVI Brut',
      icon: TrendingUp,
      description: 'Indice de végétation',
      color: 'from-yellow-500 to-green-600'
    },
    {
      type: 'ndviColorized' as const,
      label: 'NDVI Colorisé',
      icon: Satellite,
      description: 'Carte de vigueur végétale',
      color: 'from-green-400 to-emerald-600'
    }
  ];

  const getCurrentNDVI = () => {
    if (!ndviTimeSeries) return null;
    const dateIndex = ndviTimeSeries.dates.findIndex(date => date === selectedDate);
    return dateIndex >= 0 ? ndviTimeSeries.ndviValues[dateIndex] : null;
  };

  const getSeasonFromDate = (date: string): string => {
    const month = new Date(date).getMonth();
    if (month >= 2 && month <= 4) return 'printemps';
    if (month >= 5 && month <= 7) return 'été';
    if (month >= 8 && month <= 10) return 'automne';
    return 'hiver';
  };

  const currentNDVI = getCurrentNDVI();
  const season = getSeasonFromDate(selectedDate);

  return (
    <Card className={`p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200/50 ${className}`}>
      {/* Visualization Type Selector */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Satellite className="h-5 w-5 text-blue-600" />
          Mode de Visualisation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {visualizationOptions.map((option) => {
            const Icon = option.icon;
            const isActive = visualizationType === option.type;
            
            return (
              <motion.div
                key={option.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isActive ? "default" : "outline"}
                  className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${
                    isActive 
                      ? `bg-gradient-to-r ${option.color} text-white border-0` 
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => onVisualizationChange(option.type)}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  <div className="text-center">
                    <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>
                      {option.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                      {option.description}
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Temporal Navigation */}
      {ndviTimeSeries && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Navigation Temporelle
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Janvier 2024</span>
              <span className="text-slate-600">Décembre 2024</span>
            </div>
            
            <Slider
              value={[ndviTimeSeries.dates.indexOf(selectedDate)]}
              onValueChange={([index]) => {
                if (index >= 0 && index < ndviTimeSeries.dates.length) {
                  onDateChange(ndviTimeSeries.dates[index]);
                }
              }}
              max={ndviTimeSeries.dates.length - 1}
              step={1}
              className="w-full"
            />
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Badge>
              
              {currentNDVI !== null && (
                <Badge 
                  className={`text-xs ${
                    currentNDVI > 0.6 
                      ? 'bg-green-100 text-green-800' 
                      : currentNDVI > 0.3 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  NDVI: {currentNDVI.toFixed(3)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Poetic Interpretation */}
      {currentNDVI !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
        >
          <h4 className="text-sm font-medium text-slate-800 mb-2">Interprétation Poétique</h4>
          <p className="text-sm text-slate-600 italic">
            {currentNDVI < 0.2 && "Terre nue, promesse silencieuse"}
            {currentNDVI >= 0.2 && currentNDVI < 0.4 && "Premières pousses, éveil timide"}
            {currentNDVI >= 0.4 && currentNDVI < 0.6 && "Verdoyance naissante, souffle de vie"}
            {currentNDVI >= 0.6 && currentNDVI < 0.8 && "Feuillage dense, symphonie verte"}
            {currentNDVI >= 0.8 && "Éclat végétal, apogée de chlorophylle"}
          </p>
          <div className="text-xs text-slate-500 mt-2">
            Saison: {season} • NDVI: {currentNDVI.toFixed(3)}
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export default SatelliteVisualizationPanel;