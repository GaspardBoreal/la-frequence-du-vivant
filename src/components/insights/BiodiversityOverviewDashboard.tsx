import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Bird, TreePine, Bug, TrendingUp, MapPin, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const BiodiversityOverviewDashboard: React.FC = () => {
  const { data: biodiversityData, isLoading } = useQuery({
    queryKey: ['biodiversity-overview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select(`
          *,
          marches!inner(nom_marche, ville, region, latitude, longitude)
        `)
        .order('created_at', { ascending: false });
      return data;
    }
  });

  const { data: topSpeciesData } = useQuery({
    queryKey: ['top-species'],
    queryFn: async () => {
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .not('species_data', 'is', null);
      
      const speciesCount: Record<string, number> = {};
      data?.forEach(snapshot => {
        if (snapshot.species_data && Array.isArray(snapshot.species_data)) {
          snapshot.species_data.forEach((species: any) => {
            const key = species.commonName || species.scientificName;
            speciesCount[key] = (speciesCount[key] || 0) + 1;
          });
        }
      });
      
      return Object.entries(speciesCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
    }
  });

  const summaryStats = useMemo(() => {
    if (!biodiversityData) return null;
    
    const total = biodiversityData.length;
    const totalSpecies = biodiversityData.reduce((sum, item) => sum + (item.total_species || 0), 0);
    const totalBirds = biodiversityData.reduce((sum, item) => sum + (item.birds_count || 0), 0);
    const totalPlants = biodiversityData.reduce((sum, item) => sum + (item.plants_count || 0), 0);
    const totalFungi = biodiversityData.reduce((sum, item) => sum + (item.fungi_count || 0), 0);
    const totalOthers = biodiversityData.reduce((sum, item) => sum + (item.others_count || 0), 0);
    
    return {
      total,
      totalSpecies,
      averageSpecies: total > 0 ? Math.round(totalSpecies / total) : 0,
      distribution: [
        { name: 'Oiseaux', value: totalBirds, color: '#3B82F6', icon: Bird },
        { name: 'Plantes', value: totalPlants, color: '#10B981', icon: TreePine },
        { name: 'Champignons', value: totalFungi, color: '#F59E0B', icon: Leaf },
        { name: 'Autres', value: totalOthers, color: '#8B5CF6', icon: Bug }
      ]
    };
  }, [biodiversityData]);

  const timelineData = useMemo(() => {
    if (!biodiversityData) return [];
    
    const grouped = biodiversityData.reduce((acc: Record<string, any>, item) => {
      const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, species: 0, count: 0 };
      }
      acc[date].species += item.total_species || 0;
      acc[date].count += 1;
      return acc;
    }, {});
    
    return Object.values(grouped)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  }, [biodiversityData]);

  const regionalData = useMemo(() => {
    if (!biodiversityData) return [];
    
    const grouped = biodiversityData.reduce((acc: Record<string, any>, item) => {
      const region = item.marches?.region || 'Non défini';
      if (!acc[region]) {
        acc[region] = { region, species: 0, marches: 0, observations: 0 };
      }
      acc[region].species += item.total_species || 0;
      acc[region].marches += 1;
      acc[region].observations += item.recent_observations || 0;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a: any, b: any) => b.species - a.species);
  }, [biodiversityData]);

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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Espèces</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {summaryStats?.totalSpecies.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Moy. {summaryStats?.averageSpecies}/marché
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collectes Effectuées</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {summaryStats?.total}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  {biodiversityData?.filter(d => 
                    new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length} cette semaine
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hotspots Identifiés</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {biodiversityData?.filter(d => (d.total_species || 0) > 100).length}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500">
                  >100 espèces
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              Distribution des Espèces
            </CardTitle>
            <CardDescription>
              Répartition par catégories taxonomiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summaryStats?.distribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {summaryStats?.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {summaryStats?.distribution.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-sm">{item.name}: {item.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution Temporelle
            </CardTitle>
            <CardDescription>
              Nombre d'espèces collectées par jour (14 derniers jours)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="species" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Analysis & Top Species */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Analyse Régionale
            </CardTitle>
            <CardDescription>
              Biodiversité par région
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="region" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="species" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Species */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bird className="w-5 h-5" />
              Top Espèces Observées
            </CardTitle>
            <CardDescription>
              Les 10 espèces les plus fréquemment observées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSpeciesData?.map((species, index) => (
                <motion.div
                  key={species.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-sm">{species.name}</span>
                  </div>
                  <Badge>{species.count} obs.</Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};