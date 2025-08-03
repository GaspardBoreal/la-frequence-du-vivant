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

interface BioDivSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

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

  // Calcul des catégories d'espèces
  const categoryStats = useMemo(() => {
    if (!biodiversityData?.species) return { all: 0, birds: 0, plants: 0, fungi: 0, others: 0 };
    
    const stats = {
      all: biodiversityData.species.length,
      birds: biodiversityData.species.filter(s => s.kingdom === 'Animalia' && s.family.toLowerCase().includes('bird')).length,
      plants: biodiversityData.species.filter(s => s.kingdom === 'Plantae').length,
      fungi: biodiversityData.species.filter(s => s.kingdom === 'Fungi').length,
      others: biodiversityData.species.filter(s => 
        s.kingdom !== 'Plantae' && 
        s.kingdom !== 'Fungi' && 
        !(s.kingdom === 'Animalia' && s.family.toLowerCase().includes('bird'))
      ).length
    };
    
    return stats;
  }, [biodiversityData?.species]);

  // Filtrage des espèces par catégorie et contributeur
  const filteredSpecies = useMemo(() => {
    if (!biodiversityData?.species) return [];

    let filtered = biodiversityData.species;

    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(species => {
        switch (selectedCategory) {
          case 'plants':
            return species.kingdom === 'Plantae';
          case 'birds':
            return species.kingdom === 'Animalia' && species.family.toLowerCase().includes('bird');
          case 'fungi':
            return species.kingdom === 'Fungi';
          case 'others':
            return species.kingdom !== 'Plantae' && 
                   species.kingdom !== 'Fungi' && 
                   !(species.kingdom === 'Animalia' && species.family.toLowerCase().includes('bird'));
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
  }, [biodiversityData?.species, selectedCategory, selectedSource, selectedConfidence, selectedTimeRange, hasAudioFilter, selectedContributor, searchTerm, sortBy, sortOrder]);

  const summaryStats = useMemo(() => {
    if (!biodiversityData?.species) return null;
    
    const total = filteredSpecies.length;
    const birds = filteredSpecies.filter(s => s.kingdom === 'Animalia' && s.family.toLowerCase().includes('bird')).length;
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

  if (!biodiversityData?.species || biodiversityData.species.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée trouvée</h3>
          <p className="text-muted-foreground">
            Aucune observation de biodiversité trouvée dans un rayon de {debouncedRadius}km autour de {marche.ville}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec métriques */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{summaryStats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.birds}</div>
            <div className="text-sm text-muted-foreground">Oiseaux</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.plants}</div>
            <div className="text-sm text-muted-foreground">Plantes</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{summaryStats.fungi}</div>
            <div className="text-sm text-muted-foreground">Champignons</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.others}</div>
            <div className="text-sm text-muted-foreground">Autres</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{summaryStats.withAudio}</div>
            <div className="text-sm text-muted-foreground">Avec Audio</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">{summaryStats.withPhotos}</div>
            <div className="text-sm text-muted-foreground">Avec Photos</div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Catégorie d'espèces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories ({categoryStats.all})</SelectItem>
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
                <SelectValue placeholder="Source des données" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="gbif">GBIF</SelectItem>
                <SelectItem value="inaturalist">iNaturalist</SelectItem>
                <SelectItem value="ebird">eBird</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={hasAudioFilter} onValueChange={(value: any) => setHasAudioFilter(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Disponibilité audio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="with-audio">Avec audio</SelectItem>
                <SelectItem value="without-audio">Sans audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Onglets par catégorie */}
      <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Toutes ({categoryStats.all})
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
              .filter(species => species.kingdom === 'Animalia' && species.family.toLowerCase().includes('bird'))
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
                !(species.kingdom === 'Animalia' && species.family.toLowerCase().includes('bird'))
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
    </div>
  );
};

export default BioDivSubSection;