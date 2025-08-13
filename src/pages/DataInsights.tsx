import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, TrendingUp, Filter, Download, Calendar, Users, Leaf, CloudRain, Home } from 'lucide-react';
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

const DataInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    dateRange: '30d',
    regions: [],
    dataTypes: ['biodiversity', 'weather', 'real_estate']
  });

  const {
    data: logs,
    isLoading
  } = useDataCollectionLogs();

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
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Total Biodiversité</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">71</p>
                    <p className="text-xs text-green-600 dark:text-green-500">+12% ce mois</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                    <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Données Météo</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">37</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">+8% ce mois</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                    <CloudRain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Immobilier</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">0</p>
                    <p className="text-xs text-purple-600 dark:text-purple-500">En attente</p>
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
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">21</p>
                    <p className="text-xs text-orange-600 dark:text-orange-500">Couverture complète</p>
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
              <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
                  <DataCollectionTimeline />
                  <GeographicInsightsMap />
                </div>
              </TabsContent>

              <TabsContent value="biodiversity" className="space-y-6">
                <BiodiversityOverviewDashboard />
              </TabsContent>

              <TabsContent value="weather" className="space-y-6">
                <WeatherOverviewDashboard />
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
                      <GeographicInsightsMap detailed />
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

export default DataInsights;