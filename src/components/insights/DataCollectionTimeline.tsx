import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  getValidMarcheIds, 
  filterValidSnapshots, 
  applyRegionFilter, 
  applyDateFilter 
} from '@/utils/dataIntegrityUtils';

interface DataCollectionTimelineProps {
  filters?: {
    dateRange: string;
    regions: string[];
  };
}

export const DataCollectionTimeline: React.FC<DataCollectionTimelineProps> = ({ filters }) => {
  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ['collection-timeline', filters],
    queryFn: async () => {
      // Get valid marches and snapshots
      const [validMarches, biodiversityResult, weatherResult] = await Promise.all([
        getValidMarcheIds(),
        supabase.from('biodiversity_snapshots').select(`
          snapshot_date, 
          total_species, 
          marche_id
        `).order('snapshot_date', { ascending: true }),
        supabase.from('weather_snapshots').select(`
          snapshot_date, 
          marche_id
        `).order('snapshot_date', { ascending: true })
      ]);

      // Filter out orphan snapshots first
      const validMarcheIds = new Set(validMarches.map(m => m.id));
      let biodiversityData = filterValidSnapshots(biodiversityResult.data || [], validMarcheIds);
      let weatherData = filterValidSnapshots(weatherResult.data || [], validMarcheIds);

      // Apply date filter
      if (filters?.dateRange) {
        biodiversityData = applyDateFilter(biodiversityData, filters.dateRange);
        weatherData = applyDateFilter(weatherData, filters.dateRange);
      }

      // Apply region filter
      if (filters?.regions) {
        biodiversityData = applyRegionFilter(biodiversityData, validMarches, filters.regions);
        weatherData = applyRegionFilter(weatherData, validMarches, filters.regions);
      }
      
      return {
        biodiversity: biodiversityData,
        weather: weatherData
      };
    }
  });

  const timelineData = useMemo(() => {
    if (!collectionsData || !collectionsData.biodiversity || !collectionsData.weather) return [];
    
    const dateMap = new Map();
    
    // Track unique markets per date
    collectionsData.biodiversity.forEach(item => {
      const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!dateMap.has(date)) {
        dateMap.set(date, { 
          date, 
          uniqueMarkets: new Set()
        });
      }
      dateMap.get(date).uniqueMarkets.add(item.marche_id);
    });
    
    collectionsData.weather.forEach(item => {
      const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!dateMap.has(date)) {
        dateMap.set(date, { 
          date, 
          uniqueMarkets: new Set()
        });
      }
      dateMap.get(date).uniqueMarkets.add(item.marche_id);
    });
    
    // Convert to array with market count
    return Array.from(dateMap.values())
      .map(item => ({
        date: item.date,
        marchesCollectes: item.uniqueMarkets.size
      }))
      .slice(-21); // Last 21 days
  }, [collectionsData]);

  const summaryStats = useMemo(() => {
    if (!collectionsData || !collectionsData.biodiversity || !collectionsData.weather) return null;
    
    // Calculate total unique markets
    const allUniqueMarkets = new Set();
    collectionsData.biodiversity.forEach(item => allUniqueMarkets.add(item.marche_id));
    collectionsData.weather.forEach(item => allUniqueMarkets.add(item.marche_id));
    
    // Calculate total species collected
    const totalSpecies = collectionsData.biodiversity.reduce((sum, item) => 
      sum + (item.total_species || 0), 0
    );
    
    // Calculate total weather points
    const totalWeatherPoints = collectionsData.weather.length;
    
    return {
      totalMarkets: allUniqueMarkets.size,
      totalSpecies: totalSpecies,
      totalWeatherPoints: totalWeatherPoints
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
                {summaryStats?.totalMarkets || 0}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-500">
                Marches collectées
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {summaryStats?.totalSpecies || 0}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                Espèces collectées
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {summaryStats?.totalWeatherPoints || 0}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-500">
                Points météo
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
                  formatter={(value) => [value, 'Marches collectées']}
                />
                <Legend 
                  formatter={() => 'Marches collectées'}
                />
                <Line 
                  type="monotone" 
                  dataKey="marchesCollectes" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Summary */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <Activity className="w-3 h-3" />
                {summaryStats?.totalMarkets} marches
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Activity className="w-3 h-3" />
                {summaryStats?.totalSpecies} espèces
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Total collecté
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};