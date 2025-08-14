import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Slider } from '../ui/slider';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useBiodiversityData } from '../../hooks/useBiodiversityData';
import { BiodiversitySpecies } from '../../types/biodiversity';
import { BiodiversityMetricGrid } from '../biodiversity/BiodiversityMetricGrid';
import { BiodiversityMap } from '../biodiversity/BiodiversityMap';
// import ContributorDetailModal from '../ContributorDetailModal'; // Removed as not used in this clean version
import { EnhancedSpeciesCard } from '../audio/EnhancedSpeciesCard';
import SpeciesDetailModal from '../biodiversity/SpeciesDetailModal';

interface BioDivSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

// Fonction utilitaire pour identifier les oiseaux
const isBirdSpecies = (species: BiodiversitySpecies): boolean => {
  const isFromEbird = species.source === 'ebird';
  const isAvesFamily = species.family === 'Aves' || species.family?.toLowerCase().includes('aves');
  const isBirdFamily = species.family?.toLowerCase().includes('bird') || species.family?.toLowerCase().includes('idae');
  const isBirdInName = species.commonName?.toLowerCase().includes('oiseau') || species.commonName?.toLowerCase().includes('bird') || species.scientificName?.toLowerCase().includes('aves');
  return isFromEbird || isAvesFamily || isBirdFamily || isBirdInName;
};

