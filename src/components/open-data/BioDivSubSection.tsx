import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ExternalLink, TreePine, Flower, Bird, Loader2, AlertCircle, Camera, Calendar, Globe, MapPin, Info, CheckCircle, Clock, User, Building, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
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
  const [dateFilter, setDateFilter] = useState<'recent' | 'medium'>('recent');
  
  const { data: biodiversityData, isLoading, error } = useBiodiversityData({
    latitude: marche.latitude,
    longitude: marche.longitude,
    radius: 0.5,
    dateFilter
  });

  // Composant pour afficher une espèce avec attribution complète
  const SpeciesCard = ({ species }: { species: BiodiversitySpecies }) => {
    const getKingdomIcon = (kingdom: string) => {
      switch (kingdom) {
        case 'Plantae': return <TreePine className="h-5 w-5 text-green-600" />;
        case 'Animalia': return <Bird className="h-5 w-5 text-blue-600" />;
        case 'Fungi': return <Flower className="h-5 w-5 text-purple-600" />;
        default: return <Leaf className="h-5 w-5 text-gray-600" />;
      }
    };

    const getSourceColor = (source: string) => {
      switch (source) {
        case 'gbif': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'inaturalist': return 'bg-green-100 text-green-800 border-green-200';
        case 'ebird': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getConfidenceColor = (confidence: string) => {
      switch (confidence) {
        case 'high': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getConfidenceLabel = (confidence: string) => {
      switch (confidence) {
        case 'high': return 'Haute confiance';
        case 'medium': return 'Confiance moyenne';
        case 'low': return 'Faible confiance';
        default: return 'Non évaluée';
      }
    };

    const getSourceName = (source: string) => {
      switch (source) {
        case 'gbif': return 'GBIF';
        case 'inaturalist': return 'iNaturalist';
        case 'ebird': return 'eBird';
        default: return source;
      }
    };

    return (
      <Card className="hover:shadow-lg transition-all duration-300 border border-white/20 bg-white/5 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getKingdomIcon(species.kingdom)}
              <div>
                <h4 className="font-semibold text-lg">{species.commonName}</h4>
                <p className="text-sm text-muted-foreground italic">{species.scientificName}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={`text-xs ${getSourceColor(species.source)}`}>
                {species.source.toUpperCase()}
              </Badge>
              {species.confidence && (
                <Badge className={`text-xs ${getConfidenceColor(species.confidence)}`}>
                  {getConfidenceLabel(species.confidence)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Règne:</span>
              <span className="font-medium">{species.kingdom}</span>
            </div>
            {species.confirmedSources && species.confirmedSources > 1 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-muted-foreground">Confirmé par:</span>
                <span className="font-medium text-emerald-600">{species.confirmedSources} sources</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dernière observation:</span>
              <span className="font-medium">{new Date(species.lastSeen).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Observations:</span>
              <span className="font-medium">{species.observations}</span>
            </div>
            {species.conservationStatus && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Statut de conservation:</span>
                <Badge variant="outline" className="text-xs">
                  {species.conservationStatus}
                </Badge>
              </div>
            )}
          </div>

          {/* Bouton pour voir l'attribution */}
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                  <Info className="h-4 w-4 mr-1" />
                  Attribution
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getKingdomIcon(species.kingdom)}
                    Attribution des observations - {species.commonName}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">{species.commonName}</h4>
                    <p className="text-sm text-gray-600 italic">{species.scientificName}</p>
                    <p className="text-xs text-gray-500 mt-1">Famille: {species.family}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Observations détaillées ({species.attributions?.length || 0})
                    </h5>
                    
                    {species.attributions && species.attributions.length > 0 ? (
                      <div className="space-y-3">
                        {species.attributions.map((attribution, index) => (
                          <Card key={index} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className={getSourceColor(attribution.source)}>
                                  {getSourceName(attribution.source)}
                                </Badge>
                                {attribution.originalUrl && (
                                  <a 
                                    href={attribution.originalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-foreground">{attribution.observerName || 'Anonyme'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-foreground">{attribution.observerInstitution || 'Non spécifié'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-foreground">{new Date(attribution.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-foreground">{attribution.locationName || 'Localisation inconnue'}</span>
                                </div>
                              </div>
                              
                              {attribution.observationMethod && (
                                <div className="mt-3 p-2 bg-muted/50 rounded-md">
                                  <span className="font-semibold text-foreground">Méthode:</span> 
                                  <span className="ml-2 text-foreground">{attribution.observationMethod}</span>
                                </div>
                              )}
                              
                              {attribution.exactLatitude && attribution.exactLongitude && (
                                <div className="mt-3 p-2 bg-muted/30 rounded-md text-sm">
                                  <span className="font-semibold text-foreground">Coordonnées:</span> 
                                  <span className="ml-2 font-mono text-foreground">
                                    {attribution.exactLatitude.toFixed(6)}, {attribution.exactLongitude.toFixed(6)}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Aucune information d'attribution disponible.</p>
                    )}
                  </div>
                  
                  {species.confirmedSources && species.confirmedSources > 1 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Validation croisée:</strong> Cette espèce est confirmée par {species.confirmedSources} sources indépendantes, 
                        ce qui augmente la fiabilité de l'observation.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* En-tête de section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-200">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-5xl font-crimson font-bold text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text">
              BioDiv
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {marche.ville}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-white/10 rounded-full"
                >
                  <Globe className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="gaspard-glass backdrop-blur-md bg-background/90 border border-white/20 z-50">
                <DropdownMenuItem asChild>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${marche.latitude}&mlon=${marche.longitude}&zoom=15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4" />
                    Voir dans OpenStreetMap
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={`https://earth.google.com/web/@${marche.latitude},${marche.longitude},100a,35y,0h,0t,0r`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Globe className="h-4 w-4" />
                    Voir dans Google Earth
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Filtre temporel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="max-w-7xl mx-auto mb-4"
      >
        <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Période d'observation:</span>
              <RadioGroup 
                value={dateFilter} 
                onValueChange={(value: 'recent' | 'medium') => setDateFilter(value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recent" id="recent" />
                  <Label htmlFor="recent" className="text-sm cursor-pointer">Récentes (&lt; 2 ans)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-sm cursor-pointer">Moyennes (2-5 ans)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="species">Espèces</TabsTrigger>
            <TabsTrigger value="methodology">Méthodologie</TabsTrigger>
            <TabsTrigger value="map">Carte</TabsTrigger>
          </TabsList>

          {/* Onglet Résumé */}
          <TabsContent value="summary" className="space-y-6">
            <BiodiversityMetricGrid 
              summary={biodiversityData?.summary || {
                totalSpecies: 0,
                birds: 0,
                plants: 0,
                fungi: 0,
                others: 0,
                recentObservations: 0
              }}
              isLoading={isLoading}
            />

            {/* Zone d'étude et sources */}
            <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Zone d'étude
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Localisation</h4>
                    <p className="text-sm text-muted-foreground">
                      {marche.ville}, {marche.region}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rayon: 500m • Coordonnées: {marche.latitude}, {marche.longitude}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sources de données</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        GBIF
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        iNaturalist
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        eBird
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer">
                        Voir GBIF <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://www.inaturalist.org" target="_blank" rel="noopener noreferrer">
                        Voir iNaturalist <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://ebird.org" target="_blank" rel="noopener noreferrer">
                        Voir eBird <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Espèces */}
          <TabsContent value="species" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement des espèces...</span>
              </div>
            ) : error ? (
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Erreur de chargement</h3>
                  <p className="text-red-600">Impossible de charger les données de biodiversité.</p>
                </CardContent>
              </Card>
            ) : biodiversityData?.species && biodiversityData.species.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {biodiversityData.species.map((species) => (
                  <SpeciesCard key={species.id} species={species} />
                ))}
              </div>
            ) : (
              <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune espèce trouvée</h3>
                  <p className="text-muted-foreground">
                    Aucune donnée de biodiversité disponible pour cette zone.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Méthodologie */}
          <TabsContent value="methodology" className="space-y-6">
            {biodiversityData?.methodology && (
              <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Méthodologie et Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Paramètres de recherche</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Rayon de recherche: {biodiversityData.methodology.radius} km</li>
                      <li>• Période: {biodiversityData.methodology.dateFilter}</li>
                      <li>• Sources de données: {biodiversityData.methodology.sources.join(', ')}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Données exclues</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {biodiversityData.methodology.excludedData.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Système de confiance</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {biodiversityData.methodology.confidence}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Haute confiance</Badge>
                        <span className="text-sm text-muted-foreground">Confirmé par 3+ sources</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Confiance moyenne</Badge>
                        <span className="text-sm text-muted-foreground">Confirmé par 2 sources</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 border-red-200">Faible confiance</Badge>
                        <span className="text-sm text-muted-foreground">Confirmé par 1 source uniquement</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Limitations importantes</h4>
                    <ul className="space-y-1 text-sm text-yellow-700">
                      <li>• Les données peuvent être incomplètes en zone urbaine dense</li>
                      <li>• Certaines espèces communes peuvent être sous-représentées</li>
                      <li>• Les observations dépendent de l'activité des contributeurs</li>
                      <li>• Rayon réduit à 500m pour limiter les faux positifs urbains</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Carte */}
          <TabsContent value="map" className="space-y-6">
            <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Carte Interactive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Carte interactive à venir</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default BioDivSubSection;