import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Bird, TreePine, Bug, TrendingUp, MapPin, Calendar } from 'lucide-react';
import { useBiodiversityStats } from '@/hooks/useBiodiversityStats';
import { useBiodiversityTimeline } from '@/hooks/useBiodiversityTimeline';
import { useBiodiversityRegional } from '@/hooks/useBiodiversityRegional';
import { useBiodiversityTopSpecies } from '@/hooks/useBiodiversityTopSpecies';

export const BiodiversityOverviewDashboard: React.FC = () => {
  // Hooks optimisés avec requêtes spécialisées
  const { data: stats, isLoading: isLoadingStats } = useBiodiversityStats();
  const { data: timelineData, isLoading: isLoadingTimeline } = useBiodiversityTimeline();
  const { data: regionalData, isLoading: isLoadingRegional } = useBiodiversityRegional();
  const { data: topSpeciesData, isLoading: isLoadingTopSpecies } = useBiodiversityTopSpecies();

  const isLoading = isLoadingStats || isLoadingTimeline || isLoadingRegional || isLoadingTopSpecies;

  // Distribution des espèces memoized
  const distribution = useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: 'Oiseaux', value: stats.totalBirds, color: '#3B82F6', icon: Bird },
      { name: 'Plantes', value: stats.totalPlants, color: '#10B981', icon: TreePine },
      { name: 'Champignons', value: stats.totalFungi, color: '#F59E0B', icon: Leaf },
      { name: 'Autres', value: stats.totalOthers, color: '#8B5CF6', icon: Bug }
    ];
  }, [stats]);

  // Plus besoin de calculs côté client - données déjà optimisées depuis les hooks

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
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Total Espèces</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {stats?.totalSpecies.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Moy. {stats?.averageSpecies}/marché
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
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Collectes Effectuées</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {stats?.totalSnapshots}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  {stats?.recentCollections} cette semaine
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
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Hotspots Identifiés</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {stats?.hotspots}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500">
                  {'>'}100 espèces
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
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {distribution.map((item, index) => {
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