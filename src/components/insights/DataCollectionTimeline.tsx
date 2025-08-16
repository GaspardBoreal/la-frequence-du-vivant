import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const DataCollectionTimeline: React.FC = () => {
  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ['collection-timeline'],
    queryFn: async () => {
      const [biodiversityData, weatherData] = await Promise.all([
        supabase
          .from('biodiversity_snapshots')
          .select('snapshot_date, total_species')
          .order('snapshot_date', { ascending: true }),
        supabase
          .from('weather_snapshots')
          .select('snapshot_date, temperature_avg')
          .order('snapshot_date', { ascending: true })
      ]);
      
      return {
        biodiversity: biodiversityData.data || [],
        weather: weatherData.data || []
      };
    }
  });

  const timelineData = useMemo(() => {
    if (!collectionsData) return [];
    
    const dateMap = new Map();
    
    // Process biodiversity data
    collectionsData.biodiversity.forEach(item => {
      const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!dateMap.has(date)) {
        dateMap.set(date, { 
          date, 
          biodiversityCollections: 0, 
          weatherCollections: 0,
          totalSpecies: 0,
          speciesCount: 0
        });
      }
      const entry = dateMap.get(date);
      entry.biodiversityCollections += 1;
      entry.totalSpecies += item.total_species || 0;
      entry.speciesCount += 1;
    });
    
    // Process weather data
    collectionsData.weather.forEach(item => {
      const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!dateMap.has(date)) {
        dateMap.set(date, { 
          date, 
          biodiversityCollections: 0, 
          weatherCollections: 0,
          totalSpecies: 0,
          speciesCount: 0
        });
      }
      const entry = dateMap.get(date);
      entry.weatherCollections += 1;
    });
    
    // Convert to array and calculate averages
    return Array.from(dateMap.values())
      .map(item => ({
        ...item,
        avgSpeciesPerCollection: item.speciesCount > 0 ? Math.round(item.totalSpecies / item.speciesCount) : 0
      }))
      .slice(-21); // Last 21 days
  }, [collectionsData]);

  const summaryStats = useMemo(() => {
    if (!collectionsData) return null;
    
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentBio = collectionsData.biodiversity.filter(item => 
      new Date(item.snapshot_date) > last7Days
    ).length;
    
    const recentWeather = collectionsData.weather.filter(item => 
      new Date(item.snapshot_date) > last7Days
    ).length;
    
    const monthlyBio = collectionsData.biodiversity.filter(item => 
      new Date(item.snapshot_date) > last30Days
    ).length;
    
    const monthlyWeather = collectionsData.weather.filter(item => 
      new Date(item.snapshot_date) > last30Days
    ).length;
    
    return {
      weekly: {
        biodiversity: recentBio,
        weather: recentWeather,
        total: recentBio + recentWeather
      },
      monthly: {
        biodiversity: monthlyBio,
        weather: monthlyWeather,
        total: monthlyBio + monthlyWeather
      },
      total: {
        biodiversity: collectionsData.biodiversity.length,
        weather: collectionsData.weather.length,
        overall: collectionsData.biodiversity.length + collectionsData.weather.length
      }
    };
  }, [collectionsData]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-80 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline des Collectes
          </CardTitle>
          <CardDescription>
            Évolution des collectes de données au fil du temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {summaryStats?.weekly.total || 0}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-500">
                Cette semaine
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {summaryStats?.monthly.total || 0}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                Ce mois
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {summaryStats?.total.overall || 0}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-500">
                Total
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
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
                  formatter={(value, name) => [
                    value,
                    name === 'biodiversityCollections' ? 'Biodiversité' :
                    name === 'weatherCollections' ? 'Météo' : 'Esp. moy.'
                  ]}
                />
                <Legend 
                  formatter={(value) => 
                    value === 'biodiversityCollections' ? 'Collectes Biodiversité' :
                    value === 'weatherCollections' ? 'Collectes Météo' : 'Espèces Moy.'
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="biodiversityCollections" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weatherCollections" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSpeciesPerCollection" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Summary */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <Activity className="w-3 h-3" />
                {summaryStats?.weekly.biodiversity} bio
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Activity className="w-3 h-3" />
                {summaryStats?.weekly.weather} météo
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Dernière semaine
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};