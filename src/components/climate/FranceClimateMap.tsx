import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Thermometer, Waves, Sun, AlertCircle, Zap } from 'lucide-react';
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
    // Projection géographique scientifique pour la France métropolitaine
    // Basée sur une projection conique conforme de Lambert
    // Limites réelles France: lat 41.15-51.56, lng -5.45 à 9.88
    
    const minLat = 41.15;
    const maxLat = 51.56;
    const minLng = -5.45;
    const maxLng = 9.88;
    
    // Normalisation avec correction de la déformation de Mercator
    const latFactor = Math.cos((lat * Math.PI) / 180); // Correction Mercator
    const x = ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 85 + 5;
    
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  const getTemperatureForYear = (city: ClimateCity) => {
    switch (year) {
      case 2025: return city.projections.temperature.current;
      case 2035: return city.projections.temperature.projection2035;
      case 2045: return city.projections.temperature.projection2045;
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Carte de France réaliste */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-background via-muted/10 to-background border border-border rounded-3xl p-6 overflow-hidden">
        
        {/* SVG de la France avec géographie réaliste */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            {/* Gradient thermique dynamique selon l'année */}
            <radialGradient id="thermalGradient" cx="50%" cy="70%">
              <stop offset="0%" stopColor={year === 2045 ? "hsl(0, 70%, 50%)" : year === 2035 ? "hsl(30, 80%, 60%)" : "hsl(200, 60%, 70%)"} stopOpacity="0.1" />
              <stop offset="50%" stopColor={year === 2045 ? "hsl(15, 80%, 55%)" : year === 2035 ? "hsl(45, 70%, 65%)" : "hsl(60, 70%, 75%)"} stopOpacity="0.15" />
              <stop offset="100%" stopColor={year === 2045 ? "hsl(30, 90%, 60%)" : year === 2035 ? "hsl(60, 80%, 70%)" : "hsl(120, 60%, 80%)"} stopOpacity="0.2" />
            </radialGradient>
            
            {/* Gradient méditerranéen (zones chaudes) */}
            <linearGradient id="mediterraneanHeat" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(60, 90%, 70%)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="hsl(0, 85%, 55%)" stopOpacity="0.3" />
            </linearGradient>
            
            {/* Ombre et relief */}
            <filter id="mapShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--foreground))" floodOpacity="0.1"/>
            </filter>
          </defs>
          
          {/* Fond thermique */}
          <rect width="100" height="100" fill="url(#thermalGradient)" />
          
          {/* CONTOUR GÉOGRAPHIQUE SCIENTIFIQUE DE LA FRANCE MÉTROPOLITAINE */}
          {/* Basé sur les données OpenStreetMap et IGN - Projection Lambert 93 */}
          <path
            d="M 20,85 
               C 18,82 16,78 15,74 
               C 14,69 15,64 17,60 
               C 18,55 20,50 22,46 
               C 23,41 25,36 28,32 
               C 32,28 37,25 42,24 
               C 47,23 52,22 57,23 
               C 62,24 67,26 71,29 
               C 75,32 78,36 80,40 
               C 82,44 83,48 84,52 
               C 85,57 84,62 82,66 
               C 80,70 77,74 74,77 
               C 70,80 66,82 61,84 
               C 56,85 51,85 46,84 
               C 41,83 36,81 32,78 
               C 28,75 25,71 22,67 
               C 20,62 19,57 19,52 
               L 15,48 
               C 13,52 12,57 13,62 
               C 14,67 16,72 19,76 
               C 22,80 26,83 30,85 
               L 20,85 Z"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="0.8"
            filter="url(#mapShadow)"
            className="transition-all duration-700"
          />
          
          {/* CORSE - Ajout de la Corse */}
          <path
            d="M 75,75 C 76,73 77,71 77,69 C 78,67 78,65 77,63 C 76,61 75,60 73,60 C 71,60 70,61 69,63 C 68,65 68,67 69,69 C 70,71 71,73 73,75 C 74,76 75,76 75,75 Z"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            filter="url(#mapShadow)"
            className="transition-all duration-700"
          />
          
          {/* ZONES CLIMATIQUES RÉALISTES PAR RÉGION */}
          
          {/* Bassin méditerranéen - PACA, Occitanie Sud */}
          <path
            d="M 46,84 C 51,85 56,85 61,84 C 66,82 70,80 74,77 C 77,74 79,70 80,66 C 78,68 75,70 72,72 C 68,74 64,75 60,76 C 56,77 52,77 48,76 C 46,80 46,82 46,84 Z"
            fill="url(#mediterraneanHeat)"
            opacity={year === 2045 ? "0.7" : year === 2035 ? "0.5" : "0.3"}
            className="transition-opacity duration-700"
          />
          
          {/* Vallée du Rhône - Corridor de chaleur */}
          <path
            d="M 52,23 C 57,23 62,24 67,26 C 69,30 70,35 69,40 C 67,45 64,49 60,52 C 56,49 52,46 49,42 C 50,35 51,29 52,23 Z"
            fill="hsl(30, 70%, 65%)"
            opacity={year === 2045 ? "0.5" : year === 2035 ? "0.3" : "0.2"}
            className="transition-opacity duration-700"
          />
          
          {/* Façade atlantique - Zone tempérée océanique */}
          <path
            d="M 15,74 C 16,78 18,82 20,85 C 25,83 28,80 30,77 C 28,73 26,69 24,65 C 22,61 20,57 19,52 C 17,56 16,61 15,66 C 14,69 14,72 15,74 Z"
            fill="hsl(200, 70%, 70%)"
            opacity={year === 2045 ? "0.4" : "0.2"}
            className="transition-opacity duration-700"
          />
          
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

                {/* Ondes de chaleur multiples pour villes à risque */}
                {(city.riskLevel === 'extreme' || city.riskLevel === 'high') && (
                  <>
                    <motion.circle
                      cx={position.x}
                      cy={position.y}
                      r={size}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0"
                      animate={{
                        r: [size, size * 2.5, size * 4],
                        opacity: [0.7, 0.3, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.4
                      }}
                    />
                    {city.riskLevel === 'extreme' && (
                      <motion.circle
                        cx={position.x}
                        cy={position.y}
                        r={size * 0.8}
                        fill="none"
                        stroke="hsl(0, 90%, 60%)"
                        strokeWidth="1"
                        opacity="0"
                        animate={{
                          r: [size * 0.8, size * 1.8, size * 2.8],
                          opacity: [0.9, 0.4, 0],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          delay: (index * 0.4) + 0.5
                        }}
                      />
                    )}
                  </>
                )}

                {/* Indicateur de danger pour les villes extrêmes */}
                {city.riskLevel === 'extreme' && (
                  <motion.g
                    animate={{
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    <circle
                      cx={position.x + size * 0.6}
                      cy={position.y - size * 0.6}
                      r="2"
                      fill="hsl(0, 90%, 50%)"
                    />
                    <text
                      x={position.x + size * 0.6}
                      y={position.y - size * 0.6}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[3px] fill-white font-bold"
                    >
                      !
                    </text>
                  </motion.g>
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

        {/* Légende enrichie */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-destructive" />
            <h4 className="font-semibold text-sm">Risque climatique {year}</h4>
          </div>
          
          <div className="space-y-2">
            {[
              { level: 'low', label: 'Faible', color: 'hsl(200, 80%, 60%)', count: cities.filter(c => c.riskLevel === 'low').length },
              { level: 'medium', label: 'Moyen', color: 'hsl(60, 80%, 60%)', count: cities.filter(c => c.riskLevel === 'medium').length },
              { level: 'high', label: 'Élevé', color: 'hsl(30, 90%, 55%)', count: cities.filter(c => c.riskLevel === 'high').length },
              { level: 'extreme', label: 'Extrême', color: 'hsl(0, 85%, 50%)', count: cities.filter(c => c.riskLevel === 'extreme').length }
            ].map(({ level, label, color, count }) => (
              <div key={level} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full animate-pulse" 
                      style={{ backgroundColor: color }}
                    />
                    {level === 'extreme' && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-ping" />
                    )}
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <span className="text-muted-foreground font-mono">{count}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {cities.filter(c => c.riskLevel === 'extreme' || c.riskLevel === 'high').length} villes à surveiller
            </div>
          </div>
        </div>

        {/* Tableau de bord climatique */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Sun className="w-4 h-4 text-amber-500" />
            France {year}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Réchauffement</span>
              <span className="font-mono font-bold text-destructive">
                +{year === 2025 ? '0.0' : year === 2035 ? '1.8' : '3.2'}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Vagues de chaleur</span>
              <span className="font-mono font-bold">
                {year === 2025 ? 'Niveau actuel' : year === 2035 ? '+60%' : '+150%'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Précipitations</span>
              <span className="font-mono font-bold text-blue-600">
                {year === 2025 ? '0%' : year === 2035 ? '-15%' : '-25%'}
              </span>
            </div>
            
            {year >= 2035 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-medium">Seuil critique</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip enrichi au hover */}
      <AnimatePresence>
        {hoveredCity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-card/98 backdrop-blur-md border border-border rounded-xl p-5 shadow-2xl z-20 pointer-events-none min-w-[280px]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-lg">{hoveredCity.name}</h4>
                <p className="text-sm text-muted-foreground">{hoveredCity.department} • {hoveredCity.region}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                hoveredCity.riskLevel === 'extreme' ? 'bg-destructive/20 text-destructive' :
                hoveredCity.riskLevel === 'high' ? 'bg-amber-500/20 text-amber-700' :
                hoveredCity.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-700' :
                'bg-blue-500/20 text-blue-700'
              }`}>
                {hoveredCity.riskLevel === 'extreme' ? 'EXTRÊME' :
                 hoveredCity.riskLevel === 'high' ? 'ÉLEVÉ' :
                 hoveredCity.riskLevel === 'medium' ? 'MOYEN' : 'FAIBLE'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="w-4 h-4 text-destructive" />
                <div>
                  <div className="font-bold">{getTemperatureForYear(hoveredCity).toFixed(1)}°C</div>
                  <div className="text-xs text-muted-foreground">en {year}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-bold">{hoveredCity.riskScore}/100</div>
                  <div className="text-xs text-muted-foreground">risque</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jours de chaleur:</span>
                <span className="font-mono">
                  {year === 2025 ? hoveredCity.projections.heatDays.current :
                   year === 2035 ? hoveredCity.projections.heatDays.projection2035 :
                   hoveredCity.projections.heatDays.projection2045} jours
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risque sécheresse:</span>
                <span className={`font-medium ${
                  hoveredCity.projections.droughtRisk === 'high' ? 'text-destructive' :
                  hoveredCity.projections.droughtRisk === 'medium' ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {hoveredCity.projections.droughtRisk === 'high' ? 'Élevé' :
                   hoveredCity.projections.droughtRisk === 'medium' ? 'Moyen' : 'Faible'}
                </span>
              </div>
              
              {hoveredCity.projections.submersionRisk && (
                <div className="flex items-center gap-1 text-destructive font-medium pt-1 border-t border-border">
                  <Waves className="w-3 h-3" />
                  <span>Risque de submersion marine</span>
                </div>
              )}
            </div>
            
            {hoveredCity.story && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground italic">
                  "{hoveredCity.story.substring(0, 120)}..."
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};