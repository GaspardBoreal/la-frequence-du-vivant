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
  BarChart3,
  Leaf,
  Sparkles
} from 'lucide-react';
import { TerritorialMetrics } from '@/hooks/useTerritorialAnalysis';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface TerritorialProfileCardProps {
  metrics: TerritorialMetrics;
  index: number;
}

export const TerritorialProfileCard: React.FC<TerritorialProfileCardProps> = ({ metrics, index }) => {
  // Animated counters for key metrics
  const animatedTotalMarkets = useAnimatedCounter(metrics.totalMarkets, 1200, index * 100);
  const animatedTotalSpecies = useAnimatedCounter(metrics.totalSpecies, 1500, index * 100 + 200);
  const animatedTotalObservations = useAnimatedCounter(metrics.totalObservations, 1800, index * 100 + 400);
  const animatedBiodiversityIndex = useAnimatedCounter(metrics.biodiversityIndex, 1000, index * 100 + 600);
  const animatedDataMaturity = useAnimatedCounter(metrics.dataMaturity, 1000, index * 100 + 800);

  const getPotentialIcon = () => {
    switch (metrics.expansionPotential) {
      case 'fort': return <TrendingUp className="w-4 h-4" />;
      case 'moyen': return <Minus className="w-4 h-4" />;
      case 'faible': return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getPotentialStyle = () => {
    switch (metrics.expansionPotential) {
      case 'fort': return 'text-accent bg-accent/10 border-accent/30';
      case 'moyen': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'faible': return 'text-red-400 bg-red-400/10 border-red-400/30';
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'from-accent/80 to-accent';
    if (value >= 60) return 'from-amber-400/80 to-amber-400';
    return 'from-red-400/80 to-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.12,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }}
      className="group"
    >
      <Card className="relative h-full overflow-hidden gaspard-glass hover:bg-card/50 transition-all duration-500 border-border/40 hover:border-accent/30">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating decorative element */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <Leaf className="w-6 h-6 text-accent animate-gentle-float" />
        </div>

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="font-crimson text-xl text-foreground font-semibold leading-tight">
                  {metrics.region}
                </CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3 text-accent/60" />
                  <span className="text-xs font-inter text-muted-foreground uppercase tracking-wider">
                    Territoire vivant
                  </span>
                </div>
              </div>
            </div>
            <Badge className={`${getPotentialStyle()} border font-inter text-xs px-3 py-1`}>
              {getPotentialIcon()}
              <span className="ml-1 capitalize">{metrics.expansionPotential}</span>
            </Badge>
          </div>

          {/* Key figures with animated counters */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/30">
            <div className="text-center">
              <div className="font-crimson text-2xl font-semibold text-accent">
                {animatedTotalMarkets}
              </div>
              <div className="text-xs font-inter text-muted-foreground">marché{animatedTotalMarkets > 1 ? 's' : ''}</div>
            </div>
            <div className="text-center">
              <div className="font-crimson text-2xl font-semibold text-accent">
                {animatedTotalSpecies.toLocaleString()}
              </div>
              <div className="text-xs font-inter text-muted-foreground">espèces</div>
            </div>
            <div className="text-center">
              <div className="font-crimson text-2xl font-semibold text-accent">
                {Math.round(animatedTotalObservations/1000)}k
              </div>
              <div className="text-xs font-inter text-muted-foreground">observations</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 relative z-10">
          {/* Enhanced biodiversity indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                <span className="text-sm font-inter font-medium text-foreground">Index Biodiversité</span>
              </div>
              <div className="space-y-2">
                <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(metrics.biodiversityIndex)} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedBiodiversityIndex}%` }}
                    transition={{ delay: index * 0.1 + 0.8, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-gentle" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-inter text-muted-foreground">Richesse</span>
                  <span className="text-sm font-crimson font-semibold text-accent">
                    {animatedBiodiversityIndex}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm font-inter font-medium text-foreground">Maturité Données</span>
              </div>
              <div className="space-y-2">
                <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(metrics.dataMaturity)} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedDataMaturity}%` }}
                    transition={{ delay: index * 0.1 + 1.0, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-gentle" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-inter text-muted-foreground">Complétude</span>
                  <span className="text-sm font-crimson font-semibold text-accent">
                    {animatedDataMaturity}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Refined metrics */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/30">
            <div className="space-y-1">
              <span className="text-xs font-inter text-muted-foreground uppercase tracking-wide">Densité/marché</span>
              <div className="font-crimson text-lg font-semibold text-foreground">
                {metrics.speciesDensity}
                <span className="text-xs font-inter text-muted-foreground ml-1">esp.</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-inter text-muted-foreground uppercase tracking-wide">Fraîcheur</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={`text-sm font-inter font-semibold ${
                  metrics.dataFreshness <= 7 ? 'text-accent' :
                  metrics.dataFreshness <= 30 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {metrics.dataFreshness}j
                </span>
              </div>
            </div>
          </div>

          {/* Elegant action items */}
          {metrics.recommendedActions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-sm font-inter font-medium text-foreground">Actions prioritaires</span>
              </div>
              <div className="space-y-2">
                {metrics.recommendedActions.slice(0, 2).map((action, actionIndex) => (
                  <div key={actionIndex} className="flex items-start gap-3 group/action">
                    <div className="w-2 h-2 rounded-full bg-accent/60 mt-1.5 group-hover/action:bg-accent transition-colors duration-200" />
                    <span className="text-xs font-inter text-muted-foreground leading-relaxed group-hover/action:text-foreground transition-colors duration-200">
                      {action}
                    </span>
                  </div>
                ))}
                {metrics.recommendedActions.length > 2 && (
                  <div className="text-xs font-inter text-muted-foreground font-medium pl-5">
                    +{metrics.recommendedActions.length - 2} autre{metrics.recommendedActions.length > 3 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Missing areas with refined styling */}
          {metrics.missingDataAreas.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-inter font-medium text-foreground">Zones d'amélioration</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {metrics.missingDataAreas.map((area, areaIndex) => (
                  <Badge 
                    key={areaIndex} 
                    variant="outline" 
                    className="text-xs font-inter bg-amber-400/10 text-amber-600 border-amber-400/30 hover:bg-amber-400/20 transition-colors duration-200"
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