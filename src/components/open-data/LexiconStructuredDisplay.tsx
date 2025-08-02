
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, FileText, CloudSun, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { LexiconParcelData } from '../../types/lexicon';
import WeatherVisualization from './WeatherVisualization';

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
        <Card className="border-green-200 bg-white">
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
        <Card className="border-blue-200 bg-white">
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

      {/* Section Relevés météorologiques - Design nature */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 overflow-hidden relative">
          {/* Éléments décoratifs météo */}
          <div className="absolute top-4 right-4 opacity-20">
            <motion.div
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CloudSun className="h-12 w-12 text-sky-400" />
            </motion.div>
          </div>
          
          <Collapsible open={weatherOpen} onOpenChange={setWeatherOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-sky-100/50 transition-all duration-300 relative z-10">
                <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-sky-100 rounded-full"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <CloudSun className="h-5 w-5 text-sky-600" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                      Relevés météorologiques
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-sky-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3
                          }}
                        />
                      ))}
                    </motion.div>
                    {!weatherOpen && (
                      <Button variant="outline" size="sm" className="text-xs border-sky-200 text-sky-700 hover:bg-sky-50">
                        Explorer les données
                      </Button>
                    )}
                    <motion.div
                      animate={{ rotate: weatherOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 text-sky-600" />
                    </motion.div>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {/* Intégration de la visualisation météo avancée */}
                {data._raw?.['last-year-weather-reports'] ? (
                  <WeatherVisualization 
                    weatherData={data._raw['last-year-weather-reports']}
                    stationName={data._raw['last-year-weather-reports']?.station?.value || 'Station météorologique'}
                  />
                ) : (
                  <motion.div 
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border border-sky-100 shadow-sm"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex justify-center mb-4">
                        <div className="flex gap-2">
                          <motion.div className="w-3 h-3 bg-sky-300 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
                          <motion.div className="w-3 h-3 bg-blue-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                          <motion.div className="w-3 h-3 bg-indigo-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
                        </div>
                      </div>
                      <p className="text-sky-800 font-medium mb-2">
                        🌦️ Données climatiques en cours d'intégration
                      </p>
                      <p className="text-sm text-sky-700">
                        Les relevés horaires de température et d'humidité seront bientôt disponibles pour enrichir l'analyse environnementale.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Section Transactions - Design financier moderne */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden relative">
          {/* Éléments décoratifs financiers */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="w-full h-full border-4 border-emerald-400 rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-green-400 rounded-full" />
            </motion.div>
          </div>
          
          <Collapsible open={transactionsOpen} onOpenChange={setTransactionsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-emerald-100/50 transition-all duration-300 relative z-10">
                <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-emerald-100 rounded-lg"
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      Transactions immobilières
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`w-1 bg-emerald-400 rounded-full`}
                          style={{ height: `${(i + 1) * 4 + 8}px` }}
                          animate={{ 
                            scaleY: [1, 1.3, 1],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </motion.div>
                    {!transactionsOpen && (
                      <Button variant="outline" size="sm" className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        Analyser le marché
                      </Button>
                    )}
                    <motion.div
                      animate={{ rotate: transactionsOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 text-emerald-600" />
                    </motion.div>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <motion.div 
                  className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border border-emerald-100 shadow-sm"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="flex gap-2 items-end">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="bg-emerald-300 rounded-t"
                            style={{ 
                              width: '12px', 
                              height: `${(i + 1) * 8 + 16}px` 
                            }}
                            animate={{ 
                              scaleY: [1, 1.2, 1],
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.1
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-emerald-800 font-medium mb-2">
                      📊 Données transactionnelles en cours d'intégration
                    </p>
                    <p className="text-sm text-emerald-700">
                      L'historique des ventes et prix au m² sera bientôt disponible pour une analyse complète du marché local.
                    </p>
                  </motion.div>
                </motion.div>
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
