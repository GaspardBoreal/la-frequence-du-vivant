import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from 'recharts';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  MousePointer
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import WeatherStationModal from '../weather/WeatherStationModal';
import { calculateDistance, formatDistance, getDataQuality } from '../../utils/weatherStationGeolocation';
import type { Coordinates } from '../../utils/weatherStationGeolocation';
import { getCorrectStationCoordinates, findNearestWeatherStation } from '../../utils/weatherStationDatabase';

interface WeatherDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  date: string;
  hour: number;
}

interface WeatherVisualizationProps {
  weatherData: any;
  stationName: string;
  targetCoordinates?: Coordinates; // Coordonnées du point de référence pour calculer la distance
}

const WeatherVisualization: React.FC<WeatherVisualizationProps> = ({ 
  weatherData, 
  stationName,
  targetCoordinates 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [activeMetric, setActiveMetric] = useState<'both' | 'temperature' | 'humidity'>('both');
  const [hoveredPoint, setHoveredPoint] = useState<WeatherDataPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);

  // Debug pour comprendre la structure des données
  console.log('WeatherVisualization - weatherData:', weatherData);
  console.log('WeatherVisualization - stationName:', stationName);

  // Enrichissement des données de station avec calcul de distance
  const enrichedStationData = useMemo(() => {
    const originalStation = weatherData?.station;
    
    if (!originalStation) {
      console.warn('⚠️ [WEATHER] Aucune station trouvée dans les données météo');
      return null;
    }

    // Si on a des coordonnées cibles, utiliser directement la station la plus proche de notre base
    if (targetCoordinates) {
      const nearestStation = findNearestWeatherStation(targetCoordinates);
      if (nearestStation) {
        const distance = calculateDistance(targetCoordinates, nearestStation.coordinates);
        
        console.log(`🌡️ [WEATHER] Station la plus proche sélectionnée: ${nearestStation.name} (${nearestStation.code})`);
        console.log(`📍 [WEATHER] Coordonnées station: ${nearestStation.coordinates.lat}, ${nearestStation.coordinates.lng}`);
        console.log(`📏 [WEATHER] Distance: ${formatDistance(distance)}`);

        return {
          name: nearestStation.name,
          code: nearestStation.code,
          country: "France", 
          commune: nearestStation.name,
          elevation: nearestStation.elevation || "42 m",
          coordinates: nearestStation.coordinates,
          distance,
          originalData: originalStation
        };
      }
    }

    // Fallback: parser les données originales si pas de coordonnées cibles
    const value = originalStation.value || "";
    const href = originalStation.href || "";
    
    const codeMatch = value.match(/(\d{8})$/) || href.match(/FR(\d{8})$/);
    const stationCode = codeMatch ? codeMatch[1] : "unknown";
    
    const nameMatch = value.replace(/\s*\d{8}$/, '').trim();
    const parsedStationName = nameMatch || stationName || "Station météo";

    const stationCoords = getCorrectStationCoordinates(
      stationCode,
      parsedStationName,
      { lat: 44.8167, lng: -0.7833 }
    );
    
    const distance = targetCoordinates ? calculateDistance(targetCoordinates, stationCoords) : undefined;

    console.log(`🌡️ [WEATHER] Station fallback: ${parsedStationName} (${stationCode})`);
    console.log(`📍 [WEATHER] Coordonnées station: ${stationCoords.lat}, ${stationCoords.lng}`);

    return {
      name: parsedStationName,
      code: stationCode,
      country: "France", 
      commune: parsedStationName,
      elevation: "42 m",
      coordinates: stationCoords,
      distance,
      originalData: originalStation
    };
  }, [weatherData?.station, stationName, targetCoordinates]);

  console.log('WeatherVisualization - enrichedStationData:', enrichedStationData);

  // Transformation des données LEXICON vers notre format
  const processedData = useMemo(() => {
    if (!weatherData?.values) return [];
    
    return Object.entries(weatherData.values).map(([timestamp, values]: [string, any]) => {
      // Conversion du format français "jj/mm/yyyy hh:mm" vers un format ISO que JavaScript comprend
      let date;
      try {
        // Si le timestamp est au format français "17/05/2025 21:00"
        if (timestamp.includes('/') && timestamp.includes(' ')) {
          const [datePart, timePart] = timestamp.split(' ');
          const [day, month, year] = datePart.split('/');
          // Convertir vers format ISO: "2025-05-17T21:00:00"
          const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}:00`;
          date = new Date(isoString);
        } else {
          // Fallback pour d'autres formats
          date = new Date(timestamp);
        }
      } catch (error) {
        console.warn('Erreur de parsing de date:', timestamp, error);
        return null;
      }
      
      // Vérification de validité de la date
      if (isNaN(date.getTime())) {
        console.warn('Date invalide après conversion:', timestamp);
        return null;
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Format jour-mois-année pour l'affichage
      const formattedDate = `${day}-${month}-${year}`;
      
      return {
        timestamp,
        temperature: values['temperature-max'] || 0,
        humidity: values.humidity || 0,
        date: formattedDate, // Format jour-mois-année
        hour: date.getHours(),
        formattedTime: date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        fullDate: `${day}-${month}`,
        fullDateWithYear: formattedDate // Format jour-mois-année
      };
    }).filter(Boolean).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [weatherData]);

  // Affichage de toutes les données sans filtrage par période
  const filteredData = useMemo(() => {
    return processedData;
  }, [processedData]);

  // Animation temporelle
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredData.length);
    }, 200);
    
    return () => clearInterval(interval);
  }, [isPlaying, filteredData.length]);

  // Statistiques dynamiques
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const temperatures = filteredData.map(d => d.temperature);
    const humidities = filteredData.map(d => d.humidity);
    
    return {
      temperature: {
        current: temperatures[temperatures.length - 1],
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
        trend: temperatures[temperatures.length - 1] - temperatures[0]
      },
      humidity: {
        current: humidities[humidities.length - 1],
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
        trend: humidities[humidities.length - 1] - humidities[0]
      }
    };
  }, [filteredData]);

  // Couleurs dynamiques basées sur les valeurs
  const getTemperatureColor = (temp: number) => {
    if (temp > 30) return '#ff4444';
    if (temp > 20) return '#ff8844';
    if (temp > 10) return '#ffaa44';
    if (temp > 0) return '#44aaff';
    return '#4488ff';
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity > 80) return '#2563eb';
    if (humidity > 60) return '#3b82f6';
    if (humidity > 40) return '#60a5fa';
    return '#93c5fd';
  };

  // Tooltip personnalisé avec effet "wahouh"
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    if (!data) return null;
    
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl"
      >
        <div className="text-sm font-medium text-gray-800 mb-2">
          📅 {data.date} à {data.formattedTime}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <span className="text-red-600 font-bold">{data.temperature.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-blue-600 font-bold">{data.humidity.toFixed(0)}%</span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Indicateur météo dynamique
  const getWeatherIcon = (temp: number, humidity: number) => {
    if (humidity > 80 && temp < 15) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (humidity > 70) return <Cloud className="h-8 w-8 text-gray-500" />;
    if (temp > 25) return <Sun className="h-8 w-8 text-yellow-500" />;
    return <Cloud className="h-8 w-8 text-gray-400" />;
  };

  // Gestionnaires pour le modal de station
  const handleStationClick = () => {
    setIsStationModalOpen(true);
  };

  const handleOpenInNewTab = () => {
    // Pour l'instant, on garde le modal ouvert - ceci pourrait être étendu pour ouvrir une vraie nouvelle page
    window.open(window.location.href, '_blank');
  };

  if (!processedData.length || !enrichedStationData) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center">
        <p className="text-gray-600">
          {!enrichedStationData ? 'Station météorologique non trouvée' : 'Aucune donnée météorologique disponible'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats en temps réel */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Station info avec distance - maintenant cliquable */}
        <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-sky-300 group">
          <CardContent className="p-4" onClick={handleStationClick}>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="group-hover:scale-110 transition-transform duration-300"
              >
                {stats && getWeatherIcon(stats.temperature.current, stats.humidity.current)}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">Station météorologique</p>
                  <MousePointer className="h-3 w-3 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <p className="font-bold text-gray-800 group-hover:text-sky-700 transition-colors duration-300">{stationName}</p>
                
                {/* Affichage de la distance si disponible */}
                {enrichedStationData.distance && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">📍 {formatDistance(enrichedStationData.distance)}</span>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getDataQuality(enrichedStationData.distance).color }}
                      title={getDataQuality(enrichedStationData.distance).description}
                    />
                  </div>
                )}
                
                <p className="text-xs text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                  Cliquez pour voir les détails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Température actuelle */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">Température</span>
                  {stats && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {stats.temperature.trend > 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-500" /> : 
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      }
                    </motion.div>
                  )}
                </div>
                {stats && (
                  <p className="text-2xl font-bold text-red-600">
                    {stats.temperature.current.toFixed(1)}°C
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Humidité actuelle */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-gray-600">Humidité</span>
                  {stats && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    >
                      {stats.humidity.trend > 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-500" /> : 
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                      }
                    </motion.div>
                  )}
                </div>
                {stats && (
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.humidity.current.toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contrôles de métrique et animation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={activeMetric === 'temperature' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveMetric('temperature')}
            className="text-xs"
          >
            <Thermometer className="h-3 w-3 mr-1" />
            Température
          </Button>
          <Button
            variant={activeMetric === 'humidity' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveMetric('humidity')}
            className="text-xs"
          >
            <Droplets className="h-3 w-3 mr-1" />
            Humidité
          </Button>
          <Button
            variant={activeMetric === 'both' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveMetric('both')}
            className="text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            Les deux
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs"
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Animation'}
        </Button>
      </div>

      {/* Graphique principal avec effet "wahouh" */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-white via-sky-50/30 to-blue-50/30 rounded-2xl p-6 border border-sky-100 shadow-xl"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4dabf7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4dabf7" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" opacity={0.5} />
              
              <XAxis 
                dataKey="fullDateWithYear"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={Math.floor(filteredData.length / 5)}
                tickFormatter={(value) => value}
                angle={-45}
                textAnchor="end"
                height={60}
                includeHidden={false}
                type="category"
                axisLine={{ stroke: '#e0e7ff' }}
                tickLine={{ stroke: '#e0e7ff' }}
              />
              
              {(activeMetric === 'temperature' || activeMetric === 'both') && (
                <YAxis 
                  yAxisId="temperature"
                  orientation="left"
                  tick={{ fontSize: 10, fill: '#ef4444' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
              )}
              
              {/* Ligne de référence à Y=0 pour la température */}
              {(activeMetric === 'temperature' || activeMetric === 'both') && (
                <ReferenceLine yAxisId="temperature" y={0} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
              )}
              
              {(activeMetric === 'humidity' || activeMetric === 'both') && (
                <YAxis 
                  yAxisId="humidity"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#3b82f6' }}
                  domain={[0, 100]}
                />
              )}
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              
              {(activeMetric === 'temperature' || activeMetric === 'both') && (
                <Area
                  yAxisId="temperature"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ff6b6b"
                  strokeWidth={3}
                  fill="url(#temperatureGradient)"
                  dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, stroke: '#ff6b6b', strokeWidth: 2 }}
                />
              )}
              
              {(activeMetric === 'humidity' || activeMetric === 'both') && (
                <Area
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#4dabf7"
                  strokeWidth={3}
                  fill="url(#humidityGradient)"
                  dot={{ fill: '#4dabf7', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, stroke: '#4dabf7', strokeWidth: 2 }}
                />
              )}
              
              {/* Ligne de progression d'animation */}
              {isPlaying && currentIndex < filteredData.length && (
                <ReferenceLine
                  x={filteredData[currentIndex]?.formattedTime}
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="none"
                  yAxisId={activeMetric === 'humidity' ? 'humidity' : 'temperature'}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Statistiques détaillées */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-red-600">Temp. Moyenne</p>
              <p className="text-lg font-bold text-red-700">{stats.temperature.avg.toFixed(1)}°C</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-orange-600">Temp. Max</p>
              <p className="text-lg font-bold text-orange-700">{stats.temperature.max.toFixed(1)}°C</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-blue-600">Humidité Moy.</p>
              <p className="text-lg font-bold text-blue-700">{stats.humidity.avg.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-indigo-600">Humidité Max</p>
              <p className="text-lg font-bold text-indigo-700">{stats.humidity.max.toFixed(0)}%</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modal de détails de la station */}
      <WeatherStationModal
        isOpen={isStationModalOpen}
        onClose={() => setIsStationModalOpen(false)}
        stationData={enrichedStationData}
        weatherData={weatherData}
        onOpenInNewTab={handleOpenInNewTab}
        targetCoordinates={targetCoordinates}
      />
    </div>
  );
};

export default WeatherVisualization;