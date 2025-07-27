
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Heart, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import PoeticNotebook from './PoeticNotebook';

interface PoeticSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const PoeticSection: React.FC<PoeticSectionProps> = ({ marche, theme }) => {
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  // Utiliser le poème en priorité, sinon le descriptif long, sinon le descriptif court
  const textToDisplay = marche.poeme || marche.descriptifLong || marche.descriptifCourt || '';

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
          Carnet de Voyage
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Découvrez les notes manuscrites de {marche.ville}
        </p>
      </motion.div>

      {/* Bouton d'ouverture du carnet */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <Button
          onClick={() => setIsNotebookOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-4 text-lg font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <BookOpen className="h-5 w-5 mr-2" />
          Ouvrir le carnet
        </Button>
      </motion.div>

      {/* Aperçu du contenu */}
      {textToDisplay && (
        <motion.div
          className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200 shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold text-amber-900 mb-2">
              Aperçu du contenu
            </h3>
            <div className="text-amber-700 font-handwriting text-sm italic">
              {textToDisplay.substring(0, 200)}...
            </div>
          </div>
          <div className="text-center">
            <span className="text-amber-600 text-sm">
              Cliquez sur "Ouvrir le carnet" pour lire la suite
            </span>
          </div>
        </motion.div>
      )}

      {/* Thematic Tags */}
      {marche.supabaseTags && marche.supabaseTags.length > 0 && (
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {marche.supabaseTags.map((tag, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
            >
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 hover:from-amber-200 hover:to-yellow-200 transition-all duration-300"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Composant du carnet en popup */}
      <PoeticNotebook
        marche={marche}
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
      />
    </div>
  );
};

export default PoeticSection;
