import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus
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

  const getPotentialIcon = () => {
    switch (metrics.expansionPotential) {
      case 'fort': return <TrendingUp className="w-4 h-4" />;
      case 'moyen': return <Minus className="w-4 h-4" />;
      case 'faible': return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getPotentialStyle = () => {
    switch (metrics.expansionPotential) {
      case 'fort': return 'text-green-100 bg-green-600/20 border-green-500/40';
      case 'moyen': return 'text-green-200 bg-green-700/20 border-green-600/40';
      case 'faible': return 'text-green-300 bg-green-800/20 border-green-700/40';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <Card className="relative h-full bg-gradient-to-br from-green-900/90 to-green-800/90 border-green-600/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-700/30 border border-green-600/40">
                <MapPin className="w-5 h-5 text-green-300" />
              </div>
              <CardTitle className="text-xl text-white font-semibold">
                {metrics.region}
              </CardTitle>
            </div>
            <Badge className={`${getPotentialStyle()} border text-xs px-3 py-1`}>
              {getPotentialIcon()}
              <span className="ml-1 capitalize">{metrics.expansionPotential}</span>
            </Badge>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-green-600/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">
                {animatedTotalMarkets}
              </div>
              <div className="text-xs text-gray-400">marché{animatedTotalMarkets > 1 ? 's' : ''}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">
                {animatedTotalSpecies.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">espèces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">
                {Math.round(animatedTotalObservations/1000)}k
              </div>
              <div className="text-xs text-gray-400">observations</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Simple metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Densité/marché</span>
              <div className="text-lg font-semibold text-white">
                {metrics.speciesDensity}
                <span className="text-xs text-gray-400 ml-1">esp.</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Fraîcheur</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  metrics.dataFreshness <= 7 ? 'text-green-300' :
                  metrics.dataFreshness <= 30 ? 'text-green-400' : 'text-green-500'
                }`}>
                  {metrics.dataFreshness}j
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};