
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ExternalLink, TreePine, Flower, Bird, Loader2, AlertCircle, Camera, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useBiodiversityData } from '../../hooks/useBiodiversityData';
import { BiodiversitySpecies } from '../../types/biodiversity';
import { BiodiversityMetricGrid } from '../biodiversity/BiodiversityMetricGrid';

interface BioDivSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const BioDivSubSection: React.FC<BioDivSubSectionProps> = ({ marche, theme }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  // Récupération des données de biodiversité
  const { data: biodiversityData, isLoading, error } = useBiodiversityData({
    latitude: marche.latitude,
    longitude: marche.longitude,
    radius: 5 // 5km de rayon
  });

  const SpeciesCard: React.FC<{ species: BiodiversitySpecies }> = ({ species }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-800 mb-1">
              {species.commonName}
            </CardTitle>
            <p className="text-sm italic text-gray-600">{species.scientificName}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {species.kingdom}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {species.source}
              </Badge>
            </div>
          </div>
          {species.photos && species.photos.length > 0 && (
            <div className="ml-3 flex-shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={species.photos[0]} 
                  alt={species.commonName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Vu le {new Date(species.lastSeen).toLocaleDateString('fr-FR')}</span>
          </div>
          <span className="font-medium">{species.observations} obs.</span>
        </div>
        {species.conservationStatus && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              {species.conservationStatus}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="gaspard-glass rounded-3xl p-8 space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-6">
            <Leaf className="h-12 w-12 text-emerald-600" />
          </div>
          
          <h3 className="text-5xl font-crimson font-bold text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text">
            BioDiv
          </h3>
          
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Découvrez la biodiversité scientifique de{' '}
            <span className="font-semibold text-emerald-600">{marche.ville}</span>
          </p>
        </motion.div>

        {/* Contenu principal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-gray-600">Chargement des données de biodiversité...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-center">
              <div className="space-y-3">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                <p className="text-gray-600">Données de biodiversité temporairement indisponibles</p>
                <p className="text-sm text-gray-500">Les APIs externes ne répondent pas</p>
              </div>
            </div>
          )}

          {biodiversityData && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Résumé</TabsTrigger>
                <TabsTrigger value="species">Espèces</TabsTrigger>
                <TabsTrigger value="map">Carte</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-8">
                {/* New Biodiversity Metrics Grid */}
                <BiodiversityMetricGrid 
                  summary={biodiversityData.summary}
                  isLoading={isLoading}
                />

                {/* Informations sur la zone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Card className="gaspard-glass border border-white/20 backdrop-blur-md bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Leaf className="h-5 w-5 text-emerald-500" />
                        Zone d'étude
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Coordonnées</p>
                          <p className="font-mono text-sm text-foreground">
                            {biodiversityData.location.latitude.toFixed(5)}, {biodiversityData.location.longitude.toFixed(5)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Rayon d'analyse</p>
                          <p className="font-semibold text-foreground">{biodiversityData.location.radius} km</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10 mt-4">
                        <a
                          href="https://www.gbif.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                                   bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                                   hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200"
                        >
                          GBIF <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://www.inaturalist.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                                   bg-green-500/10 text-green-400 border border-green-500/20
                                   hover:bg-green-500/20 hover:border-green-500/30 transition-all duration-200"
                        >
                          iNaturalist <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://ebird.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                                   bg-sky-500/10 text-sky-400 border border-sky-500/20
                                   hover:bg-sky-500/20 hover:border-sky-500/30 transition-all duration-200"
                        >
                          eBird <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="species" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Espèces observées ({biodiversityData.species.length})
                  </h4>
                  <Badge variant="outline">
                    Données GBIF, iNaturalist, eBird
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {biodiversityData.species.map((species) => (
                    <SpeciesCard key={species.id} species={species} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="map" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition géographique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-600">Carte interactive à venir</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </motion.div>

        {/* Liens externes */}
        <motion.div
          className="text-center pt-6 border-t border-emerald-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                GBIF
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.inaturalist.org" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                iNaturalist
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://ebird.org" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                eBird
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BioDivSubSection;
