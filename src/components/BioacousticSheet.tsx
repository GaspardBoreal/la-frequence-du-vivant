import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { createSlug } from '@/utils/slugGenerator';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { useLexiconData } from '@/hooks/useLexiconData';
import { useLatestSnapshotsForMarche } from '@/hooks/useSnapshotData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Thermometer, Users, Home, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BioacousticSheetProps {
  marche: MarcheTechnoSensible;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BioacousticSheet: React.FC<BioacousticSheetProps> = ({
  marche,
  open,
  onOpenChange
}) => {
  const navigate = useNavigate();
  const latitude = marche.latitude;
  const longitude = marche.longitude;

  const { data: biodiversityData } = useBiodiversityData({ latitude, longitude });
  const { data: lexiconData } = useLexiconData(latitude, longitude);
  const { data: snapshotsData } = useLatestSnapshotsForMarche(marche.id);

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

          {/* Biodiversity Data */}
          {biodiversityData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Biodiversité ({biodiversityData.species.length} espèces)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {biodiversityData.species.slice(0, 6).map((species, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {species.commonName || species.scientificName}
                    </Badge>
                  ))}
                  {biodiversityData.species.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{biodiversityData.species.length - 6} autres
                    </Badge>
                  )}
                </div>
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