import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';
import { TerritorialMetrics } from '@/hooks/useTerritorialAnalysis';

interface TerritorialProfileCardProps {
  metrics: TerritorialMetrics;
  index: number;
}

export const TerritorialProfileCard: React.FC<TerritorialProfileCardProps> = ({ metrics, index }) => {
  const getPotentialIcon = () => {
    switch (metrics.expansionPotential) {
      case 'fort': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'moyen': return <Minus className="w-4 h-4 text-yellow-600" />;
      case 'faible': return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const getPotentialColor = () => {
    switch (metrics.expansionPotential) {
      case 'fort': return 'text-green-600 bg-green-50 border-green-200';
      case 'moyen': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'faible': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getMaturityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              {metrics.region}
            </CardTitle>
            <Badge className={`${getPotentialColor()} border`}>
              {getPotentialIcon()}
              {metrics.expansionPotential}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            {metrics.totalMarkets} marche{metrics.totalMarkets > 1 ? 's' : ''} • 
            {metrics.totalSpecies.toLocaleString()} espèces • 
            {metrics.totalObservations.toLocaleString()} observations
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Indicateurs clés */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Index Biodiversité</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metrics.biodiversityIndex} className="flex-1 h-2" />
                <span className="text-sm font-bold text-blue-600">
                  {metrics.biodiversityIndex}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Maturité Données</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metrics.dataMaturity} className="flex-1 h-2" />
                <span className={`text-sm font-bold ${getMaturityColor(metrics.dataMaturity)}`}>
                  {metrics.dataMaturity}%
                </span>
              </div>
            </div>
          </div>

          {/* Métriques détaillées */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Densité espèces/marche</span>
              <span className="text-lg font-bold text-primary">
                {metrics.speciesDensity}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Fraîcheur données</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={`text-sm font-medium ${
                  metrics.dataFreshness <= 7 ? 'text-green-600' :
                  metrics.dataFreshness <= 30 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.dataFreshness}j
                </span>
              </div>
            </div>
          </div>

          {/* Actions recommandées */}
          {metrics.recommendedActions.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Actions prioritaires</span>
              </div>
              <div className="space-y-1">
                {metrics.recommendedActions.slice(0, 2).map((action, actionIndex) => (
                  <div key={actionIndex} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2" />
                    <span className="text-xs text-muted-foreground leading-tight">
                      {action}
                    </span>
                  </div>
                ))}
                {metrics.recommendedActions.length > 2 && (
                  <div className="text-xs text-muted-foreground font-medium">
                    +{metrics.recommendedActions.length - 2} autre{metrics.recommendedActions.length > 3 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alertes zones manquantes */}
          {metrics.missingDataAreas.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">Zones à améliorer</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {metrics.missingDataAreas.map((area, areaIndex) => (
                  <Badge 
                    key={areaIndex} 
                    variant="outline" 
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};