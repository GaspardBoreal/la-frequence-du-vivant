
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Feather, RefreshCw, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface HaikuSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const HaikuSection: React.FC<HaikuSectionProps> = ({ marche, theme }) => {
  const [currentHaikuIndex, setCurrentHaikuIndex] = useState(0);

  // Génération d'un haïku basé sur les données de la marche
  const generateHaiku = (marche: MarcheTechnoSensible, index: number = 0) => {
    const haikus = [
      {
        line1: `${marche.ville} s'éveille`,
        line2: 'Sons et vibrations dansent',
        line3: 'La terre murmure'
      },
      {
        line1: 'Pas sur le chemin',
        line2: `${marche.departement} résonne`,
        line3: 'Écho du vivant'
      },
      {
        line1: 'Silence habité',
        line2: 'Les fréquences se révèlent',
        line3: 'Poésie pure'
      }
    ];
    return haikus[index % haikus.length];
  };

  const currentHaiku = generateHaiku(marche, currentHaikuIndex);

  const handleNextHaiku = () => {
    setCurrentHaikuIndex((prev) => (prev + 1) % 3);
  };

  return (
    <div className="space-y-8 pt-16">
      {/* Header Section */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-crimson font-bold flex items-center justify-center gap-3">
          <Feather className="h-8 w-8 text-amber-600" />
          Carnet de Haïkus
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Poésie minimaliste inspirée de <span className="font-semibold text-amber-600">{marche.ville}</span>
        </p>
      </motion.div>

      {/* Carnet de croquis style */}
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="relative">
          {/* Style carnet avec reliure */}
          <div className="bg-amber-50 rounded-r-2xl rounded-l-lg border-l-4 border-amber-200 shadow-2xl p-12 relative overflow-hidden">
            {/* Lignes de carnet */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-8 right-8 border-b border-amber-200/30"
                  style={{ top: `${60 + i * 25}px` }}
                />
              ))}
            </div>

            {/* Trous de reliure */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 space-y-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-amber-100 rounded-full border border-amber-300"
                />
              ))}
            </div>

            {/* Contenu du haïku */}
            <div className="relative z-10 space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full border border-amber-300">
                  <BookOpen className="h-4 w-4 text-amber-700" />
                  <span className="text-amber-700 font-medium text-sm">
                    Haïku #{currentHaikuIndex + 1}
                  </span>
                </div>
              </div>

              <motion.div
                key={currentHaikuIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 text-center"
              >
                {/* Haïku sur 3 lignes avec calligraphie manuscrite */}
                <div className="space-y-4 font-serif text-gray-800">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl leading-relaxed italic transform -rotate-1"
                  >
                    {currentHaiku.line1}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl leading-relaxed italic"
                  >
                    {currentHaiku.line2}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-2xl leading-relaxed italic transform rotate-1"
                  >
                    {currentHaiku.line3}
                  </motion.div>
                </div>

                {/* Signature artistique */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-end pr-8 pt-4"
                >
                  <div className="text-right text-sm text-amber-600 italic transform rotate-2">
                    ~ {marche.ville} ~
                  </div>
                </motion.div>
              </motion.div>

              {/* Esquisse décorative */}
              <div className="absolute top-4 right-8 opacity-20">
                <svg width="60" height="60" viewBox="0 0 60 60" className="text-amber-600">
                  <path
                    d="M10,30 Q30,10 50,30 Q30,50 10,30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Ombre du carnet */}
          <div className="absolute -bottom-2 -right-2 -left-1 h-8 bg-gradient-to-r from-amber-200/50 to-amber-300/30 rounded-r-2xl rounded-l-lg blur-sm -z-10" />
        </div>

        {/* Controls sous le carnet */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            onClick={handleNextHaiku}
            variant="outline"
            className="flex items-center gap-2 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className="h-4 w-4" />
            Nouveau Haïku
          </Button>
          
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Heart className="h-4 w-4" />
            Ajouter aux favoris
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default HaikuSection;
