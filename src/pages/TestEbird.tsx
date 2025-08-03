import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Calendar, Database, Eye, Search, Settings, Bird, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabaseMarches } from '@/hooks/useSupabaseMarches';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';

type ApiSource = 'all' | 'ebird' | 'inaturalist';

const TestEbird: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<ApiSource>('ebird');
  const [selectedMarche, setSelectedMarche] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState([500]);
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversitySpecies | null>(null);

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
    dateFilter: 'recent'
  });

  // Filtrage des espèces selon l'API sélectionnée
  const filteredSpecies = useMemo(() => {
    if (!biodiversityData?.species) return [];
    
    let filtered = biodiversityData.species;
    
    if (selectedApi === 'ebird') {
      filtered = filtered.filter(s => s.source === 'ebird');
    } else if (selectedApi === 'inaturalist') {
      filtered = filtered.filter(s => s.source === 'inaturalist');
    }
    
    return filtered.sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [biodiversityData?.species, selectedApi]);

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
    if (!biodiversityData?.species) return { ebird: new Set(), inaturalist: new Set() };
    
    const stats = { ebird: new Set<string>(), inaturalist: new Set<string>() };
    
    biodiversityData.species.forEach(species => {
      species.attributions.forEach(attr => {
        if (attr.observerName) {
          if (species.source === 'ebird') {
            stats.ebird.add(attr.observerName);
          } else if (species.source === 'inaturalist') {
            stats.inaturalist.add(attr.observerName);
          }
        }
      });
    });
    
    return stats;
  }, [biodiversityData?.species]);

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
              <RadioGroup value={selectedApi} onValueChange={(value: ApiSource) => setSelectedApi(value)} className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="api-all" />
                  <Label htmlFor="api-all">Toutes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ebird" id="api-ebird" />
                  <Label htmlFor="api-ebird">Uniquement eBird</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inaturalist" id="api-inaturalist" />
                  <Label htmlFor="api-inaturalist">Uniquement iNaturalist</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sélection Marche */}
            <div>
              <Label className="text-base font-medium mb-3 block">Marche à analyser</Label>
              <Select value={selectedMarche} onValueChange={setSelectedMarche}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Sélectionner une marche..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(organizedMarches).sort().map(departement => (
                    <div key={departement}>
                      <div className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-100">
                        {departement}
                      </div>
                      {Object.keys(organizedMarches[departement]).sort().map(ville => (
                        <div key={ville}>
                          <div className="px-4 py-1 text-xs text-gray-400 bg-gray-50">
                            {ville}
                          </div>
                          {organizedMarches[departement][ville]
                            .sort((a, b) => (a.nomMarche || '').localeCompare(b.nomMarche || ''))
                            .map(marche => (
                              <SelectItem key={marche.supabaseId} value={marche.supabaseId || ''}>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{marche.nomMarche || `Marche ${marche.ville}`}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-md">
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
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{filteredSpecies.length}</div>
                <div className="text-sm text-gray-600">Espèces trouvées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{filteredSpecies.filter(hasRealPhoto).length}</div>
                <div className="text-sm text-gray-600">Avec photos réelles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{contributorStats.ebird.size}</div>
                <div className="text-sm text-gray-600">Contributeurs eBird</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{contributorStats.inaturalist.size}</div>
                <div className="text-sm text-gray-600">Contributeurs iNaturalist</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations sur la marche sélectionnée */}
        {currentMarche && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>{currentMarche.nomMarche || `Marche ${currentMarche.ville}`}</span>
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
      </div>
    </div>
  );
};

export default TestEbird;