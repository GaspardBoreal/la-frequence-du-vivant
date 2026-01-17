import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bird, Flower2, TreePine, Bug } from 'lucide-react';

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
    const increment = totalSpecies / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayCount(totalSpecies);
        clearInterval(timer);
      } else {
        // Easing function for smooth animation
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        setDisplayCount(Math.floor(totalSpecies * eased));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalSpecies]);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%',
              y: '100%',
              opacity: 0 
            }}
            animate={{ 
              y: '-20%',
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-lg md:text-xl text-emerald-200 mb-4 tracking-wide uppercase">
            Fréquences de la rivière Dordogne
          </h1>
          
          {/* Main counter */}
          <div className="mb-8">
            <motion.div
              className="text-7xl md:text-9xl font-bold text-white mb-2"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {displayCount.toLocaleString('fr-FR')}
            </motion.div>
            <div className="text-2xl md:text-3xl text-emerald-300 font-light">
              espèces identifiées
            </div>
            <div className="text-lg text-emerald-400 mt-2">
              sur {totalMarches} étapes du fleuve
            </div>
          </div>

          {/* Kingdom breakdown */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Bird className="h-8 w-8 text-blue-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{speciesByKingdom.birds.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-blue-200">Oiseaux</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <TreePine className="h-8 w-8 text-green-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{speciesByKingdom.plants.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-green-200">Plantes</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Flower2 className="h-8 w-8 text-purple-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{speciesByKingdom.fungi.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-purple-200">Champignons</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Bug className="h-8 w-8 text-amber-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{speciesByKingdom.others.toLocaleString('fr-FR')}</div>
              <div className="text-sm text-amber-200">Autres</div>
            </div>
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
            className="w-6 h-10 border-2 border-white/40 rounded-full p-1"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-white/60 rounded-full mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default BiodiversityHeroSection;
