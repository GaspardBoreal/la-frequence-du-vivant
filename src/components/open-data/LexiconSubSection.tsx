
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useLexiconData } from '../../hooks/useLexiconData';
import LexiconStructuredDisplay from './LexiconStructuredDisplay';
import CadastralMap from './CadastralMap';

interface LexiconSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const LexiconSubSection: React.FC<LexiconSubSectionProps> = ({ marche, theme }) => {
  console.log('🚀 [LEXICON SUBSECTION] Composant rendu avec marche:', marche);
  console.log('🚀 [LEXICON SUBSECTION] Coordonnées marche:', marche?.latitude, marche?.longitude);
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
    <div className="max-w-6xl mx-auto">
      <div className="gaspard-glass rounded-3xl p-12 space-y-8">
        <div className="relative z-10 space-y-8">

          {/* Carte cadastrale - Toujours affichée */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
        <CadastralMap 
          latitude={marche.latitude} 
          longitude={marche.longitude}
          parcelGeometry={lexiconResponse?.data?.geometry}
          parcelData={lexiconResponse?.data}
          className="w-full h-[500px]"
        />
          </motion.div>

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

          {/* Affichage structuré des données */}
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

          {/* Bouton vers LEXICON externe */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button 
              onClick={openLexiconPage}
              variant="outline"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir dans LEXICON
            </Button>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default LexiconSubSection;
