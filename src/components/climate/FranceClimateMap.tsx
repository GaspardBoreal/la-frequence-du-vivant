import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Thermometer, Waves, Sun, AlertCircle } from 'lucide-react';
import { ClimateCity } from '@/types/climateAtlas';

interface FranceClimateMapProps {
  cities: ClimateCity[];
  selectedCity?: ClimateCity;
  year: 2025 | 2035 | 2045;
  onCitySelect: (city: ClimateCity) => void;
}

export const FranceClimateMap: React.FC<FranceClimateMapProps> = ({
  cities,
  selectedCity,
  year,
  onCitySelect
}) => {
  const [hoveredCity, setHoveredCity] = useState<ClimateCity | null>(null);

  const getCityColor = (city: ClimateCity) => {
    switch (city.riskLevel) {
      case 'low': return 'hsl(200, 80%, 60%)';
      case 'medium': return 'hsl(60, 80%, 60%)';
      case 'high': return 'hsl(30, 90%, 55%)';
      case 'extreme': return 'hsl(0, 85%, 50%)';
    }
  };

  const getCitySize = (city: ClimateCity) => {
    return 8 + (city.riskScore / 100) * 12; // Entre 8px et 20px
  };

  const getPositionFromCoordinates = (lat: number, lng: number) => {
    // Conversion approximative lat/lng vers position SVG
    // France: lat 42-51, lng -5 à 8
    const x = ((lng + 5) / 13) * 100; // Normalisation longitude
    const y = ((51 - lat) / 9) * 100; // Normalisation latitude (inversée pour SVG)
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const getTemperatureForYear = (city: ClimateCity) => {
    switch (year) {
      case 2025: return city.projections.temperature.current;
      case 2035: return city.projections.temperature.projection2035;
      case 2045: return city.projections.temperature.projection2045;
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Carte de France stylisée */}
      <div className="relative aspect-square bg-gradient-to-br from-muted/20 to-background border border-border rounded-2xl p-8">
        
        {/* Contour France approximatif */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background gradient selon le réchauffement global */}
          <defs>
            <radialGradient id="climateGradient" cx="50%" cy="30%">
              <stop offset="0%" stopColor="hsl(200, 60%, 80%)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(60, 70%, 70%)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(0, 70%, 60%)" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          
          <rect width="100" height="100" fill="url(#climateGradient)" rx="10" />
          
          {/* Villes avec animation */}
          {cities.map((city, index) => {
            const position = getPositionFromCoordinates(city.latitude, city.longitude);
            const size = getCitySize(city);
            const color = getCityColor(city);
            const isSelected = selectedCity?.name === city.name;
            const isHovered = hoveredCity?.name === city.name;
            
            return (
              <g key={city.name}>
                {/* Cercle de la ville */}
                <motion.circle
                  cx={position.x}
                  cy={position.y}
                  r={size / 2}
                  fill={color}
                  stroke={isSelected ? 'hsl(var(--accent))' : 'white'}
                  strokeWidth={isSelected ? 3 : 1}
                  opacity={0.8}
                  className="cursor-pointer"
                  onClick={() => onCitySelect(city)}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  animate={{
                    scale: isSelected ? 1.3 : isHovered ? 1.1 : 1,
                    opacity: isSelected || isHovered ? 1 : 0.8
                  }}
                  transition={{ duration: 0.2 }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ 
                    scale: 1, 
                    opacity: 0.8,
                    transition: { delay: index * 0.1, duration: 0.5 }
                  }}
                />

                {/* Onde de chaleur pour les villes à haut risque */}
                {city.riskLevel === 'extreme' && (
                  <motion.circle
                    cx={position.x}
                    cy={position.y}
                    r={size}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0"
                    animate={{
                      r: [size, size * 2, size * 3],
                      opacity: [0.8, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  />
                )}

                {/* Label de la ville (visible au hover ou si sélectionnée) */}
                <AnimatePresence>
                  {(isHovered || isSelected) && (
                    <motion.text
                      x={position.x}
                      y={position.y - size - 5}
                      textAnchor="middle"
                      className="text-xs font-medium fill-foreground"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                    >
                      {city.name}
                    </motion.text>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>

        {/* Légende */}
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Niveau de risque climatique</h4>
          {[
            { level: 'low', label: 'Faible', color: 'hsl(200, 80%, 60%)' },
            { level: 'medium', label: 'Moyen', color: 'hsl(60, 80%, 60%)' },
            { level: 'high', label: 'Élevé', color: 'hsl(30, 90%, 55%)' },
            { level: 'extreme', label: 'Extrême', color: 'hsl(0, 85%, 50%)' }
          ].map(({ level, label, color }) => (
            <div key={level} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Indicateurs climatiques globaux */}
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Thermometer className="w-4 h-4" />
            France {year}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Température: +{year === 2025 ? '0' : year === 2035 ? '1.8' : '3.2'}°C</div>
            <div>Vagues de chaleur: {year === 2025 ? 'Actuelles' : year === 2035 ? '+60%' : '+150%'}</div>
          </div>
        </div>
      </div>

      {/* Tooltip au hover */}
      <AnimatePresence>
        {hoveredCity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-card border border-border rounded-lg p-4 shadow-xl z-10 pointer-events-none"
          >
            <h4 className="font-semibold">{hoveredCity.name}</h4>
            <p className="text-sm text-muted-foreground">{hoveredCity.department}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                {getTemperatureForYear(hoveredCity).toFixed(1)}°C
              </div>
              <div className="flex items-center gap-1">
                <Sun className="w-3 h-3" />
                Score: {hoveredCity.riskScore}
              </div>
              {hoveredCity.projections.submersionRisk && (
                <div className="flex items-center gap-1 text-destructive">
                  <Waves className="w-3 h-3" />
                  Submersion
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};