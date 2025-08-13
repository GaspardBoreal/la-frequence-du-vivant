import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Leaf, ArrowRight, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { useDataCollectionStats } from '../hooks/useDataCollectionStats';

const DataInsightsPromoBanner = () => {
  const navigate = useNavigate();
  const { totalCollections: totalCount, recentActivity: recentCount } = useDataCollectionStats();
  
  // Animated counters for metrics
  const totalCollections = useAnimatedCounter(totalCount, 1000, 200);
  const recentActivity = useAnimatedCounter(recentCount, 800, 400);
  
  const handleNavigateToInsights = () => {
    navigate('/admin/data-insights');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-6"
    >
      <Card className="relative overflow-hidden gaspard-glass border-accent/20">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/5 to-secondary/10" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-accent/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-primary/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
        
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Content */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20 backdrop-blur-sm">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Découvrez vos Insights
                    <Badge variant="secondary" className="text-xs">
                      <Activity className="w-3 h-3 mr-1" />
                      Nouveau
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Analysez vos données de biodiversité et météo en temps réel
                  </p>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="flex items-center gap-6">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Leaf className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">{totalCollections}</span> collectes
                  </span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">{recentActivity}</span> récentes
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Right Section - CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button 
                onClick={handleNavigateToInsights}
                className="group bg-accent/90 hover:bg-accent text-accent-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>Explorer les Insights</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </motion.div>
          </div>

          {/* Feature Pills */}
          <motion.div 
            className="flex flex-wrap gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            {[
              "Tableaux de bord interactifs",
              "Cartes géographiques",
              "Tendances temporelles"
            ].map((feature, index) => (
              <div 
                key={feature}
                className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full border border-accent/20"
              >
                {feature}
              </div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DataInsightsPromoBanner;