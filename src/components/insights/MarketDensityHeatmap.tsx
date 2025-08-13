import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  MapPin,
  Zap,
  Users,
  BarChart3
} from 'lucide-react';
import { useMarketDensityAnalysis } from '@/hooks/useMarketDensityAnalysis';

export const MarketDensityHeatmap: React.FC = () => {
  const { data, isLoading } = useMarketDensityAnalysis();

  const strategicInsights = useMemo(() => {
    if (!data) return null;

    const { marketPoints, heatmapZones, territorialGaps } = data;
    
    // Zones haute densité (>= 5 marchés)
    const highDensityZones = heatmapZones.filter(zone => zone.marketCount >= 5);
    
    // Marchés stratégiques (forte valeur + faible proximité = expansion potential)
    const strategicMarkets = marketPoints
      .filter(market => market.strategicValue >= 70 && market.expansionSuitability >= 60)
      .sort((a, b) => b.strategicValue - a.strategicValue)
      .slice(0, 5);
    
    // Marchés isolés nécessitant du soutien
    const isolatedMarkets = marketPoints.filter(market => market.isolationLevel === 'fort');
    
    return {
      highDensityZones,
      strategicMarkets,
      isolatedMarkets,
      criticalGaps: territorialGaps.filter(gap => gap.priority === 'haute')
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !strategicInsights) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucune donnée de densité disponible
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'développer': return <TrendingUp className="w-4 h-4" />;
      case 'optimiser': return <Zap className="w-4 h-4" />;
      case 'maintenir': return <BarChart3 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'développer': return 'text-green-600 bg-green-50 border-green-200';
      case 'optimiser': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'maintenir': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble stratégique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Zones Denses</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {strategicInsights.highDensityZones.length}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  ≥5 marchés/zone
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Marchés Stratégiques</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {strategicInsights.strategicMarkets.length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Fort potentiel
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Lacunes Critiques</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {strategicInsights.criticalGaps.length}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-500">
                  Priorité haute
                </p>
              </div>
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones de densité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Analyse de Densité Territoriale
          </CardTitle>
          <CardDescription>
            Répartition et recommandations par zone géographique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.heatmapZones
              .sort((a, b) => b.intensity - a.intensity)
              .slice(0, 8)
              .map((zone, index) => (
                <motion.div
                  key={`zone-${zone.bounds.south}-${zone.bounds.west}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-8 h-8 rounded-full border-2"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${zone.intensity})`,
                          borderColor: zone.intensity > 0.7 ? '#3B82F6' : '#94A3B8'
                        }}
                      />
                      <span className="text-xs font-medium mt-1">
                        {Math.round(zone.intensity * 100)}%
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          Zone {zone.bounds.south.toFixed(1)}°N - {zone.bounds.west.toFixed(1)}°E
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{zone.marketCount} marché{zone.marketCount > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{zone.avgBiodiversity} esp./marché</span>
                      </div>
                    </div>
                  </div>

                  <Badge className={`${getActionColor(zone.recommendedAction)} border`}>
                    {getActionIcon(zone.recommendedAction)}
                    {zone.recommendedAction}
                  </Badge>
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Marchés stratégiques */}
      {strategicInsights.strategicMarkets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Marchés à Fort Potentiel Stratégique
            </CardTitle>
            <CardDescription>
              Marchés performants avec opportunités d'expansion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicInsights.strategicMarkets.map((market, index) => (
                <motion.div
                  key={`strategic-${market.lat}-${market.lng}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{market.region}</span>
                        <Badge variant="outline" className="text-xs">
                          {market.speciesRichness} espèces
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valeur stratégique: {market.strategicValue}% • 
                        Potentiel expansion: {market.expansionSuitability}%
                      </div>
                    </div>
                  </div>

                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Priorité
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lacunes territoriales critiques */}
      {strategicInsights.criticalGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Lacunes Territoriales Critiques
            </CardTitle>
            <CardDescription>
              Zones nécessitant une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicInsights.criticalGaps.map((gap, index) => (
                <motion.div
                  key={`gap-${gap.region}-${gap.gapType}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{gap.region}</span>
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                        {gap.gapType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {gap.description}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {gap.priority}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};