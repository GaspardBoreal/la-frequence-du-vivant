import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Leaf, Camera, MapPin, Database, ExternalLink, Sparkles } from 'lucide-react';
import { useBiodiversityStats } from '@/hooks/useBiodiversityStats';
import { useRegionsCount } from '@/hooks/useRegionalCoverage';
import { usePhotosCount } from '@/hooks/usePhotosCount';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number;
  isInView: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  target, 
  suffix = '', 
  duration = 2,
  isInView 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, isInView]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return num.toLocaleString('fr-FR');
  };

  return <span>{formatNumber(count)}{suffix}</span>;
};

interface ProofBarProps {
  className?: string;
}

const ProofBar: React.FC<ProofBarProps> = ({ className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const { data: stats } = useBiodiversityStats();
  const { data: regionsCount } = useRegionsCount();
  const { data: photosCount } = usePhotosCount();
  
  // Count marches
  const { data: marchesCount } = useQuery({
    queryKey: ['marches-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('marches')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 30,
  });

  const metrics = [
    { 
      icon: <MapPin className="w-4 h-4" />, 
      value: marchesCount || 32, 
      label: 'Marches',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    { 
      icon: <Leaf className="w-4 h-4" />, 
      value: stats?.totalSpecies || 41257, 
      label: 'Espèces',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      value: regionsCount || 6, 
      label: 'Régions',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    { 
      icon: <Camera className="w-4 h-4" />, 
      value: photosCount || 241, 
      label: 'Preuves',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={`py-8 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`relative overflow-hidden rounded-xl ${metric.bgColor} border ${metric.borderColor} p-4 text-center`}
            >
              {/* Background glow */}
              <div className={`absolute inset-0 ${metric.bgColor} blur-xl opacity-50`} />
              
              <div className="relative">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${metric.bgColor} border ${metric.borderColor} mb-2`}>
                  <span className={metric.color}>{metric.icon}</span>
                </div>
                <div className={`text-2xl md:text-3xl font-bold ${metric.color} mb-1`}>
                  <AnimatedCounter target={metric.value} isInView={isInView} />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {metric.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* GBIF Badge + Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
        >
          <a
            href="https://www.gbif.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-full hover:bg-emerald-950/60 transition-colors group"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-300">
              Données certifiées GBIF
            </span>
            <ExternalLink className="w-3 h-3 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
          </a>
          
          <p className="text-sm text-muted-foreground">
            Chaque marche produit de la donnée RSE opposable
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProofBar;
