import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { createSlug } from '@/utils/slugGenerator';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { useLexiconData } from '@/hooks/useLexiconData';
import { useLatestSnapshotsForMarche } from '@/hooks/useSnapshotData';
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

  // Check if we should show the expand prompt
  const shouldShowExpandPrompt = !isBiodiversityLoading && 
    (!biodiversityData?.summary || ((biodiversityData.summary.birds || 0) + (biodiversityData.summary.plants || 0) + (biodiversityData.summary.fungi || 0) + (biodiversityData.summary.others || 0)) === 0) && 
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
          <SheetTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-primary">
            <MapPin className="h-6 w-6 text-primary" />
            {marche.nomMarche || marche.ville}
          </SheetTitle>
          <p className="text-base text-muted-foreground font-medium mt-2">
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
          {biodiversityData && biodiversityData.summary && ((biodiversityData.summary.birds || 0) + (biodiversityData.summary.plants || 0) + (biodiversityData.summary.fungi || 0) + (biodiversityData.summary.others || 0)) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Biodiversité ({((biodiversityData.summary.birds || 0) + (biodiversityData.summary.plants || 0) + (biodiversityData.summary.fungi || 0) + (biodiversityData.summary.others || 0))} espèces)
                  <Badge variant="outline" className="text-xs ml-2">
                    rayon {debouncedRadius < 1 ? `${Math.round(debouncedRadius * 1000)}m` : `${debouncedRadius}km`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Oiseaux:</span>
                    <span className="font-medium">{biodiversityData.summary.birds || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plantes:</span>
                    <span className="font-medium">{biodiversityData.summary.plants || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Champignons:</span>
                    <span className="font-medium">{biodiversityData.summary.fungi || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autres:</span>
                    <span className="font-medium">{biodiversityData.summary.others || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Biodiversity Data (after declining expansion) */}
          {showExpandDialog && (!biodiversityData?.summary || ((biodiversityData.summary.birds || 0) + (biodiversityData.summary.plants || 0) + (biodiversityData.summary.fungi || 0) + (biodiversityData.summary.others || 0)) === 0) && (
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