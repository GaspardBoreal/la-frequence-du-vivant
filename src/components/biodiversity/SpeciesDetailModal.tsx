import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  ExternalLink, 
  Calendar, 
  User, 
  MapPin, 
  Camera, 
  Volume2,
  X,
  Eye
} from 'lucide-react';
import { BiodiversitySpecies } from '@/types/biodiversity';

interface SpeciesDetailModalProps {
  species: BiodiversitySpecies | null;
  isOpen: boolean;
  onClose: () => void;
}

const SpeciesDetailModal: React.FC<SpeciesDetailModalProps> = ({ 
  species, 
  isOpen, 
  onClose 
}) => {
  if (!species) return null;

  const sourceColors = {
    ebird: 'hsl(var(--chart-1))',
    gbif: 'hsl(var(--chart-2))',
    inaturalist: 'hsl(var(--chart-3))'
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">
              {species.commonName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image de l'espèce */}
          {species.photos && species.photos.length > 0 && (
            <div className="relative h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={species.photos[0]}
                alt={species.commonName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute top-2 right-2">
                <Camera className="h-4 w-4 text-white drop-shadow-lg" />
              </div>
            </div>
          )}

          {/* Informations principales */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{species.commonName}</h3>
                <p className="text-sm text-muted-foreground italic">{species.scientificName}</p>
                <p className="text-sm text-muted-foreground">Famille: {species.family}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="secondary"
                  style={{ backgroundColor: `${sourceColors[species.source]}20`, color: sourceColors[species.source] }}
                >
                  {species.source.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {species.kingdom}
                </Badge>
                {species.conservationStatus && (
                  <Badge variant="outline">
                    {species.conservationStatus}
                  </Badge>
                )}
                {species.audioUrl && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    Audio
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{species.observations} observations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Vu le {formatDate(species.lastSeen)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations détaillées */}
          {species.attributions && species.attributions.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-foreground">Observations récentes</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {species.attributions.slice(0, 5).map((attribution, index) => (
                    <div key={index} className="border-l-2 border-muted pl-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {attribution.observerName || 'Observateur anonyme'}
                        </span>
                        {attribution.observerInstitution && (
                          <Badge variant="outline" className="text-xs">
                            {attribution.observerInstitution}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(attribution.date)}</span>
                      </div>
                      
                      {attribution.locationName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{attribution.locationName}</span>
                        </div>
                      )}
                      
                      {attribution.originalUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="p-0 h-auto text-xs"
                        >
                          <a 
                            href={attribution.originalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Voir l'observation originale
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio et sonogramme */}
          {(species.audioUrl || species.sonogramUrl) && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Enregistrements audio
                </h4>
                <div className="space-y-3">
                  {species.sonogramUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Sonogramme</p>
                      <img
                        src={species.sonogramUrl}
                        alt="Sonogramme"
                        className="w-full h-24 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {species.audioUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Enregistrement</p>
                      <audio controls className="w-full">
                        <source src={species.audioUrl} type="audio/mpeg" />
                        Votre navigateur ne supporte pas l'élément audio.
                      </audio>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpeciesDetailModal;