
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useLexiconData } from '../../hooks/useLexiconData';
import LexiconStructuredDisplay from './LexiconStructuredDisplay';

interface LexiconSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const LexiconSubSection: React.FC<LexiconSubSectionProps> = ({ marche, theme }) => {
  const { data: lexiconResponse, isLoading, error, isError } = useLexiconData(
    marche.latitude, 
    marche.longitude
  );

  const openLexiconPage = () => {
    const url = `https://lexicon.osfarm.org/tools/parcel-identifier?latitude=${marche.latitude}&longitude=${marche.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="gaspard-glass rounded-3xl p-12 space-y-8">
        <motion.div
          className="relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="h-12 w-12 text-green-600" />
          </div>
        </motion.div>

        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-5xl font-crimson font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
              Lexicon
            </h3>
            
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              Données parcellaires et agricoles de{' '}
              <span className="font-semibold text-green-600">{marche.ville}</span>
            </p>
          </div>

          {/* État de chargement */}
          {isLoading && (
            <motion.div
              className="flex items-center justify-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="h-8 w-8 text-green-600 animate-spin mr-3" />
              <p className="text-gray-600">Chargement des données LEXICON...</p>
            </motion.div>
          )}

          {/* État d'erreur */}
          {isError && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h4 className="font-semibold text-red-800">Erreur de chargement</h4>
              </div>
              <p className="text-red-600 text-sm mb-4">
                {error?.message || 'Impossible de charger les données LEXICON pour cette localisation.'}
              </p>
            </motion.div>
          )}

          {/* Affichage structuré des données */}
          {lexiconResponse?.success && lexiconResponse.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LexiconStructuredDisplay 
                data={lexiconResponse.data} 
                coordinates={lexiconResponse.coordinates!}
              />
            </motion.div>
          )}

          {/* Bouton d'accès au LEXICON complet */}
          <motion.div
            className="pt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={openLexiconPage}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-full shadow-lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Accéder au LEXICON complet
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LexiconSubSection;
