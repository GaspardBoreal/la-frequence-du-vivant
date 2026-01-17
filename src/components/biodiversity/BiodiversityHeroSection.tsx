import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bird, Flower2, TreePine, Bug, ChevronDown } from 'lucide-react';

interface BiodiversityHeroSectionProps {
  totalSpecies: number;
  totalMarches: number;
  speciesByKingdom: {
    birds: number;
    plants: number;
    fungi: number;
    others: number;
  };
}

const BiodiversityHeroSection: React.FC<BiodiversityHeroSectionProps> = ({
  totalSpecies,
  totalMarches,
  speciesByKingdom,
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate counter from 0 to totalSpecies
    const duration = 2500;
    const steps = 60;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayCount(totalSpecies);
        clearInterval(timer);
      } else {
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayCount(Math.floor(totalSpecies * eased));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalSpecies]);

  const kingdomData = [
    { key: 'birds', icon: Bird, value: speciesByKingdom.birds, label: 'Oiseaux', color: 'text-sky-300' },
    { key: 'plants', icon: TreePine, value: speciesByKingdom.plants, label: 'Plantes', color: 'text-emerald-300' },
    { key: 'fungi', icon: Flower2, value: speciesByKingdom.fungi, label: 'Champignons', color: 'text-violet-300' },
    { key: 'others', icon: Bug, value: speciesByKingdom.others, label: 'Autres', color: 'text-amber-300' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 md:w-2 md:h-2 bg-emerald-400/30 rounded-full"
            initial={{ 
              x: `${Math.random() * 100}%`,
              y: '110%',
              opacity: 0 
            }}
            animate={{ 
              y: '-10%',
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 md:space-y-8"
        >
          <h1 className="text-sm sm:text-base md:text-lg text-emerald-400 tracking-widest uppercase font-medium">
            Fréquences de la rivière Dordogne
          </h1>
          
          {/* Main counter */}
          <div className="py-4 md:py-8">
            <motion.div
              className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-2 md:mb-4"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {displayCount.toLocaleString('fr-FR')}
            </motion.div>
            <div className="text-xl sm:text-2xl md:text-3xl text-emerald-300 font-light">
              espèces identifiées
            </div>
            <div className="text-sm sm:text-base md:text-lg text-emerald-400/80 mt-2">
              sur {totalMarches} étapes du fleuve
            </div>
          </div>

          {/* Kingdom breakdown - Responsive grid */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto mt-8 md:mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {kingdomData.map((item) => (
              <div 
                key={item.key}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <item.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${item.color} mx-auto mb-2`} />
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {item.value.toLocaleString('fr-FR')}
                </div>
                <div className={`text-xs sm:text-sm ${item.color} opacity-80`}>
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="flex flex-col items-center text-emerald-400/60"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-xs uppercase tracking-wider mb-2 hidden sm:block">Découvrir</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default BiodiversityHeroSection;
