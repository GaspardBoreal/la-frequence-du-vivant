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
      gradient: "from-blue-400 via-purple-500 to-pink-500",
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
            {/* Conteneur principal avec effet de verre sophistiqué */}
            <div className="relative bg-gradient-to-br from-background/70 via-background/50 to-background/30 backdrop-blur-xl border border-gaspard-primary/20 rounded-2xl p-6 transition-all duration-700 hover:scale-110 hover:shadow-2xl hover:shadow-gaspard-primary/30 hover:border-gaspard-primary/50 hover:bg-gradient-to-br hover:from-background/80 hover:via-background/60 hover:to-background/40 group-hover:backdrop-blur-2xl">
              
              {/* Effet de lumière interne au hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gaspard-primary/0 via-gaspard-primary/0 to-gaspard-primary/0 group-hover:from-gaspard-primary/10 group-hover:via-gaspard-accent/5 group-hover:to-gaspard-secondary/8 transition-all duration-1000 pointer-events-none"></div>
              
              {/* Particules flottantes évoluées au hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000">
                <div className="absolute top-2 right-2 w-1 h-1 bg-gaspard-accent/60 rounded-full animate-gentle-float group-hover:bg-gaspard-accent group-hover:w-1.5 group-hover:h-1.5 transition-all duration-500"></div>
                <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-gaspard-primary/50 rounded-full animate-gentle-float animation-delay-500 group-hover:bg-gaspard-primary group-hover:w-1 group-hover:h-1 transition-all duration-700"></div>
                
                {/* Effet de vague lumineuse */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gaspard-primary/15 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1200 ease-out"></div>
              </div>

              {/* Header avec icône évolutive */}
              <div className="flex items-center justify-between mb-4 group-hover:mb-5 transition-all duration-300">
                <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.gradient} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className={`h-5 w-5 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent animate-soft-pulse group-hover:animate-gentle-float group-hover:scale-110 transition-all duration-500`} />
                </div>
                <div className="w-8 h-1 bg-gradient-to-r from-transparent via-gaspard-primary/30 to-transparent rounded-full group-hover:w-12 group-hover:via-gaspard-primary/50 transition-all duration-500"></div>
              </div>

              {/* Valeur principale avec animation sophistiquée */}
              <div className="mb-2 group-hover:mb-3 transition-all duration-300">
                <span className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent tabular-nums group-hover:text-4xl transition-all duration-500 inline-block group-hover:scale-105`}>
                  {stat.value}
                </span>
              </div>

              {/* Label principal évolutif */}
              <h3 className="gaspard-category text-sm font-medium text-gaspard-primary mb-1 group-hover:text-gaspard-accent transition-colors duration-500">
                {stat.label}
              </h3>

              {/* Description poétique enrichie */}
              <p className="text-xs text-gaspard-muted/70 font-light leading-relaxed group-hover:text-gaspard-muted transition-colors duration-500">
                {stat.description}
              </p>

              {/* Forme décorative évolutive en arrière-plan */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 opacity-5 group-hover:opacity-15 pointer-events-none transition-all duration-1000 group-hover:scale-125 group-hover:-rotate-12">
                <div className={`w-full h-full rounded-full bg-gradient-to-tr ${stat.gradient} animate-soft-pulse group-hover:animate-gentle-float`}></div>
              </div>

              {/* Lignes décoratives animées sophistiquées */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gaspard-primary/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
              <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-gaspard-accent/15 to-transparent transform scale-y-0 group-hover:scale-y-100 transition-transform duration-900 delay-200"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PoeticStatsGrid;