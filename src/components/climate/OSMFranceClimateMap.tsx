import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Thermometer, Waves, Sun, AlertCircle, Zap } from 'lucide-react';
import { ClimateCity } from '@/types/climateAtlas';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OSMFranceClimateMapProps {
  cities: ClimateCity[];
  selectedCity?: ClimateCity;
  year: 2025 | 2035 | 2045;
  onCitySelect: (city: ClimateCity) => void;
}

// Custom marker styles for different risk levels
const createCustomIcon = (city: ClimateCity, isSelected: boolean) => {
  const riskColors = {
    low: '#3b82f6',
    medium: '#f59e0b', 
    high: '#f97316',
    extreme: '#ef4444'
  };
  
  const size = isSelected ? 32 : 24;
  const color = riskColors[city.riskLevel];
  
  return L.divIcon({
    className: 'custom-climate-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        ${city.riskLevel === 'extreme' ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${isSelected ? '📍' : '🌡️'}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

// Component to fit bounds to France
const FitBoundsToFrance: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    // Bounds for France métropolitaine
    const franceBounds = L.latLngBounds(
      [41.15, -5.45], // Southwest corner
      [51.56, 9.88]   // Northeast corner
    );
    
    map.fitBounds(franceBounds, { padding: [20, 20] });
  }, [map]);
  
  return null;
};

export const OSMFranceClimateMap: React.FC<OSMFranceClimateMapProps> = ({
  cities,
  selectedCity,
  year,
  onCitySelect
}) => {
  const [hoveredCity, setHoveredCity] = useState<ClimateCity | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelStats = () => {
    const stats = cities.reduce((acc, city) => {
      acc[city.riskLevel] = (acc[city.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return stats;
  };

  const stats = getRiskLevelStats();
  const criticalThreshold = year >= 2035;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-background/95 to-secondary/10">
      {/* Map Container */}
      <div className="relative w-full h-[70vh] rounded-xl overflow-hidden shadow-2xl border border-border/50">
        <MapContainer
          ref={mapRef}
          center={[46.603354, 1.888334]} // Center of France
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          className="z-10"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            opacity={0.8}
          />
          
          <FitBoundsToFrance />
          
          {cities.map((city) => (
            <Marker
              key={`${city.name}-${city.department}`}
              position={[city.latitude, city.longitude]}
              icon={createCustomIcon(city, selectedCity?.name === city.name)}
              eventHandlers={{
                click: () => onCitySelect(city),
                mouseover: () => setHoveredCity(city),
                mouseout: () => setHoveredCity(null),
              }}
            >
              <Popup>
                <div className="p-3 min-w-[250px]">
                  <h3 className="font-bold text-lg mb-2">{city.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {city.department}, {city.region}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${getRiskLevelColor(city.riskLevel)}`} />
                      <span className="font-medium capitalize">{city.riskLevel} Risk</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">
                        {year === 2025 ? city.projections.temperature.current : 
                         year === 2035 ? city.projections.temperature.projection2035 : 
                         city.projections.temperature.projection2045}°C
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        {year === 2025 ? city.projections.heatDays.current : 
                         year === 2035 ? city.projections.heatDays.projection2035 : 
                         city.projections.heatDays.projection2045} jours de canicule
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded p-2">
                      Score: {city.riskScore}/100
                    </div>
                    
                    {city.story && (
                      <p className="text-xs italic text-muted-foreground mt-2">
                        "{city.story}"
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Floating Legend */}
        <motion.div 
          className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-border/50 z-[1000]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Légende Climatique
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Faible ({stats.low || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Modéré ({stats.medium || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Élevé ({stats.high || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span>Extrême ({stats.extreme || 0})</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Climate Dashboard */}
      <motion.div 
        className="mt-6 bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg">
            <Thermometer className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-600">+{year === 2025 ? '0.8' : year === 2035 ? '2.1' : '3.4'}°C</div>
            <div className="text-sm text-muted-foreground">Température</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg">
            <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-600">+{year === 2025 ? '5' : year === 2035 ? '15' : '28'}</div>
            <div className="text-sm text-muted-foreground">Jours de canicule</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg">
            <Waves className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{year === 2025 ? '-2' : year === 2035 ? '-8' : '-15'}%</div>
            <div className="text-sm text-muted-foreground">Précipitations</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg">
            <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-purple-600">{cities.length}</div>
            <div className="text-sm text-muted-foreground">Villes analysées</div>
          </div>
        </div>
        
        {criticalThreshold && (
          <motion.div 
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Seuil critique atteint</span>
            </div>
            <p className="text-sm text-red-600/80 mt-1">
              Les projections pour {year} indiquent des risques climatiques majeurs.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Selected City Details */}
      <AnimatePresence>
        {selectedCity && (
          <motion.div 
            className="mt-4 bg-card/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4">{selectedCity.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Projections {year}</h4>
                <div className="space-y-2 text-sm">
                  <div>Température: {
                    year === 2025 ? selectedCity.projections.temperature.current : 
                    year === 2035 ? selectedCity.projections.temperature.projection2035 : 
                    selectedCity.projections.temperature.projection2045
                  }°C</div>
                  <div>Jours de canicule: {
                    year === 2025 ? selectedCity.projections.heatDays.current : 
                    year === 2035 ? selectedCity.projections.heatDays.projection2035 : 
                    selectedCity.projections.heatDays.projection2045
                  }</div>
                  <div>Risque de sécheresse: {selectedCity.projections.droughtRisk}</div>
                </div>
              </div>
              {selectedCity.story && (
                <div>
                  <h4 className="font-semibold mb-2">Histoire locale</h4>
                  <p className="text-sm text-muted-foreground italic">"{selectedCity.story}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};