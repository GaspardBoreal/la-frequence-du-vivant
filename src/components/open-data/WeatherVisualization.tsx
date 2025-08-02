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
  Activity
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

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
}

const WeatherVisualization: React.FC<WeatherVisualizationProps> = ({ 
  weatherData, 
  stationName 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [activeMetric, setActiveMetric] = useState<'both' | 'temperature' | 'humidity'>('both');
  const [hoveredPoint, setHoveredPoint] = useState<WeatherDataPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Transformation des données LEXICON vers notre format
  const processedData = useMemo(() => {
    if (!weatherData?.values) return [];
    
    return Object.entries(weatherData.values).map(([timestamp, values]: [string, any]) => {
      const date = new Date(timestamp);
      return {
        timestamp,
        temperature: values['temperature-max'] || 0,
        humidity: values.humidity || 0,
        date: date.toLocaleDateString(),
        hour: date.getHours(),
        formattedTime: date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [weatherData]);

  // Filtrage par période
  const filteredData = useMemo(() => {
    const now = new Date();
    const periods = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    const cutoff = now.getTime() - periods[selectedPeriod];
    return processedData.filter(point => 
      new Date(point.timestamp).getTime() >= cutoff
    );
  }, [processedData, selectedPeriod]);

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

  if (!processedData.length) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center">
        <p className="text-gray-600">Aucune donnée météorologique disponible</p>
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
        {/* Station info */}
        <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {stats && getWeatherIcon(stats.temperature.current, stats.humidity.current)}
              </motion.div>
              <div>
                <p className="text-sm text-gray-600">Station météorologique</p>
                <p className="font-bold text-gray-800">{stationName}</p>
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

      {/* Contrôles interactifs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['24h', '7d', '30d', 'all'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="text-xs"
            >
              {period === 'all' ? 'Tout' : period}
            </Button>
          ))}
        </div>
        
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
                dataKey="formattedTime"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval="preserveStartEnd"
              />
              
              {(activeMetric === 'temperature' || activeMetric === 'both') && (
                <YAxis 
                  yAxisId="temperature"
                  orientation="left"
                  tick={{ fontSize: 10, fill: '#ef4444' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
              )}
              
              {(activeMetric === 'humidity' || activeMetric === 'both') && (
                <YAxis 
                  yAxisId="humidity"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#3b82f6' }}
                  domain={[0, 100]}
                />
              )}
              
              <Tooltip content={<CustomTooltip />} />
              
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
    </div>
  );
};

export default WeatherVisualization;