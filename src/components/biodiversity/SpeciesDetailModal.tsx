import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { LanguageToggle } from '../ui/language-toggle';
import { 
  ExternalLink, 
  Calendar, 
  User, 
  MapPin, 
  Camera, 
  Volume2,
  Eye,
  ChevronDown,
  ChevronUp,
  Expand,
  ImageIcon
} from 'lucide-react';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useSpeciesTranslation } from '@/hooks/useSpeciesTranslation';

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
  const [showAllObservations, setShowAllObservations] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  const { data: translation, isLoading: translationLoading } = useSpeciesTranslation(
    species?.scientificName || '',
    species?.commonName
  );
  
  if (!species) return null;

  const displayName = translation?.commonName || species.commonName;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {translationLoading ? (
                <div className="h-6 bg-muted/50 rounded animate-pulse w-48" />
              ) : (
                displayName
              )}
            </DialogTitle>
            <LanguageToggle size="sm" />
          </div>
        </DialogHeader>

        {/* Layout principal - deux colonnes sur desktop, vertical sur mobile */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Colonne gauche - Image */}
          <div className="md:w-1/3 flex-shrink-0">
            {species.photos && species.photos.length > 0 ? (
              <div className="space-y-3">
                {/* Image principale */}
                <div 
                  className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group"
                  onClick={() => setShowLightbox(true)}
                >
                  <img
                    src={species.photos[selectedImageIndex]}
                    alt={species.commonName}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* Overlay avec indicateurs */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  
                  {/* Badge "Photo disponible" */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-md">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Photo disponible
                    </Badge>
                  </div>
                  
                  {/* Bouton agrandir */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-md">
                      <Expand className="h-4 w-4 mr-1" />
                      Agrandir
                    </Button>
                  </div>
                </div>
                
                {/* Vignettes pour images multiples */}
                {species.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {species.photos.map((photo, index) => (
                      <div
                        key={index}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                          selectedImageIndex === index 
                            ? 'ring-2 ring-primary shadow-md' 
                            : 'hover:opacity-80'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={photo}
                          alt={`${species.commonName} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 md:h-96 rounded-xl bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-muted-foreground/20">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
                  <Camera className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h4 className="font-medium text-muted-foreground mb-2">{species.commonName}</h4>
                <p className="text-sm text-muted-foreground/80">Aucune photo disponible</p>
              </div>
            )}
          </div>

          {/* Colonne droite - Informations */}
          <div className="md:w-2/3 space-y-4">
            {/* Informations principales */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  {translationLoading ? (
                    <div className="space-y-2">
                      <div className="h-5 bg-muted/50 rounded animate-pulse w-40" />
                      <div className="h-4 bg-muted/30 rounded animate-pulse w-32" />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-foreground">{displayName}</h3>
                      <p className="text-sm text-muted-foreground italic">{species.scientificName}</p>
                      <p className="text-sm text-muted-foreground">Famille: {species.family}</p>
                      
                      {/* Indicateur de traduction */}
                      {translation && translation.source !== 'fallback' && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              translation.confidence === 'high' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : translation.confidence === 'medium'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            Traduction {translation.confidence} - {translation.source}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
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
                          className="w-full h-20 object-cover rounded border"
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
        </div>

        {/* Observations détaillées - Pleine largeur */}
        {species.attributions && species.attributions.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">Observations récentes</h4>
                {species.attributions.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllObservations(!showAllObservations)}
                    className="flex items-center gap-1"
                  >
                    {showAllObservations ? (
                      <>
                        Voir moins
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Voir plus ({species.attributions.length - 3} autres)
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {(showAllObservations ? species.attributions : species.attributions.slice(0, 3)).map((attribution, index) => (
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
        
        {/* Lightbox pour l'image en grand */}
        {showLightbox && species.photos && species.photos.length > 0 && (
          <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
            <DialogContent className="max-w-6xl max-h-[95vh] p-2">
              <div className="relative">
                <img
                  src={species.photos[selectedImageIndex]}
                  alt={species.commonName}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                />
                
                {/* Navigation entre images */}
                {species.photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2">
                      {species.photos.map((_, index) => (
                        <button
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            selectedImageIndex === index 
                              ? 'bg-primary' 
                              : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Info sur l'image */}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                    {selectedImageIndex + 1} / {species.photos.length}
                  </Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpeciesDetailModal;