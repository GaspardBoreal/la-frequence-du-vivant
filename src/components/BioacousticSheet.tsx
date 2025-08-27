import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { createSlug } from '@/utils/slugGenerator';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useLexiconData } from '@/hooks/useLexiconData';
import { useLatestSnapshotsForMarche } from '@/hooks/useSnapshotData';
import { useSpeciesTranslationBatch } from '@/hooks/useSpeciesTranslation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Thermometer, Users, Home, Eye, EyeOff, ExternalLink, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BioacousticSheetProps {
  marche: MarcheTechnoSensible;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  radius?: number;
}

// Fonction utilitaire pour identifier les oiseaux (identique à BioDivSubSection)
const isBirdSpecies = (species: BiodiversitySpecies): boolean => {
  const isFromEbird = species.source === 'ebird';
  const isAvesFamily = species.family === 'Aves' || species.family?.toLowerCase().includes('aves');
  const isBirdFamily = species.family?.toLowerCase().includes('bird') || species.family?.toLowerCase().includes('idae');
  const isBirdInName = species.commonName?.toLowerCase().includes('oiseau') || species.commonName?.toLowerCase().includes('bird') || species.scientificName?.toLowerCase().includes('aves');
  return isFromEbird || isAvesFamily || isBirdFamily || isBirdInName;
};

