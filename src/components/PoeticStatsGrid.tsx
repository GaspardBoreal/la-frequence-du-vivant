import React from 'react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { Sparkles, Sprout, Globe, TrendingUp } from 'lucide-react';

interface PoeticStatsGridProps {
  explorations?: Array<{
    published: boolean;
    created_at: string;
  }>;
}

const PoeticStatsGrid: React.FC<PoeticStatsGridProps> = ({ explorations = [] }) => {
  const total = explorations.length;
  const published = explorations.filter(e => e.published).length;
  const drafts = explorations.filter(e => !e.published).length;
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = explorations.filter(e => new Date(e.created_at) > weekAgo).length;

  const animatedTotal = useAnimatedCounter(total, 1000, 0);
  const animatedPublished = useAnimatedCounter(published, 1000, 200);
  const animatedDrafts = useAnimatedCounter(drafts, 1000, 400);
  const animatedThisWeek = useAnimatedCounter(thisWeek, 1000, 600);

  const stats = [
    {
      label: "Univers Créés",
      value: animatedTotal,
      icon: Sparkles,
      gradient: "from-gaspard-primary via-gaspard-secondary to-gaspard-accent",
      description: "Explorations tissées"
    },
    {
      label: "Mondes Révélés",
      value: animatedPublished,
      icon: Globe,
      gradient: "from-emerald-400 via-green-500 to-teal-500",
      description: "Lumières partagées"
    },
    {
      label: "Germes Cachés",
      value: animatedDrafts,
      icon: Sprout,
      gradient: "from-amber-400 via-orange-500 to-red-500",
      description: "Potentiels en devenir"
    },
    {
      label: "Naissances Récentes",
      value: animatedThisWeek,
      icon: TrendingUp,
      gradient: "from-blue-400 via-purple-500 to-pink-500",
      description: "Éclosions de la semaine"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group relative overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* Conteneur principal avec effet de verre */}
            <div className="relative bg-gradient-to-br from-background/70 via-background/50 to-background/30 backdrop-blur-xl border border-gaspard-primary/20 rounded-2xl p-6 transition-all duration-700 hover:scale-105 hover:shadow-xl hover:shadow-gaspard-primary/20 hover:border-gaspard-primary/40">
              
              {/* Particules flottantes au hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="absolute top-2 right-2 w-1 h-1 bg-gaspard-accent/60 rounded-full animate-gentle-float"></div>
                <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-gaspard-primary/50 rounded-full animate-gentle-float animation-delay-500"></div>
              </div>

              {/* Header avec icône */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.gradient} bg-opacity-20`}>
                  <Icon className={`h-5 w-5 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent animate-soft-pulse`} />
                </div>
                <div className="w-8 h-1 bg-gradient-to-r from-transparent via-gaspard-primary/30 to-transparent rounded-full"></div>
              </div>

              {/* Valeur principale avec animation */}
              <div className="mb-2">
                <span className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent tabular-nums`}>
                  {stat.value}
                </span>
              </div>

              {/* Label principal */}
              <h3 className="gaspard-category text-sm font-medium text-gaspard-primary mb-1">
                {stat.label}
              </h3>

              {/* Description poétique */}
              <p className="text-xs text-gaspard-muted/70 font-light leading-relaxed">
                {stat.description}
              </p>

              {/* Forme décorative en arrière-plan */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 opacity-5 pointer-events-none">
                <div className={`w-full h-full rounded-full bg-gradient-to-tr ${stat.gradient} animate-soft-pulse`}></div>
              </div>

              {/* Ligne décorative animée */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gaspard-primary/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PoeticStatsGrid;