const BioDivSubSection: React.FC<BioDivSubSectionProps> = ({ marche, theme }) => {
  const [dateFilter, setDateFilter] = useState<'recent' | 'medium'>('recent');
  const [selectedContributor, setSelectedContributor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'birds' | 'plants' | 'fungi' | 'others'>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'gbif' | 'inaturalist' | 'ebird'>('all');
  const [selectedConfidence, setSelectedConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'recent' | 'month' | 'year'>('all');
  const [hasAudioFilter, setHasAudioFilter] = useState<'all' | 'with-audio' | 'without-audio'>('all');
  const [searchRadius, setSearchRadius] = useState<number>(0.5);
  const [debouncedRadius, setDebouncedRadius] = useState<number>(0.5);
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversitySpecies | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'observations' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<string | null>(null);
  const [showExpandDialog, setShowExpandDialog] = useState<boolean>(false);
  const [hasExpanded, setHasExpanded] = useState<boolean>(false);
  
  // Debounce du rayon de recherche pour éviter trop d'appels API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(searchRadius);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [searchRadius]);
  
  const { data: biodiversityData, isLoading, error } = useBiodiversityData({
    latitude: marche.latitude,
    longitude: marche.longitude,
    radius: debouncedRadius,
    dateFilter
  });

  // Extraction et agrégation des contributeurs groupés par source API
  const contributorsBySource = useMemo(() => {
    if (!biodiversityData?.species) return { eBird: [], iNaturalist: [], gbif: [] };

    const sourceGroups = { eBird: new Map<string, number>(), iNaturalist: new Map<string, number>(), gbif: new Map<string, number>() };

    biodiversityData.species.forEach(species => {
      species.attributions?.forEach(attribution => {
        const contributorName = attribution.observerName || 'Anonyme';
        const sourceKey = species.source === 'ebird' ? 'eBird' : 
                         species.source === 'inaturalist' ? 'iNaturalist' : 'gbif';
        
        const currentMap = sourceGroups[sourceKey];
        currentMap.set(contributorName, (currentMap.get(contributorName) || 0) + 1);
      });
    });

    // Convertir et trier chaque groupe
    return {
      eBird: Array.from(sourceGroups.eBird.entries())
        .map(([name, count]) => ({ name, count, source: 'ebird' as const }))
        .sort((a, b) => b.count - a.count),
      iNaturalist: Array.from(sourceGroups.iNaturalist.entries())
        .map(([name, count]) => ({ name, count, source: 'inaturalist' as const }))
        .sort((a, b) => b.count - a.count),
      gbif: Array.from(sourceGroups.gbif.entries())
        .map(([name, count]) => ({ name, count, source: 'gbif' as const }))
        .sort((a, b) => b.count - a.count)
    };
  }, [biodiversityData?.species]);

  // Compteur total de contributeurs pour le badge
  const totalContributors = useMemo(() => {
    return contributorsBySource.eBird.length + contributorsBySource.iNaturalist.length + contributorsBySource.gbif.length;
  }, [contributorsBySource]);

  // Calcul des catégories d'espèces
  const categoryStats = useMemo(() => {
    if (!biodiversityData?.species) return { all: 0, birds: 0, plants: 0, fungi: 0, others: 0 };
    
    const stats = {
      all: biodiversityData.species.length,
      birds: biodiversityData.species.filter(isBirdSpecies).length,
      plants: biodiversityData.species.filter(s => s.kingdom === 'Plantae').length,
      fungi: biodiversityData.species.filter(s => s.kingdom === 'Fungi').length,
      others: 0
    };
    
    stats.others = stats.all - stats.birds - stats.plants - stats.fungi;
    
    return stats;
  }, [biodiversityData?.species]);

  // Filtrage des espèces par catégorie et contributeur
  const filteredSpecies = useMemo(() => {
    if (!biodiversityData?.species) return [];

    let filtered = biodiversityData.species;

    // Filtrage par métriques sélectionnées depuis les indicateurs
    if (selectedMetricFilter) {
      filtered = filtered.filter(species => {
        switch (selectedMetricFilter) {
          case 'birds':
            return isBirdSpecies(species);
          case 'plants':
            return species.kingdom === 'Plantae';
          case 'fungi':
            return species.kingdom === 'Fungi';
          case 'others':
            return species.kingdom !== 'Plantae' && species.kingdom !== 'Fungi' && !isBirdSpecies(species);
          case 'withAudio':
            return species.xenoCantoRecordings && species.xenoCantoRecordings.length > 0;
          case 'withPhotos':
            return species.photoData && species.photoData.source !== 'placeholder';
          case 'total':
          default:
            return true;
        }
      });
    }

    // Filtrage par catégorie (garde la logique existante si pas de filtre métrique)
    if (!selectedMetricFilter && selectedCategory !== 'all') {
      filtered = filtered.filter(species => {
        switch (selectedCategory) {
          case 'plants':
            return species.kingdom === 'Plantae';
          case 'birds':
            return isBirdSpecies(species);
          case 'fungi':
            return species.kingdom === 'Fungi';
          case 'others':
            return species.kingdom !== 'Plantae' && species.kingdom !== 'Fungi' && !isBirdSpecies(species);
          default:
            return true;
        }
      });
    }

    // Filtrage par contributeur
    if (selectedContributor !== 'all') {
      filtered = filtered.filter(species => {
        return species.attributions?.some(attribution => 
          (attribution.observerName || 'Anonyme') === selectedContributor
        );
      });
    }

    // Filtrage par source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(species => species.source === selectedSource);
    }

    // Filtrage par niveau de confiance
    if (selectedConfidence !== 'all') {
      filtered = filtered.filter(species => species.confidence === selectedConfidence);
    }

    // Filtrage par période d'observation
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (selectedTimeRange) {
        case 'recent':
          cutoff.setDate(now.getDate() - 30);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(species => new Date(species.lastSeen) >= cutoff);
    }

    // Filtrage par disponibilité audio
    if (hasAudioFilter !== 'all') {
      console.log('🎵 DEBUG - Filtrage audio:', {
        hasAudioFilter,
        totalSpecies: filtered.length,
        speciesWithXeno: filtered.filter(s => s.xenoCantoRecordings && s.xenoCantoRecordings.length > 0).length,
        exampleSpeciesWithAudio: filtered.filter(s => s.xenoCantoRecordings && s.xenoCantoRecordings.length > 0).slice(0, 3).map(s => ({
          name: s.commonName,
          audioCount: s.xenoCantoRecordings?.length || 0
        }))
      });
      
      filtered = filtered.filter(species => {
        const hasAudio = species.xenoCantoRecordings && species.xenoCantoRecordings.length > 0;
        return hasAudioFilter === 'with-audio' ? hasAudio : !hasAudio;
      });
    }

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(species =>
        species.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        species.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    filtered = filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.commonName.toLowerCase();
          bValue = b.commonName.toLowerCase();
          break;
        case 'observations':
          aValue = a.observations;
          bValue = b.observations;
          break;
        case 'date':
          aValue = new Date(a.lastSeen).getTime();
          bValue = new Date(b.lastSeen).getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [biodiversityData?.species, selectedMetricFilter, selectedCategory, selectedSource, selectedConfidence, selectedTimeRange, hasAudioFilter, selectedContributor, searchTerm, sortBy, sortOrder]);

  const summaryStats = useMemo(() => {
    if (!biodiversityData?.species) return null;
    
    const total = filteredSpecies.length;
    const birds = filteredSpecies.filter(isBirdSpecies).length;
    const plants = filteredSpecies.filter(s => s.kingdom === 'Plantae').length;
    const fungi = filteredSpecies.filter(s => s.kingdom === 'Fungi').length;
    const others = total - birds - plants - fungi;
    const withAudio = filteredSpecies.filter(s => s.xenoCantoRecordings && s.xenoCantoRecordings.length > 0).length;
    const withPhotos = filteredSpecies.filter(s => s.photoData && s.photoData.source !== 'placeholder').length;
    
    return { total, birds, plants, fungi, others, withAudio, withPhotos };
  }, [filteredSpecies, biodiversityData?.species]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">Chargement des données de biodiversité...</p>
        <p className="text-sm text-muted-foreground">
          Analyse en cours dans un rayon de {debouncedRadius}km autour de {marche.ville}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Erreur de chargement</h3>
          <p className="text-destructive">Impossible de charger les données de biodiversité.</p>
        </CardContent>
      </Card>
    );
  }

  // Gestion de l'expansion du rayon de recherche
  const shouldShowExpandDialog = !biodiversityData?.species || 
    (biodiversityData.species.length === 0 && debouncedRadius === 0.5 && !showExpandDialog && !hasExpanded);

  const handleExpandRadius = () => {
    setSearchRadius(5);
    setDebouncedRadius(5);
    setHasExpanded(true);
  };

  const handleDeclineExpansion = () => {
    setShowExpandDialog(true);
  };

  // Affichage du dialogue d'expansion si aucune donnée à 500m
  if (shouldShowExpandDialog) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-6 text-center">
          <Globe className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-sm font-medium mb-4">
            Aucune donnée de biodiversité enregistrée dans un rayon de recherche de 500m
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Souhaitez-vous que l'on élargisse le rayon de recherche ?
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleExpandRadius} variant="default">
              Oui
            </Button>
            <Button onClick={handleDeclineExpansion} variant="outline">
              Non
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Affichage normal si pas de données et utilisateur a refusé l'expansion
  if ((!biodiversityData?.species || biodiversityData.species.length === 0) && showExpandDialog) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée trouvée</h3>
          <p className="text-muted-foreground">
            Aucune observation de biodiversité trouvée dans un rayon de {debouncedRadius < 1 ? `${Math.round(debouncedRadius * 1000)}m` : `${debouncedRadius}km`} autour de {marche.ville}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleMetricFilterChange = (filter: string | null) => {
    setSelectedMetricFilter(filter);
    // Reset les autres filtres quand on utilise les métriques
    if (filter) {
      setSelectedCategory('all');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec métriques cliquables */}
      {summaryStats && (
        <BiodiversityMetricGrid 
          summary={{
            totalSpecies: summaryStats.total,
            birds: summaryStats.birds,
            plants: summaryStats.plants,
            fungi: summaryStats.fungi,
            others: summaryStats.others,
            recentObservations: 0, // Pas utilisé dans ce contexte
            withAudio: summaryStats.withAudio,
            withPhotos: summaryStats.withPhotos
          }}
          selectedFilter={selectedMetricFilter}
          onFilterChange={handleMetricFilterChange}
        />
      )}

      {/* Contrôles de recherche et rayon */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Rayon de recherche */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rayon de recherche:</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                  {searchRadius < 1 ? `${Math.round(searchRadius * 1000)}m` : `${searchRadius}km`}
                </Badge>
                {hasExpanded && (
                  <Badge variant="secondary" className="text-xs">
                    Élargi
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Slider
                value={[searchRadius]}
                onValueChange={(value) => setSearchRadius(value[0])}
                max={5}
                min={0.5}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5km</span>
                <span>2.75km</span>
                <span>5km</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {filteredSpecies.length} espèces trouvées dans un rayon de {searchRadius < 1 ? `${Math.round(searchRadius * 1000)}m` : `${searchRadius}km`}
            </p>
          </div>

          {/* Filtres élargis avec contributeurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{gridTemplateColumns: 'lg:1fr 1fr 0.8fr 1.4fr'}}>
            <div>
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes ({categoryStats.all})</SelectItem>
                  <SelectItem value="birds">Oiseaux ({categoryStats.birds})</SelectItem>
                  <SelectItem value="plants">Plantes ({categoryStats.plants})</SelectItem>
                  <SelectItem value="fungi">Champignons ({categoryStats.fungi})</SelectItem>
                  <SelectItem value="others">Autres ({categoryStats.others})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedSource} onValueChange={(value: any) => setSelectedSource(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="gbif">GBIF</SelectItem>
                  <SelectItem value="inaturalist">iNaturalist</SelectItem>
                  <SelectItem value="ebird">eBird</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={hasAudioFilter} onValueChange={(value: any) => setHasAudioFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Audio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Avec et sans audio</SelectItem>
                  <SelectItem value="with-audio">Avec audio</SelectItem>
                  <SelectItem value="without-audio">Sans audio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedContributor} onValueChange={(value: any) => setSelectedContributor(value)}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="truncate flex-1">
                      <SelectValue placeholder="Contributeurs" />
                    </div>
                    {totalContributors > 0 && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {totalContributors}
                      </Badge>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all" className="font-medium">
                    Tous les contributeurs ({totalContributors})
                  </SelectItem>
                  
                  {contributorsBySource.eBird.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 border-b">
                        eBird ({contributorsBySource.eBird.length})
                      </div>
                      {contributorsBySource.eBird.map(contributor => (
                        <SelectItem key={`ebird-${contributor.name}`} value={contributor.name} className="pl-6">
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{contributor.name}</span>
                            <Badge variant="outline" className="ml-2 text-blue-600 border-blue-200">
                              {contributor.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {contributorsBySource.iNaturalist.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 border-b">
                        iNaturalist ({contributorsBySource.iNaturalist.length})
                      </div>
                      {contributorsBySource.iNaturalist.map(contributor => (
                        <SelectItem key={`inaturalist-${contributor.name}`} value={contributor.name} className="pl-6">
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{contributor.name}</span>
                            <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                              {contributor.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {contributorsBySource.gbif.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400 border-b">
                        GBIF ({contributorsBySource.gbif.length})
                      </div>
                      {contributorsBySource.gbif.map(contributor => (
                        <SelectItem key={`gbif-${contributor.name}`} value={contributor.name} className="pl-6">
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{contributor.name}</span>
                            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">
                              {contributor.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Onglets avec Vue Carte ajoutée */}
      <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Toutes ({categoryStats.all})
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Carte
          </TabsTrigger>
          <TabsTrigger value="birds" className="flex items-center gap-2">
            <Bird className="h-4 w-4" />
            Faune ({categoryStats.birds})
          </TabsTrigger>
          <TabsTrigger value="plants" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Flore ({categoryStats.plants})
          </TabsTrigger>
          <TabsTrigger value="fungi" className="flex items-center gap-2">
            <Flower className="h-4 w-4" />
            Champignons ({categoryStats.fungi})
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Autres ({categoryStats.others})
          </TabsTrigger>
        </TabsList>

        {/* Vue Carte */}
        <TabsContent value="map" className="space-y-4">
          <div className="h-[600px]">
            <BiodiversityMap 
              data={biodiversityData}
              centerLat={marche.latitude}
              centerLon={marche.longitude}
            />
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecies.map((species, index) => (
              <EnhancedSpeciesCard 
                key={`${species.id}-${index}`} 
                species={species} 
                onSpeciesClick={setSelectedSpecies}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="birds" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecies
              .filter(isBirdSpecies)
              .map((species, index) => (
                <EnhancedSpeciesCard 
                  key={`${species.id}-${index}`} 
                  species={species} 
                  onSpeciesClick={setSelectedSpecies}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="plants" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecies
              .filter(species => species.kingdom === 'Plantae')
              .map((species, index) => (
                <EnhancedSpeciesCard 
                  key={`${species.id}-${index}`} 
                  species={species} 
                  onSpeciesClick={setSelectedSpecies}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="fungi" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecies
              .filter(species => species.kingdom === 'Fungi')
              .map((species, index) => (
                <EnhancedSpeciesCard 
                  key={`${species.id}-${index}`} 
                  species={species} 
                  onSpeciesClick={setSelectedSpecies}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="others" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecies
              .filter(species => 
                species.kingdom !== 'Plantae' && 
                species.kingdom !== 'Fungi' && 
                !isBirdSpecies(species)
              )
              .map((species, index) => (
                <EnhancedSpeciesCard 
                  key={`${species.id}-${index}`} 
                  species={species} 
                  onSpeciesClick={setSelectedSpecies}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <SpeciesDetailModal
        species={selectedSpecies}
        isOpen={!!selectedSpecies}
        onClose={() => setSelectedSpecies(null)}
      />
    </div>
  );
};

export default BioDivSubSection;