export const BioacousticSheet: React.FC<BioacousticSheetProps> = ({
  marche,
  open,
  onOpenChange,
  radius = 0.5
}) => {
  const navigate = useNavigate();
  const latitude = marche.latitude;
  const longitude = marche.longitude;
  
  // State for radius expansion - use provided radius or default
  const [searchRadius, setSearchRadius] = useState(radius);
  const [debouncedRadius, setDebouncedRadius] = useState(radius);
  const [showExpandDialog, setShowExpandDialog] = useState(false);

  // Debounce du rayon de recherche pour éviter trop d'appels API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(searchRadius);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [searchRadius]);

  const { data: biodiversityData, isLoading: isBiodiversityLoading } = useBiodiversityData({ 
    latitude, 
    longitude, 
    radius: debouncedRadius, // Use debounced radius like in BioDivSubSection
    dateFilter: 'recent' as const // Force same dateFilter as BioDivSubSection default
  });
  const { data: lexiconData } = useLexiconData(latitude, longitude);
  const { data: snapshotsData } = useLatestSnapshotsForMarche(marche.id);

  // Prepare species for translation (identique à BioDivSubSection)
  const speciesForTranslation = useMemo(() => {
    return biodiversityData?.species?.map(species => ({
      scientificName: species.scientificName,
      commonName: species.commonName
    })) || [];
  }, [biodiversityData?.species]);

  // Get translations
  const { data: translationsData } = useSpeciesTranslationBatch(speciesForTranslation);

  // Create translation map
  const translationMap = useMemo(() => {
    if (!translationsData) return new Map();
    
    return new Map(
      translationsData.map(translation => [
        translation.scientificName,
        translation
      ])
    );
  }, [translationsData]);

  // Translated species with French names
  const translatedSpecies = useMemo(() => {
    if (!biodiversityData?.species) return [];
    
    return biodiversityData.species.map(species => {
      const translation = translationMap.get(species.scientificName);
      return {
        ...species,
        commonName: translation?.commonName || species.commonName,
        translationSource: translation?.source || 'original'
      };
    });
  }, [biodiversityData?.species, translationMap]);

  // Calcul des catégories côté client (identique à BioDivSubSection)
  const categoryStats = useMemo(() => {
    if (!biodiversityData?.species) return { all: 0, faune: 0, plants: 0, fungi: 0, others: 0 };
    
    const stats = {
      all: biodiversityData.species.length,
      faune: biodiversityData.species.filter(s => s.kingdom === 'Animalia').length,
      plants: biodiversityData.species.filter(s => s.kingdom === 'Plantae').length,
      fungi: biodiversityData.species.filter(s => s.kingdom === 'Fungi').length,
      others: 0
    };
    
    stats.others = stats.all - stats.faune - stats.plants - stats.fungi;
    
    return stats;
  }, [biodiversityData?.species]);

  // Check if we should show the expand prompt
  const shouldShowExpandPrompt = !isBiodiversityLoading && 
    (!biodiversityData?.species || categoryStats.all === 0) && 
    searchRadius === radius && 
    !showExpandDialog;

  const handleExpandRadius = () => {
    setSearchRadius(5);
  };

  const handleDeclineExpansion = () => {
    setShowExpandDialog(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-xl border-t-2 border-primary/20 overflow-y-auto"
      >
        <SheetHeader className="pb-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <SheetTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-white">
            <MapPin className="h-6 w-6 text-primary" />
            {marche.nomMarche || marche.ville}
          </SheetTitle>
          <p className="text-base text-muted-foreground font-medium mt-2 text-center italic">
            {marche.ville} • {formatDate(marche.date || '')}
          </p>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Territorial Info */}
          {lexiconData?.results?.[0] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Données Territoriales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Population:</span>
                    <p className="text-muted-foreground">
                      {lexiconData.results[0].nb_log?.toLocaleString() || 'N/A'} logements
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Commune:</span>
                    <p className="text-muted-foreground">{lexiconData.results[0].nom_com}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Biodiversity Expansion Prompt */}
          {shouldShowExpandPrompt && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Aucune donnée de biodiversité enregistrée dans un rayon de recherche de {searchRadius < 1 ? `${Math.round(searchRadius * 1000)}m` : `${searchRadius}km`}
                  </p>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-6">
                  Souhaitez-vous que l'on élargisse le rayon de recherche ?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handleExpandRadius} 
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Oui
                  </Button>
                  <Button 
                    onClick={handleDeclineExpansion} 
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                  >
                    Non
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Biodiversity Loading */}
          {isBiodiversityLoading && searchRadius > radius && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Search className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Recherche élargie en cours... (rayon {searchRadius < 1 ? `${Math.round(searchRadius * 1000)}m` : `${searchRadius}km`})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Biodiversity Data */}
          {biodiversityData && categoryStats.all > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Biodiversité ({categoryStats.all} espèces)
                  <Badge variant="outline" className="text-xs ml-2">
                    rayon {debouncedRadius < 1 ? `${Math.round(debouncedRadius * 1000)}m` : `${debouncedRadius}km`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Faune:</span>
                    <span className="font-medium">{categoryStats.faune}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plantes:</span>
                    <span className="font-medium">{categoryStats.plants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Champignons:</span>
                    <span className="font-medium">{categoryStats.fungi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autres:</span>
                    <span className="font-medium">{categoryStats.others}</span>
                  </div>
                </div>
                
                {/* Species List */}
                {translatedSpecies.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Espèces observées :</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {translatedSpecies.slice(0, 8).map((species, index) => (
                        <div key={`${species.scientificName}-${index}`} className="flex justify-between items-start text-xs">
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-foreground">{species.commonName}</p>
                            <p className="text-muted-foreground italic">{species.scientificName}</p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {species.kingdom === 'Animalia' ? 'Faune' : 
                             species.kingdom === 'Plantae' ? 'Plante' : 
                             species.kingdom === 'Fungi' ? 'Champignon' : 'Autre'}
                          </Badge>
                        </div>
                      ))}
                      {translatedSpecies.length > 8 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          Et {translatedSpecies.length - 8} autres espèces...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Biodiversity Data (after declining expansion) */}
          {showExpandDialog && (!biodiversityData?.species || categoryStats.all === 0) && (
            <Card className="border-muted bg-muted/30">
              <CardContent className="p-6 text-center">
                <EyeOff className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucune donnée de biodiversité disponible pour cette zone
                </p>
              </CardContent>
            </Card>
          )}

          {/* Weather Data */}
          {snapshotsData?.weather && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Météo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Température moyenne:</span>
                    <p className="text-muted-foreground">
                      {Number(snapshotsData.weather.temperature_avg).toFixed(1)}°C
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Humidité moyenne:</span>
                    <p className="text-muted-foreground">
                      {Number(snapshotsData.weather.humidity_avg).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Real Estate Transactions */}
          {snapshotsData?.realEstate && snapshotsData.realEstate.transactions_count > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Transactions Immobilières
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {snapshotsData.realEstate.transactions_count} transaction(s) récente(s) dans la zone
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Button to detailed page */}
        <div className="sticky bottom-0 bg-background p-4 border-t border-border/50 mt-6">
          <Button 
            onClick={() => {
              const slug = createSlug(marche.nomMarche || marche.ville, marche.ville);
              navigate(`/bioacoustique/${slug}`);
              onOpenChange(false);
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            📊 Voir la fiche complète
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};