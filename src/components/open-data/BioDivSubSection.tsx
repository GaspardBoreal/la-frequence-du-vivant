import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ExternalLink, TreePine, Flower, Bird, Loader2, AlertCircle, Camera, Calendar, Globe, MapPin, Info, CheckCircle, Clock, User, Building, Eye, Users, Filter, Database, ZoomIn } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  const [selectedContributor, setSelectedContributor] = useState<string>('all');
  
  const { data: biodiversityData, isLoading, error } = useBiodiversityData({
    latitude: marche.latitude,
    longitude: marche.longitude,
    radius: 0.5,
    dateFilter
  });

  // Extraction et agrégation des contributeurs
  const contributors = useMemo(() => {
    if (!biodiversityData?.species) return [];

    const contributorMap = new Map<string, number>();

    biodiversityData.species.forEach(species => {
      species.attributions?.forEach(attribution => {
        const contributorName = attribution.observerName || 'Anonyme';
        contributorMap.set(contributorName, (contributorMap.get(contributorName) || 0) + 1);
      });
    });

    return Array.from(contributorMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [biodiversityData?.species]);

  // Filtrage des espèces par contributeur
  const filteredSpecies = useMemo(() => {
    if (!biodiversityData?.species || selectedContributor === 'all') {
      return biodiversityData?.species || [];
    }

    return biodiversityData.species.filter(species => {
      return species.attributions?.some(attribution => 
        (attribution.observerName || 'Anonyme') === selectedContributor
      );
    });
  }, [biodiversityData?.species, selectedContributor]);

  // Composant pour afficher une espèce avec attribution complète
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [dialogOpenSpecies, setDialogOpenSpecies] = useState<string | null>(null);

  const SpeciesCard = ({ species }: { species: BiodiversitySpecies }) => {
    const isSelected = selectedSpecies === species.id;
    
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

    const hasPhotos = species.photos && species.photos.length > 0;
    const primaryPhoto = hasPhotos ? species.photos[0] : null;
    
    // Fonction pour optimiser la qualité d'image basée sur le domaine
    const getOptimizedImageUrl = (url: string, size: 'small' | 'medium' | 'large' = 'medium') => {
      if (!url) return url;
      
      // Pour Google Drive et services compatibles
      if (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com')) {
        const sizeMap = { small: 'w400', medium: 'w800', large: 'w1200' };
        return url.replace(/\/w\d+/, `/${sizeMap[size]}`).replace(/\/s\d+/, `/${sizeMap[size]}`);
      }
      
      // Pour les autres sources, retourner l'URL originale
      return url;
    };

    return (
      <Card 
        className={`
          group cursor-pointer transition-all duration-300 hover:shadow-lg
          ${isSelected 
            ? 'ring-2 ring-primary shadow-lg bg-primary/5 border-primary/30' 
            : 'border-border hover:border-primary/50'
          }
        `}
        onClick={() => setSelectedSpecies(isSelected ? null : species.id)}
      >
        <div className="flex flex-row p-3 gap-3">
          {/* Image compacte à gauche */}
          {primaryPhoto && (
            <div className="relative w-16 h-16 flex-shrink-0">
              <img
                src={getOptimizedImageUrl(primaryPhoto, 'small')}
                alt={`${species.commonName} - ${species.scientificName}`}
                className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105 aspect-square cursor-pointer"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                  filter: 'contrast(1.1) brightness(1.05)',
                  willChange: 'transform',
                  objectPosition: 'center'
                }}
                onError={(e) => {
                  const current = e.currentTarget;
                  if (current.src !== primaryPhoto) {
                    current.src = primaryPhoto;
                  } else {
                    current.style.display = 'none';
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDialogOpenSpecies(species.id);
                }}
              />
            </div>
          )}
          
          {/* Placeholder si pas de photo */}
          {!primaryPhoto && (
            <div className="w-16 h-16 flex-shrink-0 bg-muted/30 rounded-lg flex items-center justify-center">
              {getKingdomIcon(species.kingdom)}
            </div>
          )}
          
          {/* Contenu principal à droite */}
          <div className="flex-1 min-w-0 space-y-1">
            <div>
              <h4 className="font-semibold text-sm leading-tight truncate">
                {species.commonName}
              </h4>
              <p className="text-xs text-muted-foreground italic truncate">
                {species.scientificName}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{species.observations} obs.</span>
                <span>{new Date(species.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge className={`text-xs px-1.5 py-0.5 h-5 ${getSourceColor(species.source)}`}>
                  {getSourceName(species.source)}
                </Badge>
                
                <Dialog open={dialogOpenSpecies === species.id} onOpenChange={(open) => setDialogOpenSpecies(open ? species.id : null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                   <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                     <DialogHeader>
                       <DialogTitle className="flex items-center gap-3">
                         {getKingdomIcon(species.kingdom)}
                         <div>
                           <div className="font-bold text-xl">{species.commonName}</div>
                           <div className="text-sm font-normal italic text-muted-foreground">
                             {species.scientificName}
                           </div>
                         </div>
                       </DialogTitle>
                     </DialogHeader>
                     
                     <div className="space-y-6">
                       {/* Layout en deux colonnes */}
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Colonne gauche - Image principale */}
                         {hasPhotos && (
                           <div className="space-y-4">
                             <div className="relative w-full h-80 rounded-lg overflow-hidden bg-muted/10">
                               <img 
                                 src={species.photos[0]} 
                                 alt={`${species.commonName} - Photo principale`}
                                 className="w-full h-full object-cover"
                                 loading="eager"
                                 onError={(e) => {
                                   console.warn('Erreur de chargement image:', species.photos[0]);
                                   e.currentTarget.src = species.photos[0];
                                 }}
                               />
                             </div>
                             
                             {/* Photos supplémentaires */}
                             {species.photos.length > 1 && (
                               <div className="grid grid-cols-4 gap-2">
                                 {species.photos.slice(1, 5).map((photo, index) => (
                                   <div key={index + 1} className="relative aspect-square rounded-md overflow-hidden cursor-pointer group">
                                     <img 
                                       src={photo} 
                                       alt={`${species.commonName} - Photo ${index + 2}`}
                                       className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                       loading="lazy"
                                       onError={(e) => {
                                         e.currentTarget.src = photo;
                                       }}
                                     />
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         )}
                         
                         {/* Colonne droite - Informations taxonomiques */}
                         <div className="space-y-6">
                           {/* Badges principaux */}
                           <div className="flex flex-wrap gap-2">
                             <Badge variant="secondary" className="text-sm px-3 py-1">
                               {species.observations} observation{species.observations > 1 ? 's' : ''}
                             </Badge>
                             <Badge variant="outline" className="text-sm px-3 py-1">
                               Vu le {new Date(species.lastSeen).toLocaleDateString('fr-FR')}
                             </Badge>
                             <Badge className={`text-sm px-3 py-1 ${getSourceColor(species.source)}`}>
                               {getSourceName(species.source)}
                             </Badge>
                           </div>
                           
                           {/* Informations taxonomiques */}
                           <div className="space-y-4">
                             <div>
                               <h4 className="font-semibold text-lg mb-3">Classification</h4>
                               <div className="space-y-2 text-sm">
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Règne :</span>
                                   <span className="font-medium">{species.kingdom}</span>
                                 </div>
                                 {species.family && (
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Famille :</span>
                                     <span className="font-medium">{species.family}</span>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>

                      {/* Informations de base */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-medium text-foreground mb-3">Informations taxonomiques</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Nom commun:</span>
                            <span className="ml-2 font-medium text-foreground">{species.commonName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nom scientifique:</span>
                            <span className="ml-2 font-medium italic text-foreground">{species.scientificName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Famille:</span>
                            <span className="ml-2 font-medium text-foreground">{species.family}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Règne:</span>
                            <span className="ml-2 font-medium text-foreground">{species.kingdom}</span>
                          </div>
                        </div>
                      </div>

                      {/* Observations détaillées */}
                      <div>
                        <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Observations détaillées ({species.attributions?.length || 0})
                        </h5>
                        
                        {species.attributions && species.attributions.length > 0 ? (
                          <div className="space-y-3">
                            {species.attributions.map((attribution, index) => (
                              <Card key={index} className="border border-muted/30">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
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
                          <p className="text-muted-foreground text-sm">Aucune information d'attribution disponible.</p>
                        )}
                      </div>
                      
                      {species.confirmedSources && species.confirmedSources > 1 && (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                          <p className="text-sm text-emerald-800">
                            <strong>Validation croisée:</strong> Cette espèce est confirmée par {species.confirmedSources} sources indépendantes, 
                            ce qui augmente la fiabilité de l'observation.
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
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
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Période d'observation:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={dateFilter === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('recent')}
                  className={`
                    transition-all duration-300 ease-in-out
                    ${dateFilter === 'recent' 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'hover:bg-primary/10 hover:border-primary/30 hover:scale-102'
                    }
                  `}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Récentes (&lt; 2 ans)
                  {dateFilter === 'recent' && (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                </Button>
                <Button
                  variant={dateFilter === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('medium')}
                  className={`
                    transition-all duration-300 ease-in-out
                    ${dateFilter === 'medium' 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'hover:bg-primary/10 hover:border-primary/30 hover:scale-102'
                    }
                  `}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Moyennes (2-5 ans)
                  {dateFilter === 'medium' && (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
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
            {/* Affichage des données brutes */}
            {(biodiversityData?.methodology as any)?.rawDataCounts && (
              <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Données collectées
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">GBIF</div>
                      <div className="font-mono text-primary">{(biodiversityData.methodology as any).rawDataCounts.gbif}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">iNaturalist</div>
                      <div className="font-mono text-primary">{(biodiversityData.methodology as any).rawDataCounts.inaturalist}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">eBird</div>
                      <div className="font-mono text-primary">{(biodiversityData.methodology as any).rawDataCounts.ebird}</div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total observations</div>
                      <div className="font-mono text-lg text-foreground">{(biodiversityData.methodology as any).rawDataCounts.totalBeforeAggregation}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Espèces uniques</div>
                      <div className="font-mono text-lg text-primary">{(biodiversityData.methodology as any).rawDataCounts.totalAfterAggregation}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
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
            {/* Filtre par contributeurs */}
            {contributors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Filtrer par contributeur:</span>
                      </div>
                      <Select
                        value={selectedContributor}
                        onValueChange={setSelectedContributor}
                      >
                        <SelectTrigger className="min-w-96 bg-background/50 border-white/20">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <SelectValue placeholder="Tous les contributeurs" className="whitespace-nowrap" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-sm border-white/20 z-50">
                          <SelectItem value="all" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>Tous les contributeurs</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {biodiversityData?.species?.length || 0} espèces
                              </Badge>
                            </div>
                          </SelectItem>
                          {contributors.map((contributor) => (
                            <SelectItem key={contributor.name} value={contributor.name} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{contributor.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {contributor.count}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedContributor !== 'all' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-1 whitespace-nowrap">
                            {filteredSpecies.length} espèce{filteredSpecies.length > 1 ? 's' : ''}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContributor('all')}
                            className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                          >
                            ✕ Effacer
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

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
            ) : filteredSpecies && filteredSpecies.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSpecies.map((species) => (
                  <SpeciesCard key={species.id} species={species} />
                ))}
              </div>
            ) : selectedContributor !== 'all' ? (
              <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune espèce pour ce contributeur</h3>
                  <p className="text-muted-foreground">
                    Aucune observation de <strong>{selectedContributor}</strong> dans cette zone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContributor('all')}
                    className="mt-4"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Voir toutes les espèces
                  </Button>
                </CardContent>
              </Card>
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