import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Download,
  Filter,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { useTerritorialAnalysis } from '@/hooks/useTerritorialAnalysis';
import { TerritorialProfileCard } from './TerritorialProfileCard';
import { MarketDensityHeatmap } from './MarketDensityHeatmap';

export const TerritorialDashboard: React.FC = () => {
  const { data: territorialData, isLoading } = useTerritorialAnalysis();
  const [selectedUserProfile, setSelectedUserProfile] = useState<'all' | 'biodiversity' | 'development' | 'planning'>('all');

  const userProfiles = {
    all: { label: 'Vue Globale', icon: Users },
    biodiversity: { label: 'Biodiversité', icon: Target },
    development: { label: 'Développement Éco.', icon: TrendingUp },
    planning: { label: 'Aménagement', icon: MapPin }
  };

  // Filtrage des données selon le profil utilisateur
  const getFilteredInsights = () => {
    if (!territorialData) return null;

    switch (selectedUserProfile) {
      case 'biodiversity':
        return {
          focus: 'Préservation et développement de la biodiversité',
          primaryMetric: 'biodiversityIndex',
          recommendations: territorialData
            .filter(region => region.biodiversityIndex < 60)
            .slice(0, 3)
        };
      case 'development':
        return {
          focus: 'Opportunités de développement économique territorial',
          primaryMetric: 'expansionPotential',
          recommendations: territorialData
            .filter(region => region.expansionPotential === 'fort')
            .slice(0, 3)
        };
      case 'planning':
        return {
          focus: 'Optimisation de l\'aménagement territorial',
          primaryMetric: 'dataMaturity',
          recommendations: territorialData
            .filter(region => region.missingDataAreas.length > 0)
            .slice(0, 3)
        };
      default:
        return {
          focus: 'Vision d\'ensemble du territoire',
          primaryMetric: 'biodiversityIndex',
          recommendations: territorialData.slice(0, 3)
        };
    }
  };

  const insights = getFilteredInsights();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!territorialData || territorialData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          Aucune donnée territoriale disponible
        </CardContent>
      </Card>
    );
  }

  const globalStats = {
    totalRegions: territorialData.length,
    averageBiodiversity: Math.round(
      territorialData.reduce((sum, region) => sum + region.biodiversityIndex, 0) / territorialData.length
    ),
    highPotentialRegions: territorialData.filter(region => region.expansionPotential === 'fort').length,
    criticalRegions: territorialData.filter(region => region.dataMaturity < 50).length
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* En-tête avec profils utilisateurs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Territorial</h2>
          <p className="text-muted-foreground">
            {insights?.focus}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Sélecteur de profil utilisateur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Perspective Métier</CardTitle>
          <CardDescription>
            Choisissez votre profil pour des insights personnalisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(userProfiles).map(([key, profile]) => {
              const IconComponent = profile.icon;
              return (
                <Button
                  key={key}
                  variant={selectedUserProfile === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedUserProfile(key as any)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4" />
                  {profile.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Régions Analysées</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {globalStats.totalRegions}
                </p>
              </div>
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Biodiversité Moy.</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {globalStats.averageBiodiversity}%
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Fort Potentiel</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {globalStats.highPotentialRegions}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Zones Critiques</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {globalStats.criticalRegions}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights personnalisés */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Insights Prioritaires - {userProfiles[selectedUserProfile].label}
            </CardTitle>
            <CardDescription>
              Recommandations basées sur votre profil métier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {insights.recommendations.map((region, index) => (
                <TerritorialProfileCard 
                  key={region.region} 
                  metrics={region} 
                  index={index} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles">Profils Régionaux</TabsTrigger>
          <TabsTrigger value="density">Analyse de Densité</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profils Territoriaux Détaillés</CardTitle>
              <CardDescription>
                Vue exhaustive de tous les territoires analysés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {territorialData.map((region, index) => (
                  <TerritorialProfileCard 
                    key={region.region} 
                    metrics={region} 
                    index={index} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="density" className="space-y-4">
          <MarketDensityHeatmap />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};