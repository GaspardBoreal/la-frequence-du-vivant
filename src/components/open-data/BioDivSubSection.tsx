import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Globe, MapPin, ZoomIn, Eye, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useBiodiversityData } from '../../hooks/useBiodiversityData';
import { BiodiversityMetricGrid } from '../biodiversity/BiodiversityMetricGrid';
import { BiodiversityMap } from '../biodiversity/BiodiversityMap';
import SpeciesExplorer from '../biodiversity/SpeciesExplorer';
import { LanguageToggle } from '@/components/ui/language-toggle';

interface BioDivSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

// Utility to identify birds
const isBirdSpecies = (species: any): boolean => {
  return species.source === 'ebird' ||
    species.family === 'Aves' ||
    species.family?.toLowerCase().includes('aves') ||
    species.family?.toLowerCase().includes('idae');
};

const BioDivSubSection: React.FC<BioDivSubSectionProps> = ({ marche, theme }) => {
  const [dateFilter, setDateFilter] = useState<'recent' | 'medium'>('recent');
  const [searchRadius, setSearchRadius] = useState<number>(0.5);
  const [debouncedRadius, setDebouncedRadius] = useState<number>(0.5);
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<string | null>(null);
  const [hasExpanded, setHasExpanded] = useState<boolean>(false);
  const [showExpandDialog, setShowExpandDialog] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRadius(searchRadius), 800);
    return () => clearTimeout(timer);
  }, [searchRadius]);

  const { data: biodiversityData, isLoading, error } = useBiodiversityData({
    latitude: marche.latitude,
    longitude: marche.longitude,
    radius: debouncedRadius,
    dateFilter,
    mode: 'interactive',
  });

  // Summary stats for metric grid
  const summaryStats = useMemo(() => {
    if (!biodiversityData?.species) return null;
    const species = biodiversityData.species;
    const total = species.length;
    const birds = species.filter(isBirdSpecies).length;
    const plants = species.filter(s => s.kingdom === 'Plantae').length;
    const fungi = species.filter(s => s.kingdom === 'Fungi').length;
    const others = total - birds - plants - fungi;
    const withAudio = species.filter(s => s.xenoCantoRecordings && s.xenoCantoRecordings.length > 0).length;
    const withPhotos = species.filter(s => s.photoData && s.photoData.source !== 'placeholder').length;
    return { total, birds, plants, fungi, others, withAudio, withPhotos };
  }, [biodiversityData?.species]);

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

  // Expand radius dialog
  const shouldShowExpandDialog = !biodiversityData?.species ||
    (biodiversityData.species.length === 0 && debouncedRadius === 0.5 && !showExpandDialog && !hasExpanded);

  if (shouldShowExpandDialog) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background via-primary/5 to-secondary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <CardContent className="relative p-8 text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                <ZoomIn className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }} className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Aucune donnée de biodiversité</h3>
              <p className="text-muted-foreground leading-relaxed">
                Aucune observation dans un rayon de
                <span className="inline-flex items-center mx-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">500 mètres</span>
                autour de {marche.ville}.
              </p>
              <div className="bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-xl p-4 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Élargir à
                  <span className="inline-flex items-center mx-1 px-3 py-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold rounded-full shadow-sm">5 kilomètres</span>
                  ?
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="flex gap-4 justify-center mt-8">
              <Button onClick={() => { setSearchRadius(5); setDebouncedRadius(5); setHasExpanded(true); }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg px-8 py-3 font-medium">
                <ZoomIn className="h-4 w-4 mr-2" />Oui, élargir
              </Button>
              <Button onClick={() => setShowExpandDialog(true)} variant="outline" className="border-2 px-8 py-3">
                <Eye className="h-4 w-4 mr-2" />Non, continuer
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if ((!biodiversityData?.species || biodiversityData.species.length === 0) && showExpandDialog) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée trouvée</h3>
          <p className="text-muted-foreground">
            Aucune observation dans un rayon de {debouncedRadius < 1 ? `${Math.round(debouncedRadius * 1000)}m` : `${debouncedRadius}km`} autour de {marche.ville}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleMetricFilterChange = (filter: string | null) => {
    setSelectedMetricFilter(filter);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      {summaryStats && (
        <BiodiversityMetricGrid
          summary={{
            totalSpecies: summaryStats.total,
            birds: summaryStats.birds,
            plants: summaryStats.plants,
            fungi: summaryStats.fungi,
            others: summaryStats.others,
            recentObservations: 0,
            withAudio: summaryStats.withAudio,
            withPhotos: summaryStats.withPhotos,
          }}
          selectedFilter={selectedMetricFilter}
          onFilterChange={handleMetricFilterChange}
        />
      )}

      {/* Mobile radius badge */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="md:hidden sticky top-4 z-50">
        <div className="flex justify-center">
          <div className="inline-flex items-center px-6 py-4 bg-orange-500 text-white rounded-full shadow-2xl border-2 border-white/30 backdrop-blur-sm">
            <Target className="h-5 w-5 mr-2" />
            <span className="font-bold text-base">
              Rayon: {debouncedRadius < 1 ? `${Math.round(debouncedRadius * 1000)}m` : `${debouncedRadius}km`}
            </span>
            <MapPin className="h-5 w-5 ml-2" />
          </div>
        </div>
      </motion.div>

      {/* Radius slider */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Rayon de recherche:</Label>
              <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                {searchRadius < 1 ? `${Math.round(searchRadius * 1000)}m` : `${searchRadius}km`}
              </Badge>
              {hasExpanded && <Badge variant="secondary" className="text-xs">Élargi</Badge>}
            </div>
            <LanguageToggle size="sm" />
          </div>
          <Slider
            value={[searchRadius]}
            onValueChange={v => setSearchRadius(v[0])}
            max={5} min={0.5} step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5km</span><span>2.75km</span><span>5km</span>
          </div>
        </div>
      </Card>

      {/* Unified SpeciesExplorer */}
      {biodiversityData?.species && (
        <SpeciesExplorer
          species={biodiversityData.species}
          showMap
          mapContent={(filteredSpecies) => (
            <div className="h-[600px]">
              <BiodiversityMap
                data={{ ...biodiversityData, species: filteredSpecies }}
                centerLat={marche.latitude}
                centerLon={marche.longitude}
              />
            </div>
          )}
        />
      )}
    </div>
  );
};

export default BioDivSubSection;
