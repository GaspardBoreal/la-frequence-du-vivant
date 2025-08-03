import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Calendar, Database, Eye, Search, Settings, Bird, Leaf, Camera, Volume2, User, MoreVertical, ExternalLink, Clock, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SpeciesAudioModal } from '@/components/SpeciesAudioModal';
import { SimpleMarcheSelector } from '@/components/SimpleMarcheSelector';
import { useSupabaseMarches } from '@/hooks/useSupabaseMarches';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';

type ApiSource = 'all' | 'ebird' | 'inaturalist';
type PeriodFilter = 'recent' | 'medium';
type CategoryFilter = 'all' | 'flora' | 'fauna' | 'fungi';

const TestEbird: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<ApiSource>('ebird');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('recent');
  const [selectedMarche, setSelectedMarche] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState([500]);
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversitySpecies | null>(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [speciesModalApi, setSpeciesModalApi] = useState<'ebird' | 'inaturalist'>('ebird');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  // Récupération des marches
  const { data: marches = [], isLoading: isLoadingMarches } = useSupabaseMarches();

  // Marche sélectionnée
  const currentMarche = useMemo(() => {
    return marches.find(m => m.supabaseId === selectedMarche);
  }, [marches, selectedMarche]);

  // Données biodiversité pour la marche sélectionnée
  const { data: biodiversityData, isLoading: isLoadingBiodiversity } = useBiodiversityData({
    latitude: currentMarche?.latitude || 0,
    longitude: currentMarche?.longitude || 0,
    radius: searchRadius[0],
    dateFilter: selectedPeriod === 'recent' ? 'recent' : 'medium'
  });

  // Filtrage des espèces selon l'API sélectionnée ET la catégorie
  const filteredSpecies = useMemo(() => {
    if (!biodiversityData?.species) return [];
    
    let filtered = biodiversityData.species;
    
    // Filtre par source API
    if (selectedApi === 'ebird') {
      filtered = filtered.filter(s => s.source === 'ebird');
    } else if (selectedApi === 'inaturalist') {
      filtered = filtered.filter(s => s.source === 'inaturalist');
    }
    
    // Filtre par catégorie (comme dans BioDivSubSection)
    if (selectedCategory === 'flora') {
      filtered = filtered.filter(s => s.kingdom === 'Plantae');
    } else if (selectedCategory === 'fauna') {
      filtered = filtered.filter(s => s.kingdom === 'Animalia');
    } else if (selectedCategory === 'fungi') {
      filtered = filtered.filter(s => s.kingdom === 'Fungi');
    }
    
    // DEBUG: Synchronisation avec BioDivSubSection
    console.log('🔍 DEBUG TestEbird - SYNCHRONISATION FILTRAGE:', {
      originalCount: biodiversityData?.species?.length || 0,
      afterApiFilter: filtered.length,
      selectedApi,
      selectedCategory,
      kingdomBreakdown: {
        all: biodiversityData?.species?.length || 0,
        flora: biodiversityData?.species?.filter(s => s.kingdom === 'Plantae')?.length || 0,
        fauna: biodiversityData?.species?.filter(s => s.kingdom === 'Animalia')?.length || 0,
        fungi: biodiversityData?.species?.filter(s => s.kingdom === 'Fungi')?.length || 0,
      },
      finalFiltered: filtered.length
    });
    
    return filtered.sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [biodiversityData?.species, selectedApi, selectedCategory]);

  // Organisation des marches par département et ville
  const organizedMarches = useMemo(() => {
    const organized: Record<string, Record<string, MarcheTechnoSensible[]>> = {};
    
    marches.forEach(marche => {
      if (!organized[marche.departement]) {
        organized[marche.departement] = {};
      }
      if (!organized[marche.departement][marche.ville]) {
        organized[marche.departement][marche.ville] = [];
      }
      organized[marche.departement][marche.ville].push(marche);
    });
    
    return organized;
  }, [marches]);

  // Statistiques des contributeurs par API
  const contributorStats = useMemo(() => {
    if (!biodiversityData?.species) return { ebird: new Set(), inaturalist: new Set(), contributorsData: { ebird: [], inaturalist: [] } };
    
    const stats = { 
      ebird: new Set<string>(), 
      inaturalist: new Set<string>(),
      contributorsData: { ebird: [] as any[], inaturalist: [] as any[] }
    };
    
    const contributorsMap = new Map<string, any>();

    biodiversityData.species.forEach(species => {
      species.attributions.forEach(attr => {
        if (attr.observerName) {
          const key = `${species.source}-${attr.observerName}`;
          
          if (!contributorsMap.has(key)) {
            contributorsMap.set(key, {
              name: attr.observerName,
              institution: attr.observerInstitution || '',
              location: attr.locationName || '',
              source: species.source,
              speciesCount: 0,
              observationsCount: 0,
              photosCount: 0,
              audioCount: 0,
              listsCount: 1,
              urls: []
            });
          }
          
          const contributor = contributorsMap.get(key);
          contributor.speciesCount++;
          contributor.observationsCount++;
          
          if (species.photos && species.photos.length > 0) {
            contributor.photosCount++;
          }

          // Ajouter l'URL si elle existe et n'est pas déjà présente
          if (attr.originalUrl && !contributor.urls.includes(attr.originalUrl)) {
            contributor.urls.push(attr.originalUrl);
          }
          
          // Note: audio property doesn't exist in BiodiversitySpecies type yet
          // contributor.audioCount will remain 0 for now

          if (species.source === 'ebird') {
            stats.ebird.add(attr.observerName);
          } else if (species.source === 'inaturalist') {
            stats.inaturalist.add(attr.observerName);
          }
        }
      });
    });

    // Organiser les contributeurs par source
    contributorsMap.forEach((contributor) => {
      if (contributor.source === 'ebird') {
        stats.contributorsData.ebird.push(contributor);
      } else if (contributor.source === 'inaturalist') {
        stats.contributorsData.inaturalist.push(contributor);
      }
    });
    
    return stats;
  }, [biodiversityData?.species]);

  const handleSpeciesClick = (apiSource: 'ebird' | 'inaturalist') => {
    setSpeciesModalApi(apiSource);
    setShowSpeciesModal(true);
  };

  const openInOpenStreetMap = () => {
    if (currentMarche?.latitude && currentMarche?.longitude) {
      const url = `https://www.openstreetmap.org/?mlat=${currentMarche.latitude}&mlon=${currentMarche.longitude}&zoom=15`;
      window.open(url, '_blank');
    }
  };

  const openInGoogleMaps = () => {
    if (currentMarche?.latitude && currentMarche?.longitude) {
      const url = `https://www.google.com/maps?q=${currentMarche.latitude},${currentMarche.longitude}&z=15`;
      window.open(url, '_blank');
    }
  };

  const openInGoogleEarth = () => {
    if (currentMarche?.latitude && currentMarche?.longitude) {
      const url = `https://earth.google.com/web/@${currentMarche.latitude},${currentMarche.longitude},200a,1000d,35y,0h,0t,0r`;
      window.open(url, '_blank');
    }
  };

  const getSpeciesIcon = (species: BiodiversitySpecies) => {
    if (species.kingdom === 'Animalia') return <Bird className="h-4 w-4" />;
    if (species.kingdom === 'Plantae') return <Leaf className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const getPhotoUrl = (species: BiodiversitySpecies) => {
    if (species.photos && species.photos.length > 0) {
      return species.photos[0];
    }
    return null;
  };

  const hasRealPhoto = (species: BiodiversitySpecies) => {
    const photoUrl = getPhotoUrl(species);
    return photoUrl && !photoUrl.includes('via.placeholder.com') && !photoUrl.includes('svg');
  };

  console.log('🔍 DEBUG TestEbird:', {
    selectedApi,
    selectedMarche: selectedMarche || 'none',
    currentMarche: currentMarche ? `${currentMarche.ville} - ${currentMarche.nomMarche}` : 'none',
    searchRadius: searchRadius[0],
    totalSpecies: biodiversityData?.species?.length || 0,
    filteredSpecies: filteredSpecies.length,
    speciesWithPhotos: filteredSpecies.filter(hasRealPhoto).length,
    eBirdSpecies: biodiversityData?.species?.filter(s => s.source === 'ebird').length || 0,
    iNatSpecies: biodiversityData?.species?.filter(s => s.source === 'inaturalist').length || 0
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/admin/marches">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour Admin
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Test eBird & iNaturalist</h1>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Debug API Biodiversité
          </Badge>
        </div>

        {/* Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Filtres</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection API */}
            <div>
              <Label className="text-base font-medium mb-3 block">API Source</Label>
              <div className="flex flex-wrap gap-3">
                <Toggle
                  pressed={selectedApi === 'all'}
                  onPressedChange={() => setSelectedApi('all')}
                  variant="outline"
                  className="data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 data-[state=on]:border-gray-300"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Toutes les APIs
                </Toggle>
                <Toggle
                  pressed={selectedApi === 'ebird'}
                  onPressedChange={() => setSelectedApi('ebird')}
                  variant="outline"
                  className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 data-[state=on]:border-blue-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  eBird
                </Toggle>
                <Toggle
                  pressed={selectedApi === 'inaturalist'}
                  onPressedChange={() => setSelectedApi('inaturalist')}
                  variant="outline"
                  className="data-[state=on]:bg-green-100 data-[state=on]:text-green-900 data-[state=on]:border-green-300"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  iNaturalist
                </Toggle>
              </div>
            </div>

            {/* Période d'observation */}
            <div>
              <Label className="text-base font-medium mb-3 block">Période d'observation</Label>
              <div className="flex flex-wrap gap-3">
                <Toggle
                  pressed={selectedPeriod === 'recent'}
                  onPressedChange={() => setSelectedPeriod('recent')}
                  variant="outline"
                  className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 data-[state=on]:border-blue-300"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Récentes (&lt; 2 ans)
                </Toggle>
                <Toggle
                  pressed={selectedPeriod === 'medium'}
                  onPressedChange={() => setSelectedPeriod('medium')}
                  variant="outline"
                  className="data-[state=on]:bg-green-100 data-[state=on]:text-green-900 data-[state=on]:border-green-300"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Moyennes (2-5 ans)
                </Toggle>
              </div>
            </div>

            {/* Sélection Marche */}
            <div>
              <Label className="text-base font-medium mb-3 block">Marche à analyser</Label>
              <SimpleMarcheSelector
                marches={marches}
                selectedMarche={selectedMarche}
                onSelectMarche={setSelectedMarche}
                isLoading={isLoadingMarches}
              />
            </div>

            {/* Catégorie */}
            <div>
              <Label className="text-base font-medium mb-3 block">Catégorie d'espèces</Label>
              <div className="flex flex-wrap gap-3">
                <Toggle
                  pressed={selectedCategory === 'all'}
                  onPressedChange={() => setSelectedCategory('all')}
                  variant="outline"
                  className="data-[state=on]:bg-purple-100 data-[state=on]:text-purple-900 data-[state=on]:border-purple-300"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Toutes
                </Toggle>
                <Toggle
                  pressed={selectedCategory === 'flora'}
                  onPressedChange={() => setSelectedCategory('flora')}
                  variant="outline"
                  className="data-[state=on]:bg-green-100 data-[state=on]:text-green-900 data-[state=on]:border-green-300"
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Flore
                </Toggle>
                <Toggle
                  pressed={selectedCategory === 'fauna'}
                  onPressedChange={() => setSelectedCategory('fauna')}
                  variant="outline"
                  className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-900 data-[state=on]:border-orange-300"
                >
                  <Bird className="h-4 w-4 mr-2" />
                  Faune
                </Toggle>
                <Toggle
                  pressed={selectedCategory === 'fungi'}
                  onPressedChange={() => setSelectedCategory('fungi')}
                  variant="outline"
                  className="data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-900 data-[state=on]:border-yellow-300"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Champignons
                </Toggle>
              </div>
            </div>

            {/* Rayon de recherche */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Rayon de recherche: {searchRadius[0]}m
              </Label>
              <Slider
                value={searchRadius}
                onValueChange={setSearchRadius}
                max={5000}
                min={500}
                step={250}
                className="w-full max-w-md"
              />
              <div className="flex justify-between text-xs text-white mt-1 max-w-md">
                <span>500m</span>
                <span>2.75km</span>
                <span>5km</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        {currentMarche && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Vignette 1 : Espèces trouvées (conservée) */}
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{filteredSpecies.length}</div>
                <div className="text-sm text-white">Espèces trouvées</div>
              </CardContent>
            </Card>
            
            {/* Nouvelle Vignette 2 : Espèces par API */}
            <Card>
              <CardContent className="p-4">
                {selectedApi === 'ebird' ? (
                  <>
                    <div className="text-2xl font-bold text-blue-600">{filteredSpecies.filter(s => s.source === 'ebird').length}</div>
                    <div className="text-sm text-white">eBird</div>
                  </>
                ) : selectedApi === 'inaturalist' ? (
                  <>
                    <div className="text-2xl font-bold text-green-600">{filteredSpecies.filter(s => s.source === 'inaturalist').length}</div>
                    <div className="text-sm text-white">iNaturalist</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold">
                      <span className="text-blue-600">{filteredSpecies.filter(s => s.source === 'ebird').length}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-green-600">{filteredSpecies.filter(s => s.source === 'inaturalist').length}</span>
                    </div>
                    <div className="text-sm text-white">eBird / iNaturalist</div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Vignette 3 : Avec photos réelles (ancienne vignette 2) */}
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{filteredSpecies.filter(hasRealPhoto).length}</div>
                <div className="text-sm text-white">Avec photos réelles</div>
              </CardContent>
            </Card>
            
            {/* Vignette 4 : Chants (anciennes vignettes 3 et 4 combinées) */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-purple-300"
              onClick={() => handleSpeciesClick(selectedApi === 'ebird' ? 'ebird' : selectedApi === 'inaturalist' ? 'inaturalist' : 'ebird')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedApi === 'all' ? (
                      <>
                        <div className="text-lg font-bold">
                          <span className="text-blue-600">{filteredSpecies.filter(s => s.source === 'ebird' && s.audioUrl).length}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-green-600">{filteredSpecies.filter(s => s.source === 'inaturalist' && s.audioUrl).length}</span>
                        </div>
                        <div className="text-sm text-white">Chants disponibles</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-purple-600">{filteredSpecies.filter(s => s.audioUrl).length}</div>
                        <div className="text-sm text-white">Chants disponibles</div>
                      </>
                    )}
                  </div>
                  <Volume2 className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations sur la marche sélectionnée */}
        {currentMarche && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{currentMarche.nomMarche || `Marche ${currentMarche.ville}`}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <DropdownMenuItem 
                      onClick={openInOpenStreetMap}
                      className="text-black hover:bg-gray-100 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir dans OpenStreetMap
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={openInGoogleMaps}
                      className="text-black hover:bg-gray-100 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir dans Google Maps
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={openInGoogleEarth}
                      className="text-black hover:bg-gray-100 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir dans Google Earth
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Localisation:</span> {currentMarche.ville}, {currentMarche.departement}
                </div>
                <div>
                  <span className="font-medium">Coordonnées:</span> {currentMarche.latitude?.toFixed(4)}, {currentMarche.longitude?.toFixed(4)}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {currentMarche.date || 'Non spécifiée'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des espèces */}
        {currentMarche ? (
          isLoadingBiodiversity ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Chargement des données biodiversité...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Espèces observées</span>
                  <Badge variant="outline">{filteredSpecies.length} espèces</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSpecies.map((species) => {
                    const photoUrl = getPhotoUrl(species);
                    const hasPhoto = hasRealPhoto(species);
                    
                    return (
                      <Card 
                        key={species.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedSpecies(species)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            {/* Photo */}
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                              {hasPhoto ? (
                                <img 
                                  src={photoUrl} 
                                  alt={species.commonName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  {getSpeciesIcon(species)}
                                </div>
                              )}
                            </div>
                            
                            {/* Informations */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{species.commonName}</h4>
                              <p className="text-xs text-gray-500 italic truncate">{species.scientificName}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge 
                                  variant={species.source === 'ebird' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {species.source}
                                </Badge>
                                {hasPhoto && (
                                  <Badge variant="outline" className="text-xs">
                                    Photo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {species.observations} obs. • {species.lastSeen}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {filteredSpecies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune espèce trouvée pour les critères sélectionnés</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Sélectionnez une marche pour voir les données biodiversité</p>
            </CardContent>
          </Card>
        )}

        {/* Modal détail espèce */}
        <Dialog open={!!selectedSpecies} onOpenChange={() => setSelectedSpecies(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedSpecies && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    {getSpeciesIcon(selectedSpecies)}
                    <div>
                      <span className="block">{selectedSpecies.commonName}</span>
                      <span className="text-sm font-normal italic text-gray-500">{selectedSpecies.scientificName}</span>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Photos */}
                  {selectedSpecies.photos && selectedSpecies.photos.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Photos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedSpecies.photos.slice(0, 6).map((photo, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={photo} 
                              alt={`${selectedSpecies.commonName} ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Informations générales</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Famille:</span> {selectedSpecies.family}</div>
                        <div><span className="font-medium">Royaume:</span> {selectedSpecies.kingdom}</div>
                        <div><span className="font-medium">Source:</span> {selectedSpecies.source}</div>
                        <div><span className="font-medium">Observations:</span> {selectedSpecies.observations}</div>
                        <div><span className="font-medium">Dernière observation:</span> {selectedSpecies.lastSeen}</div>
                        {selectedSpecies.conservationStatus && (
                          <div><span className="font-medium">Statut de conservation:</span> {selectedSpecies.conservationStatus}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Attributions */}
                    <div>
                      <h4 className="font-medium mb-3">Observations ({selectedSpecies.attributions.length})</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedSpecies.attributions.slice(0, 10).map((attr, index) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                            <div className="font-medium">{attr.observerName || 'Anonyme'}</div>
                            {attr.observerInstitution && (
                              <div className="text-gray-600">{attr.observerInstitution}</div>
                            )}
                            <div className="text-gray-500">{attr.date}</div>
                            {attr.locationName && (
                              <div className="text-gray-500">{attr.locationName}</div>
                            )}
                          </div>
                        ))}
                        {selectedSpecies.attributions.length > 10 && (
                          <div className="text-sm text-gray-500 text-center py-2">
                            ... et {selectedSpecies.attributions.length - 10} autres observations
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal espèces avec audio */}
        <SpeciesAudioModal
          isOpen={showSpeciesModal}
          onClose={() => setShowSpeciesModal(false)}
          species={filteredSpecies}
          apiSource={speciesModalApi}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      </div>
    </div>
  );
};

export default TestEbird;