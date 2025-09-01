import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Thermometer, MapPin, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { ClimateCity } from '@/types/climateAtlas';

interface ThermoNavigatorProps {
  activeLevel: number;
  selectedCity?: ClimateCity;
  year: 2025 | 2035 | 2045;
  onLevelChange: (level: number) => void;
  onYearChange: (year: 2025 | 2035 | 2045) => void;
  thermometerColor: string;
}

export const ThermoNavigator: React.FC<ThermoNavigatorProps> = ({
  activeLevel,
  selectedCity,
  year,
  onLevelChange,
  onYearChange,
  thermometerColor
}) => {
  const getRiskColor = (level: 'low' | 'medium' | 'high' | 'extreme') => {
    switch (level) {
      case 'low': return 'hsl(200, 80%, 60%)';
      case 'medium': return 'hsl(60, 80%, 60%)';
      case 'high': return 'hsl(30, 90%, 55%)';
      case 'extreme': return 'hsl(0, 85%, 50%)';
    }
  };

  const getRiskIcon = (level: 'low' | 'medium' | 'high' | 'extreme') => {
    if (level === 'high' || level === 'extreme') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <TrendingUp className="w-4 h-4" />;
  };

  const getTemperatureForYear = (city: ClimateCity) => {
    switch (year) {
      case 2025: return city.projections.temperature.current;
      case 2035: return city.projections.temperature.projection2035;
      case 2045: return city.projections.temperature.projection2045;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="climate-thermo-container"
    >
      {/* Thermomètre géant vertical */}
      <div className="relative h-[70vh] w-24 mx-auto mb-8">
        {/* Background du thermomètre */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-full bg-muted rounded-full border-2 border-border">
          {/* Remplissage du thermomètre */}
          <motion.div
            className="absolute bottom-0 w-full rounded-full transition-all duration-1000 ease-out"
            style={{
              height: `${activeLevel}%`,
              background: `linear-gradient(180deg, ${thermometerColor}, ${thermometerColor})`
            }}
            animate={{
              height: `${activeLevel}%`,
              background: `linear-gradient(180deg, ${thermometerColor}, ${thermometerColor})`
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Graduations */}
        {[0, 25, 50, 75, 100].map((mark) => (
          <div
            key={mark}
            className="absolute right-10 transform -translate-y-1/2 text-xs text-muted-foreground flex items-center gap-2"
            style={{ bottom: `${mark}%` }}
          >
            <div className="w-4 h-px bg-border"></div>
            <span className="font-mono">{mark === 0 ? 'Froid' : mark === 100 ? 'Extrême' : ''}</span>
          </div>
        ))}

        {/* Icône thermomètre */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <Thermometer className="w-6 h-6 text-foreground" />
        </div>
      </div>

      {/* Slider horizontal pour contrôler */}
      <div className="mb-8">
        <Slider
          value={[activeLevel]}
          onValueChange={([value]) => onLevelChange(value)}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Villes protégées</span>
          <span>Villes menacées</span>
        </div>
      </div>

      {/* Sélecteur d'année */}
      <div className="flex justify-center gap-2 mb-8">
        {[2025, 2035, 2045].map((yearOption) => (
          <motion.button
            key={yearOption}
            onClick={() => onYearChange(yearOption as any)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              year === yearOption 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {yearOption}
          </motion.button>
        ))}
      </div>

      {/* Informations de la ville sélectionnée */}
      <AnimatePresence mode="wait">
        {selectedCity && (
          <motion.div
            key={selectedCity.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{selectedCity.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedCity.department}, {selectedCity.region}
                </p>
              </div>
              <Badge 
                className="flex items-center gap-1"
                style={{ 
                  backgroundColor: `${getRiskColor(selectedCity.riskLevel)}20`,
                  color: getRiskColor(selectedCity.riskLevel),
                  borderColor: getRiskColor(selectedCity.riskLevel)
                }}
              >
                {getRiskIcon(selectedCity.riskLevel)}
                {selectedCity.riskLevel}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Température moyenne</span>
                <span className="font-mono text-lg" style={{ color: thermometerColor }}>
                  {getTemperatureForYear(selectedCity).toFixed(1)}°C
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Score de risque</span>
                <span className="font-semibold">{selectedCity.riskScore}/100</span>
              </div>

              {selectedCity.projections.submersionRisk && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Risque de submersion marine
                </div>
              )}

              {selectedCity.story && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-accent pl-3 mt-4">
                  {selectedCity.story}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};