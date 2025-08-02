
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, FileText, CloudSun, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { LexiconParcelData } from '../../types/lexicon';

interface LexiconStructuredDisplayProps {
  data: LexiconParcelData;
  coordinates: { latitude: number; longitude: number };
}

const LexiconStructuredDisplay: React.FC<LexiconStructuredDisplayProps> = ({ data, coordinates }) => {
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  console.log(`🎯 [LEXICON DISPLAY] Données reçues pour affichage:`, data);

  // Extraction des données cadastrales depuis les propriétés existantes
  const extractCadastralData = (data: LexiconParcelData) => {
    const parcelId = data.parcel_id || data.id || data.cadastral_id || data.identifiant_cadastral || '';
    console.log(`🎯 [CADASTRAL] Extraction des données cadastrales depuis:`, parcelId);
    
    // Tentative d'extraction des informations cadastrales depuis parcel_id
    const extractFromParcelId = (id: string) => {
      if (id.length >= 14) {
        return {
          code_commune: id.substring(0, 5) || 'Non renseigné',
          prefixe: id.substring(5, 8) || '000',
          section: id.substring(8, 9) || 'Non renseigné',
          numero: id.substring(9) || 'Non renseigné'
        };
      }
      return {
        code_commune: 'Non renseigné',
        prefixe: '000',
        section: 'Non renseigné',
        numero: 'Non renseigné'
      };
    };

    const extracted = extractFromParcelId(parcelId);
    
    // Calcul de la superficie en m²
    const superficie_m2 = data.superficie_m2 || 
                         (data.surface_ha ? Math.round(data.surface_ha * 10000) : null) ||
                         (data.area_ha ? Math.round(data.area_ha * 10000) : null) ||
                         data.superficie;
    
    const result = {
      pays: data.pays || data.country || 'France',
      ville: data.ville || data.city || data.commune || 'Non renseigné',
      code_commune: data.code_commune || data.commune_code || extracted.code_commune,
      code_postal: data.code_postal || data.postal_code || 'Non renseigné',
      identifiant_cadastral: data.identifiant_cadastral || data.cadastral_id || parcelId || 'Non renseigné',
      prefixe: data.prefixe || data.prefix || extracted.prefixe,
      section: data.section || extracted.section,
      numero: data.numero || data.number || extracted.numero,
      superficie_m2: superficie_m2
    };
    
    console.log(`🎯 [CADASTRAL] Données extraites:`, result);
    return result;
  };

  const cadastralData = extractCadastralData(data);

  return (
    <div className="space-y-6">
      {/* Section Localisation - Toujours ouverte */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <MapPin className="h-6 w-6 text-green-600" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pays</p>
                <p className="font-semibold text-gray-800">{cadastralData.pays}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Ville</p>
                <p className="font-semibold text-gray-800">{cadastralData.ville}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Code commune</p>
                <p className="font-semibold text-gray-800">{cadastralData.code_commune}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Code postal</p>
                <p className="font-semibold text-gray-800">{cadastralData.code_postal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Cadastre - Toujours ouverte */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <FileText className="h-6 w-6 text-blue-600" />
              Cadastre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Identifiant cadastral</p>
                <p className="font-semibold text-gray-800 font-mono text-sm">{cadastralData.identifiant_cadastral}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Préfixe</p>
                  <p className="font-semibold text-gray-800">{cadastralData.prefixe}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Section</p>
                  <p className="font-semibold text-gray-800">{cadastralData.section}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Numéro</p>
                  <p className="font-semibold text-gray-800">{cadastralData.numero}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Superficie</p>
                <p className="font-semibold text-gray-800">
                  {cadastralData.superficie_m2 ? `${cadastralData.superficie_m2.toLocaleString()} m²` : 'Non renseignée'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Relevés météorologiques - Pliable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-orange-200">
          <Collapsible open={weatherOpen} onOpenChange={setWeatherOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-orange-50/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <CloudSun className="h-6 w-6 text-orange-600" />
                    Relevés météorologiques de l'année
                  </div>
                  <div className="flex items-center gap-2">
                    {!weatherOpen && (
                      <Button variant="outline" size="sm" className="text-xs">
                        Voir plus
                      </Button>
                    )}
                    {weatherOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-orange-700 font-medium mb-2">
                    Données météorologiques en cours d'intégration
                  </p>
                  <p className="text-sm text-orange-600">
                    Cette section affichera prochainement les relevés météorologiques annuels pour cette localisation.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Section Transactions - Pliable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-purple-200">
          <Collapsible open={transactionsOpen} onOpenChange={setTransactionsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-purple-50/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    Transactions
                  </div>
                  <div className="flex items-center gap-2">
                    {!transactionsOpen && (
                      <Button variant="outline" size="sm" className="text-xs">
                        Voir plus
                      </Button>
                    )}
                    {transactionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-purple-700 font-medium mb-2">
                    Données de transactions en cours d'intégration
                  </p>
                  <p className="text-sm text-purple-600">
                    Cette section affichera prochainement les transactions immobilières pour cette parcelle.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Section de débogage des données brutes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-gray-600">
              Données brutes (debug)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-700 bg-gray-100 p-3 rounded font-mono max-h-40 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LexiconStructuredDisplay;
