import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, TrendingUp, Filter, Download, Calendar, Users, Leaf, CloudRain, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import { useDataCollectionLogs } from '@/hooks/useSnapshotData';
import { BiodiversityOverviewDashboard } from '@/components/insights/BiodiversityOverviewDashboard';
import { WeatherOverviewDashboard } from '@/components/insights/WeatherOverviewDashboard';
import { RealEstateOverviewDashboard } from '@/components/insights/RealEstateOverviewDashboard';
import { GeographicInsightsMap } from '@/components/insights/GeographicInsightsMap';
import { DataCollectionTimeline } from '@/components/insights/DataCollectionTimeline';
import { InsightsFilters } from '@/components/insights/InsightsFilters';
import { WeatherCalendarTab } from '@/components/insights/WeatherCalendarTab';
import { InsightsFiltersProvider, useInsightsFilters } from '@/contexts/InsightsFiltersContext';
import { useInsightsMetrics } from '@/hooks/useInsightsMetrics';
import { useMarketDataSync } from '@/hooks/useMarketDataSync';

const DataInsightsContent: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { filters, setFilters } = useInsightsFilters();
  const { refreshMarketData } = useMarketDataSync();

  const {
    data: logs,
    isLoading: logsLoading
  } = useDataCollectionLogs();

  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics
  } = useInsightsMetrics(filters);

  const handleRefresh = async () => {
    await refreshMarketData();
    refetchMetrics();
  };

  const getDateRangeLabel = (dateRange: string) => {
    switch (dateRange) {
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      case '90d': return '3 derniers mois';
      default: return 'Toutes les données';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <>
      <SEOHead 
        title="Analyse des Données - Insights & Visualisations"
        description="Dashboard complet d'analyse des données collectées : biodiversité, météo et immobilier avec visualisations avancées"
        keywords="analyse données, dashboard, biodiversité, météo, insights"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
        <motion.div 
          className="container mx-auto p-6 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            variants={cardVariants}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/admin/marches')}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux marches
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-accent">
                    Data Insights
                  </h1>
                  <p className="text-muted-foreground">
                    Analyse avancée des données collectées
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <InsightsFilters 
                filters={filters}
                onFiltersChange={setFilters}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleRefresh}
                disabled={metricsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${metricsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={cardVariants}
          >
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Espèces Collectées</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {metricsLoading ? '...' : metrics?.totalSpeciesCollected || 0}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Sur {getDateRangeLabel(filters.dateRange).toLowerCase()}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                    <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 cursor-pointer hover:scale-105"
              onClick={() => setActiveTab('calendar')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Points Météo</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {metricsLoading ? '...' : metrics?.totalWeatherPoints || 0}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Sur {getDateRangeLabel(filters.dateRange).toLowerCase()}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform relative">
                    <CloudRain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <Calendar className="w-3 h-3 text-blue-500 dark:text-blue-400 absolute -top-1 -right-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Total Marches</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {metricsLoading ? '...' : metrics?.totalMarches || 0}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-500">Dans la base</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                    <Home className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Marches Couvertes</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {metricsLoading ? '...' : metrics?.marchesCouvertes || 0}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-500">
                      Sur {getDateRangeLabel(filters.dateRange).toLowerCase()}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div variants={cardVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
                <TabsTrigger value="overview" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="biodiversity" className="gap-2">
                  <Leaf className="w-4 h-4" />
                  Biodiversité
                </TabsTrigger>
                <TabsTrigger value="weather" className="gap-2">
                  <CloudRain className="w-4 h-4" />
                  Météo
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendrier
                </TabsTrigger>
                <TabsTrigger value="real-estate" className="gap-2">
                  <Home className="w-4 h-4" />
                  Immobilier
                </TabsTrigger>
                <TabsTrigger value="geographic" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Géographique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DataCollectionTimeline filters={filters} />
                  <GeographicInsightsMap filters={filters} />
                </div>
              </TabsContent>

              <TabsContent value="biodiversity" className="space-y-6">
                <BiodiversityOverviewDashboard />
              </TabsContent>

              <TabsContent value="weather" className="space-y-6">
                <WeatherOverviewDashboard 
                  onNavigateToCalendar={() => setActiveTab('calendar')}
                />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <WeatherCalendarTab 
                  onOpenFullCalendar={() => window.open('/meteo-historique', '_blank')}
                />
              </TabsContent>

              <TabsContent value="real-estate" className="space-y-6">
                <RealEstateOverviewDashboard />
              </TabsContent>

              <TabsContent value="geographic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Analyse Géographique Détaillée
                    </CardTitle>
                    <CardDescription>
                      Visualisation spatiale des données collectées avec analyses de corrélations géographiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <GeographicInsightsMap detailed filters={filters} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

const DataInsights: React.FC = () => {
  return (
    <InsightsFiltersProvider>
      <DataInsightsContent />
    </InsightsFiltersProvider>
  );
};

export default DataInsights;