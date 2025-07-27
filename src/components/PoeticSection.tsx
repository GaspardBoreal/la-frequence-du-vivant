
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
  console.log('🎭 PoeticSection - Données marche:', marche);
  console.log('📝 Texte poétique disponible:', marche.poeme ? 'OUI' : 'NON');
  console.log('📝 Descriptif court disponible:', marche.descriptifCourt ? 'OUI' : 'NON');
  console.log('📝 Descriptif long disponible:', marche.descriptifLong ? 'OUI' : 'NON');
  
  // Utiliser le poème en priorité, sinon le descriptif long, sinon le descriptif court
  const textToDisplay = marche.poeme || marche.descriptifLong || marche.descriptifCourt || '';
  
  console.log('📝 Texte à afficher:', textToDisplay.substring(0, 100) + '...');

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
      {textToDisplay ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <PoeticTextDisplay
            text={textToDisplay}
            theme={theme}
            title={marche.nomMarche || marche.ville}
            author="Exploration techno-sensible"
          />
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-600 mb-2">
            Texte poétique en préparation
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Le texte poétique pour {marche.ville} sera bientôt disponible. 
            Revenez explorer cette dimension littéraire prochainement.
          </p>
        </motion.div>
      )}

      {/* Thematic Tags */}
      {marche.supabaseTags && marche.supabaseTags.length > 0 && (
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {marche.supabaseTags.map((tag, index) => (
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
