import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CloudRain, Thermometer, Droplets, Wind, Sun, TrendingUp, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInsightsFilters } from '@/contexts/InsightsFiltersContext';

interface WeatherOverviewDashboardProps {
  onNavigateToCalendar?: () => void;
}

export const WeatherOverviewDashboard: React.FC<WeatherOverviewDashboardProps> = ({ onNavigateToCalendar }) => {
  const { filters } = useInsightsFilters();

  const { data: weatherData, isLoading } = useQuery({
    queryKey: ['weather-overview', filters],
    queryFn: async () => {
      let query = supabase
        .from('weather_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false });

      // Apply date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange.replace('d', ''));
        if (!isNaN(days)) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          query = query.gte('snapshot_date', startDate.toISOString().split('T')[0]);
        }
      }

      const { data: snapshots } = await query;
      
      // Get marche data separately
      const { data: marches } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, region');

      // Apply additional filters on client side for now
      let filteredSnapshots = snapshots || [];

      // Filter by marches first (most restrictive)
      if (filters.marches && filters.marches.length > 0) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => 
          snapshot.marche_id && filters.marches.includes(snapshot.marche_id)
        );
      }

      // Filter by explorations (need to join with exploration_marches)
      if (filters.explorations && filters.explorations.length > 0) {
        const { data: explorationMarches } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .in('exploration_id', filters.explorations);
        
        const allowedMarcheIds = explorationMarches?.map(em => em.marche_id) || [];
        filteredSnapshots = filteredSnapshots.filter(snapshot => 
          allowedMarcheIds.includes(snapshot.marche_id)
        );
      }

      // Join with marche data and filter by regions
      return filteredSnapshots.map(snapshot => {
        const marche = marches?.find(m => m.id === snapshot.marche_id);
        
        // Filter by regions if specified
        if (filters.regions && filters.regions.length > 0) {
          if (!marche?.region || !filters.regions.includes(marche.region)) {
            return null;
          }
        }
        
        return {
          ...snapshot,
          marches: marche
        };
      }).filter(Boolean); // Remove null entries
    }
  });

  const summaryStats = useMemo(() => {
    if (!weatherData) return null;
    
    const validTemp = weatherData.filter(d => d.temperature_avg !== null);
    const validHumidity = weatherData.filter(d => d.humidity_avg !== null);
    const validPrecip = weatherData.filter(d => d.precipitation_total !== null);
    
    const avgTemp = validTemp.length > 0 
      ? validTemp.reduce((sum, item) => sum + (item.temperature_avg || 0), 0) / validTemp.length
      : 0;
    
    const avgHumidity = validHumidity.length > 0
      ? validHumidity.reduce((sum, item) => sum + (item.humidity_avg || 0), 0) / validHumidity.length
      : 0;
    
    const totalPrecip = validPrecip.reduce((sum, item) => sum + (item.precipitation_total || 0), 0);
    
    return {
      total: weatherData.length,
      avgTemp: Math.round(avgTemp * 10) / 10,
      avgHumidity: Math.round(avgHumidity),
      totalPrecip: Math.round(totalPrecip * 10) / 10,
      extremes: {
        maxTemp: Math.max(...weatherData.map(d => d.temperature_max || 0)),
        minTemp: Math.min(...weatherData.map(d => d.temperature_min || 100)),
        maxWind: Math.max(...weatherData.map(d => d.wind_speed_avg || 0))
      }
    };
  }, [weatherData]);

  const timelineData = useMemo(() => {
    if (!weatherData) return [];
    
    return weatherData
      .filter(d => d.temperature_avg !== null)
      .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
      .slice(-30) // Last 30 entries
      .map(item => ({
        date: new Date(item.snapshot_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        temperature: item.temperature_avg,
        humidity: item.humidity_avg,
        precipitation: item.precipitation_total,
        windSpeed: item.wind_speed_avg
      }));
  }, [weatherData]);

  const regionalWeather = useMemo(() => {
    if (!weatherData) return [];
    
    const grouped = weatherData.reduce((acc: Record<string, any>, item) => {
      const region = item.marches?.region || 'Non défini';
      if (!acc[region]) {
        acc[region] = { 
          region, 
          measurements: 0, 
          avgTemp: 0, 
          avgHumidity: 0, 
          totalPrecip: 0,
          tempSum: 0,
          humiditySum: 0,
          tempCount: 0,
          humidityCount: 0
        };
      }
      acc[region].measurements += 1;
      
      if (item.temperature_avg !== null) {
        acc[region].tempSum += item.temperature_avg;
        acc[region].tempCount += 1;
      }
      if (item.humidity_avg !== null) {
        acc[region].humiditySum += item.humidity_avg;
        acc[region].humidityCount += 1;
      }
      if (item.precipitation_total !== null) {
        acc[region].totalPrecip += item.precipitation_total;
      }
      
      return acc;
    }, {});
    
    return Object.values(grouped).map((region: any) => ({
      ...region,
      avgTemp: region.tempCount > 0 ? Math.round((region.tempSum / region.tempCount) * 10) / 10 : 0,
      avgHumidity: region.humidityCount > 0 ? Math.round(region.humiditySum / region.humidityCount) : 0,
      totalPrecip: Math.round(region.totalPrecip * 10) / 10
    }));
  }, [weatherData]);

  const weatherAlerts = useMemo(() => {
    if (!weatherData) return [];
    
    const alerts = [];
    const recentData = weatherData.slice(0, 7); // Last week
    
    // Temperature extremes
    const hotDays = recentData.filter(d => (d.temperature_max || 0) > 35);
    if (hotDays.length > 0) {
      alerts.push({
        type: 'high-temp',
        severity: 'warning',
        message: `${hotDays.length} jour(s) avec températures > 35°C`,
        icon: Thermometer,
        color: 'text-red-600'
      });
    }
    
    // Heavy rain
    const rainyDays = recentData.filter(d => (d.precipitation_total || 0) > 20);
    if (rainyDays.length > 0) {
      alerts.push({
        type: 'heavy-rain',
        severity: 'info',
        message: `${rainyDays.length} jour(s) avec fortes précipitations`,
        icon: CloudRain,
        color: 'text-blue-600'
      });
    }
    
    // High humidity
    const humidDays = recentData.filter(d => (d.humidity_avg || 0) > 85);
    if (humidDays.length > 0) {
      alerts.push({
        type: 'high-humidity',
        severity: 'info',
        message: `${humidDays.length} jour(s) avec humidité > 85%`,
        icon: Droplets,
        color: 'text-cyan-600'
      });
    }
    
    return alerts;
  }, [weatherData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Quick Access to Calendar */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Calendrier Météorologique Interactif
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Explorez les données météorologiques jour par jour avec des vues détaillées
                </p>
              </div>
            </div>
            <Button 
              onClick={onNavigateToCalendar}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Calendar className="w-4 h-4" />
              Voir le calendrier détaillé
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temp. Moyenne</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {summaryStats?.avgTemp}°C
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  {summaryStats?.extremes.minTemp}° - {summaryStats?.extremes.maxTemp}°
                </p>
              </div>
              <Thermometer className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Humidité Moy.</p>
                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                  {summaryStats?.avgHumidity}%
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-500">
                  Conditions moyennes
                </p>
              </div>
              <Droplets className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Précipitations</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                  {summaryStats?.totalPrecip}mm
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-500">
                  Total collecté
                </p>
              </div>
              <CloudRain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vent Max</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {Math.round(summaryStats?.extremes.maxWind || 0)}km/h
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Pic enregistré
                </p>
              </div>
              <Wind className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              Alertes Météorologiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weatherAlerts.map((alert, index) => {
                const IconComponent = alert.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <IconComponent className={`w-5 h-5 ${alert.color}`} />
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution Temporelle
            </CardTitle>
            <CardDescription>
              Température et humidité au fil du temps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="temp" orientation="left" />
                  <YAxis yAxisId="humidity" orientation="right" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    labelStyle={{
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="temp"
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Température (°C)"
                  />
                  <Line 
                    yAxisId="humidity"
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    name="Humidité (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Precipitation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="w-5 h-5" />
              Précipitations
            </CardTitle>
            <CardDescription>
              Évolution des précipitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    labelStyle={{
                      color: 'white'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="precipitation" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Analyse Régionale
          </CardTitle>
          <CardDescription>
            Comparaison météorologique par région
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalWeather}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis yAxisId="temp" orientation="left" />
                <YAxis yAxisId="precip" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar 
                  yAxisId="temp"
                  dataKey="avgTemp" 
                  fill="#EF4444" 
                  name="Temp. moy. (°C)"
                />
                <Bar 
                  yAxisId="precip"
                  dataKey="totalPrecip" 
                  fill="#3B82F6" 
                  name="Précip. (mm)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};