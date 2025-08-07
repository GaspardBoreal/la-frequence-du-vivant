import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Mountain, 
  Globe,
  Building,
  Hash,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface WeatherStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationData: any;
  weatherData: any;
  onOpenInNewTab: () => void;
}

const WeatherStationModal: React.FC<WeatherStationModalProps> = ({
  isOpen,
  onClose,
  stationData,
  weatherData,
  onOpenInNewTab
}) => {
  // Debug pour comprendre la structure des données
  console.log('WeatherStationModal - stationData:', stationData);
  console.log('WeatherStationModal - weatherData:', weatherData);
  const [expandedSections, setExpandedSections] = useState({
    location: false,
    temperature: false,
    humidity: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Traitement des données de température pour le graphique annuel
  const processYearlyData = () => {
    if (!weatherData?.values) return [];
    
    return Object.entries(weatherData.values).map(([timestamp, values]: [string, any]) => {
      const date = new Date(timestamp);
      return {
        timestamp,
        temperature: values['temperature-max'] || 0,
        humidity: values.humidity || 0,
        date: date.toLocaleDateString('fr-FR'),
        month: date.toLocaleDateString('fr-FR', { month: 'short' })
      };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const yearlyData = processYearlyData();

  // Statistiques annuelles
  const yearlyStats = yearlyData.length > 0 ? {
    temperature: {
      min: Math.min(...yearlyData.map(d => d.temperature)),
      max: Math.max(...yearlyData.map(d => d.temperature)),
      avg: yearlyData.reduce((sum, d) => sum + d.temperature, 0) / yearlyData.length
    },
    humidity: {
      min: Math.min(...yearlyData.map(d => d.humidity)),
      max: Math.max(...yearlyData.map(d => d.humidity)),
      avg: yearlyData.reduce((sum, d) => sum + d.humidity, 0) / yearlyData.length
    }
  } : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    if (!data) return null;
    
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/95 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg"
      >
        <div className="text-sm font-medium text-gray-800 mb-2">
          📅 {data.date}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Thermometer className="h-3 w-3 text-red-500" />
            <span className="text-red-600 font-medium">{data.temperature.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-3 w-3 text-blue-500" />
            <span className="text-blue-600 font-medium">{data.humidity.toFixed(0)}%</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-100">
                <Activity className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Station Météorologique</h2>
                <p className="text-sm text-gray-600">{stationData?.value || 'Station inconnue'}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Nouvel onglet
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Détails de la station */}
          <Card className="bg-white/70 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-sky-600" />
                Détails
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="font-medium">{stationData?.value || 'Non disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Code station</p>
                    <p className="font-medium">{stationData?.code || stationData?.id || '33415001'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pays</p>
                    <p className="font-medium">France</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mountain className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Élévation</p>
                    <p className="font-medium">{stationData?.elevation || '42 m'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emplacement (section pliable) */}
          <Card className="bg-white/70 backdrop-blur-sm border-green-200">
            <Collapsible
              open={expandedSections.location}
              onOpenChange={() => toggleSection('location')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-green-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Emplacement
                    </div>
                    {expandedSections.location ? 
                      <ChevronUp className="h-5 w-5" /> : 
                      <ChevronDown className="h-5 w-5" />
                    }
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Coordonnées</p>
                      <p className="font-medium">
                        {stationData?.coordinates ? 
                          `${stationData.coordinates.lat}°, ${stationData.coordinates.lng}°` : 
                          'Non disponibles'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Commune</p>
                      <p className="font-medium">ST GERVAIS</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      📍 Cette station fait partie du réseau météorologique français et fournit des données en temps réel.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Relevés de température sur la dernière année */}
          <Card className="bg-white/70 backdrop-blur-sm border-red-200">
            <Collapsible
              open={expandedSections.temperature}
              onOpenChange={() => toggleSection('temperature')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-red-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-red-600" />
                      Relevés de température sur la dernière année
                    </div>
                    {expandedSections.temperature ? 
                      <ChevronUp className="h-5 w-5" /> : 
                      <ChevronDown className="h-5 w-5" />
                    }
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {yearlyStats && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600">Minimum</p>
                        <p className="text-xl font-bold text-red-700">{yearlyStats.temperature.min.toFixed(1)}°C</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600">Moyenne</p>
                        <p className="text-xl font-bold text-orange-700">{yearlyStats.temperature.avg.toFixed(1)}°C</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-600">Maximum</p>
                        <p className="text-xl font-bold text-yellow-700">{yearlyStats.temperature.max.toFixed(1)}°C</p>
                      </div>
                    </div>
                  )}
                  
                  {yearlyData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={yearlyData}>
                          <defs>
                            <linearGradient id="temperatureYearGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                          <XAxis 
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#991b1b' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#991b1b' }}
                            domain={['dataMin - 2', 'dataMax + 2']}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="temperature"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#temperatureYearGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune donnée de température disponible</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Relevés d'humidité sur la dernière année */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <Collapsible
              open={expandedSections.humidity}
              onOpenChange={() => toggleSection('humidity')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      Relevés d'humidité sur la dernière année
                    </div>
                    {expandedSections.humidity ? 
                      <ChevronUp className="h-5 w-5" /> : 
                      <ChevronDown className="h-5 w-5" />
                    }
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {yearlyStats && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Minimum</p>
                        <p className="text-xl font-bold text-blue-700">{yearlyStats.humidity.min.toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-600">Moyenne</p>
                        <p className="text-xl font-bold text-indigo-700">{yearlyStats.humidity.avg.toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Maximum</p>
                        <p className="text-xl font-bold text-purple-700">{yearlyStats.humidity.max.toFixed(0)}%</p>
                      </div>
                    </div>
                  )}
                  
                  {yearlyData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={yearlyData}>
                          <defs>
                            <linearGradient id="humidityYearGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                          <XAxis 
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#1d4ed8' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#1d4ed8' }}
                            domain={[0, 100]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="humidity"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#humidityYearGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune donnée d'humidité disponible</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Voir aussi */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Voir aussi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button variant="outline" className="justify-start" disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  Données horaires
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ST GERVAIS
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <Activity className="h-4 w-4 mr-2" />
                  Prévisions
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                💡 Fonctionnalités supplémentaires à venir pour une exploration approfondie des données météorologiques.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeatherStationModal;