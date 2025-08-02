
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useLexiconData } from '../../hooks/useLexiconData';
import LexiconStructuredDisplay from './LexiconStructuredDisplay';

interface LexiconSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const LexiconSubSection: React.FC<LexiconSubSectionProps> = ({ marche, theme }) => {
  console.log(`🔍 [LEXICON DEBUG] Marché reçu:`, marche);
  console.log(`🔍 [LEXICON DEBUG] Coordonnées: lat=${marche.latitude}, lng=${marche.longitude}`);
  
  const { data: lexiconResponse, isLoading, error, isError } = useLexiconData(
    marche.latitude, 
    marche.longitude
  );

  console.log(`🔍 [LEXICON DEBUG] État de la requête:`, { 
    isLoading, 
    isError, 
    hasData: !!lexiconResponse,
    success: lexiconResponse?.success 
  });
  
  if (lexiconResponse) {
    console.log(`🔍 [LEXICON DEBUG] Réponse complète:`, lexiconResponse);
  }
  
  if (error) {
    console.log(`🔍 [LEXICON DEBUG] Erreur complète:`, error);
  }

  const openLexiconPage = () => {
    const url = `https://lexicon.osfarm.org/tools/parcel-identifier?latitude=${marche.latitude}&longitude=${marche.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="gaspard-glass rounded-3xl p-12 space-y-8">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-4xl font-crimson font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
              Lexicon
            </h3>
          </div>

          {/* Informations de débogage */}

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
              <div className="text-xs text-red-500 bg-red-100 p-3 rounded font-mono">
                Détails techniques: {JSON.stringify(error, null, 2)}
              </div>
            </motion.div>
          )}

          {/* Affichage structuré des données - Condition moins restrictive */}
          {lexiconResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {lexiconResponse.success && lexiconResponse.data ? (
                <LexiconStructuredDisplay 
                  data={lexiconResponse.data} 
                  coordinates={lexiconResponse.coordinates!}
                />
              ) : (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-yellow-800 font-medium mb-2">
                      Réponse reçue mais données non structurées
                    </p>
                    <div className="text-xs text-yellow-700 bg-yellow-100 p-3 rounded font-mono max-h-40 overflow-auto">
                      {JSON.stringify(lexiconResponse, null, 2)}
                    </div>
                  </CardContent>
                </Card>
              )}
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
