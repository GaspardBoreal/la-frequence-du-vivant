
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Heart, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import PoeticTextDisplay from './PoeticTextDisplay';

interface PoeticSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const PoeticSection: React.FC<PoeticSectionProps> = ({ marche, theme }) => {
  return (
    <div className="space-y-12">
      {/* Section Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-crimson font-bold flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-purple-600" />
          Univers Poétique
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Explorez la dimension littéraire et contemplative de {marche.ville}
        </p>
      </motion.div>

      {/* Main Poetic Text */}
      {marche.poeme && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <PoeticTextDisplay
            text={marche.poeme}
            theme={theme}
            title={marche.theme || marche.ville}
            author="Exploration techno-sensible"
          />
        </motion.div>
      )}

      {/* Thematic Tags */}
      {marche.tagsThematiques && marche.tagsThematiques.length > 0 && (
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {marche.tagsThematiques.map((tag, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
            >
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 hover:from-purple-200 hover:to-pink-200 transition-all duration-300"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PoeticSection;
