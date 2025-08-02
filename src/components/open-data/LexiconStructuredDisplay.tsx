
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, FileText, CloudSun, TrendingUp, ChevronDown, ChevronRight, Copy, Check, ExternalLink, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { LexiconParcelData } from '../../types/lexicon';
import WeatherVisualization from './WeatherVisualization';
import TransactionVisualization from './TransactionVisualization';

interface LexiconStructuredDisplayProps {
  data: LexiconParcelData;
  coordinates: { latitude: number; longitude: number };
}

const LexiconStructuredDisplay: React.FC<LexiconStructuredDisplayProps> = ({ data, coordinates }) => {
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [contributorsOpen, setContributorsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Fonction pour copier les données en mémoire
  const copyDataToClipboard = async () => {
    try {
      const formattedData = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(formattedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  // Liste des contributeurs avec leurs profils LinkedIn
  const contributors = [
    {
      name: 'David Joulin',
      linkedin: 'https://www.linkedin.com/in/david-joulin-9b629790/',
      role: 'Co-founder & CEO chez @ekylibre | Co-founder La Ferme Digitale | OSFarm | Seconde Nature'
    },
    {
      name: 'Olivier Lépine',
      linkedin: 'https://www.linkedin.com/in/crapougnax/',
      role: 'Accélérer et sécuriser la transition écologique des agriculteurs avec l\'IoT, données, analyses et collaboration @ Brad Technology'
    },
    {
      name: 'Laurent Tripied',
      linkedin: 'https://www.linkedin.com/in/laurenttripied/',
      role: 'CEO bziiit / Expert IA Agriculture & Processus créatifs pilotés par IA'
    }
  ];

  const organizations = [
    {
      name: 'OSFARM (concepteur LEXICON)',
      url: 'https://www.osfarm.org/fr/',
      description: 'Solutions ouvertes et interopérables pour l\'agriculture de demain'
    },
    {
      name: 'bziiit (IA Agriculture)',
      url: 'https://www.bziiit.com/',
      description: 'Formations IA et briques IA Frugale Open Source pour l\'agriculture'
    }
  ];

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
                      <Button size="sm" className="text-xs bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 border-0">
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
                      <Button size="sm" className="text-xs bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 border-0">
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
                {/* Intégration de la visualisation des transactions avancée */}
                {data._raw?.transactions || true ? (
                  <TransactionVisualization 
                    transactionData={data._raw?.transactions || {}}
                    coordinates={coordinates}
                  />
                ) : (
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
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Section Contributeurs & Partenaires - Fermée par défaut avec mécanisme wahouhhh */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 overflow-hidden relative">
          {/* Éléments décoratifs animés */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <motion.div
              animate={{ 
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Users className="w-full h-full text-purple-500" />
            </motion.div>
          </div>
          
          <Collapsible open={contributorsOpen} onOpenChange={setContributorsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-purple-100/50 transition-all duration-300 relative z-10">
                <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-purple-100 rounded-full"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Users className="h-5 w-5 text-purple-600" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      Contributeurs & Partenaires
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Animations "wahouhhh" */}
                    <motion.div 
                      className="flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-purple-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.3, 1],
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
                    {!contributorsOpen && (
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: "0 6px 20px rgba(147, 51, 234, 0.4)"
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button size="sm" className="text-xs bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white hover:from-purple-700 hover:via-violet-700 hover:to-fuchsia-700 border-0 shadow-lg hover:shadow-purple-300/50 transition-all duration-300">
                          <motion.span
                            animate={{ 
                              background: [
                                "linear-gradient(45deg, #9333EA, #8B5CF6)",
                                "linear-gradient(45deg, #8B5CF6, #D946EF)",
                                "linear-gradient(45deg, #D946EF, #9333EA)"
                              ]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            Découvrir ✨
                          </motion.span>
                        </Button>
                      </motion.div>
                    )}
                    <motion.div
                      animate={{ rotate: contributorsOpen ? 180 : 0 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    >
                      <ChevronDown className="h-4 w-4 text-purple-600" />
                    </motion.div>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100
                  }}
                  className="space-y-6"
                >
                  {/* Organismes contributeurs avec animations "wahouhhh" */}
                  <div className="space-y-4">
                    <motion.h4 
                      className="text-lg font-semibold text-purple-800 mb-3"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    >
                      🏢 Organisations partenaires
                    </motion.h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {organizations.map((org, index) => (
                        <motion.div
                          key={org.name}
                          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ 
                            delay: 0.2 + index * 0.15,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          whileHover={{ 
                            scale: 1.02,
                            y: -2,
                            boxShadow: "0 10px 25px rgba(147, 51, 234, 0.15)"
                          }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-all duration-300 group overflow-hidden relative"
                        >
                          {/* Gradient animé de fond */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            animate={{ 
                              background: [
                                "linear-gradient(135deg, rgba(147, 51, 234, 0.05), rgba(139, 92, 246, 0.05))",
                                "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(217, 70, 239, 0.05))",
                                "linear-gradient(135deg, rgba(217, 70, 239, 0.05), rgba(147, 51, 234, 0.05))"
                              ]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <motion.h5 
                                className="font-bold text-purple-800 group-hover:text-purple-900 transition-colors text-sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                {org.name}
                              </motion.h5>
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <a
                                  href={org.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:text-purple-800 transition-colors"
                                  aria-label={`Visiter le site de ${org.name}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </motion.div>
                            </div>
                            <p className="text-xs text-purple-700 leading-relaxed">{org.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Équipe technique avec super animations */}
                  <div className="space-y-4">
                    <motion.h4 
                      className="text-lg font-semibold text-purple-800 mb-3"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      👥 Équipe technique
                    </motion.h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {contributors.map((contributor, index) => (
                        <motion.div
                          key={contributor.name}
                          initial={{ opacity: 0, y: 50, rotateY: -15 }}
                          animate={{ opacity: 1, y: 0, rotateY: 0 }}
                          transition={{ 
                            delay: 0.5 + index * 0.2,
                            type: "spring",
                            stiffness: 150,
                            damping: 12
                          }}
                          whileHover={{ 
                            scale: 1.05,
                            y: -5,
                            rotateY: 2,
                            boxShadow: "0 15px 35px rgba(147, 51, 234, 0.2)"
                          }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-all duration-300 group overflow-hidden relative"
                        >
                          {/* Particules flottantes */}
                          <div className="absolute inset-0 overflow-hidden">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100"
                                style={{
                                  left: `${20 + i * 30}%`,
                                  top: `${30 + i * 20}%`
                                }}
                                animate={{
                                  y: [0, -10, 0],
                                  opacity: [0, 0.6, 0]
                                }}
                                transition={{
                                  duration: 2 + i * 0.5,
                                  repeat: Infinity,
                                  delay: i * 0.3
                                }}
                              />
                            ))}
                          </div>
                          
                          <div className="text-center space-y-3 relative z-10">
                            <motion.div
                              className="w-14 h-14 bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-500 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg shadow-lg"
                              whileHover={{ 
                                scale: 1.15, 
                                rotate: 360,
                                background: "linear-gradient(135deg, #8B5CF6, #D946EF, #9333EA)"
                              }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 300,
                                duration: 0.6
                              }}
                            >
                              {contributor.name.split(' ').map(n => n[0]).join('')}
                            </motion.div>
                            <div>
                              <motion.h5 
                                className="font-bold text-purple-800 group-hover:text-purple-900 transition-colors text-sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                {contributor.name}
                              </motion.h5>
                              <p className="text-xs text-purple-600 mb-3 leading-relaxed px-1">{contributor.role}</p>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <a
                                  href={contributor.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-purple-100 to-violet-100 hover:from-purple-200 hover:to-violet-200 text-purple-800 px-3 py-1.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                                  aria-label={`Profil LinkedIn de ${contributor.name}`}
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                  LinkedIn
                                </a>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Métadonnées SEO structurées avec animation */}
                  <motion.div 
                    className="pt-6 border-t border-purple-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <div className="text-xs text-purple-600 space-y-2 bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
                      <motion.p
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.3 }}
                      >
                        📍 Coordonnées géographiques: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                      </motion.p>
                      <motion.p
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.4 }}
                      >
                        🗺️ Données géospatiales enrichies par l'expertise territoriale française
                      </motion.p>
                      <motion.p
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.5 }}
                      >
                        🔗 API LEXICON - Service de données foncières et environnementales open source
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>

      {/* Section de débogage des données brutes - Fermée par défaut */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 overflow-hidden relative">
          <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-100/50 transition-all duration-300 relative z-10">
                <CardTitle className="flex items-center justify-between text-lg font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-gray-100 rounded-lg"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FileText className="h-4 w-4 text-gray-600" />
                    </motion.div>
                    <span className="text-gray-700">
                      Données brutes (debug)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {debugOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyDataToClipboard();
                          }}
                          className={`text-xs transition-all duration-200 ${
                            copied 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={copied}
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copier JSON
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                    <motion.div
                      animate={{ rotate: debugOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </motion.div>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200"
                >
                  <div className="text-xs text-gray-700 bg-gray-900 text-green-400 p-4 rounded-xl font-mono max-h-80 overflow-auto">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                  </div>
                </motion.div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>
    </div>
  );
};

export default LexiconStructuredDisplay;
