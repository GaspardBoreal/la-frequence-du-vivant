import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Play, Pause, Volume2, User, MapPin, ExternalLink, Bird } from 'lucide-react';
import { BiodiversitySpecies } from '@/types/biodiversity';

interface SpeciesAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  species: BiodiversitySpecies[];
  apiSource: 'ebird' | 'inaturalist';
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export const SpeciesAudioModal: React.FC<SpeciesAudioModalProps> = ({
  isOpen,
  onClose,
  species,
  apiSource,
  searchTerm,
  onSearchTermChange
}) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSpecies = useMemo(() => {
    return species
      .filter(s => s.source === apiSource && (s.audioUrl || s.sonogramUrl))
      .filter(s => 
        s.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [species, apiSource, searchTerm]);

  const apiColors = {
    ebird: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      accent: 'text-blue-600',
      icon: 'text-blue-500'
    },
    inaturalist: {
      badge: 'bg-green-100 text-green-800 border-green-200',
      accent: 'text-green-600',
      icon: 'text-green-500'
    }
  };

  const currentColors = apiColors[apiSource];

  const handlePlayAudio = (audioUrl: string, speciesId: string) => {
    if (playingAudio === speciesId) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudio(null);
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.play().then(() => {
        setPlayingAudio(speciesId);
      }).catch(error => {
        console.error('Error playing audio:', error);
      });

      audio.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const totalWithAudio = species.filter(s => s.source === apiSource && s.audioUrl).length;
  const totalWithSonogram = species.filter(s => s.source === apiSource && s.sonogramUrl).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bird className="h-5 w-5" />
              Chants d'oiseaux - {apiSource === 'ebird' ? 'eBird' : 'iNaturalist'}
            </div>
            <Badge className={currentColors.badge}>
              {filteredSpecies.length} espèces
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalWithAudio}</div>
            <div className="text-sm text-gray-600">Avec chant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalWithSonogram}</div>
            <div className="text-sm text-gray-600">Avec sonogramme</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredSpecies.length}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une espèce..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des espèces */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredSpecies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucune espèce trouvée pour cette recherche' : 'Aucune espèce avec données audio disponible'}
            </div>
          ) : (
            filteredSpecies.map((speciesItem) => {
              const attribution = speciesItem.attributions[0]; // Premier observateur
              return (
                <Card key={speciesItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Sonogramme */}
                      <div className="flex-shrink-0">
                        {speciesItem.sonogramUrl ? (
                          <img 
                            src={speciesItem.sonogramUrl} 
                            alt={`Sonogramme de ${speciesItem.commonName}`}
                            className="w-32 h-20 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="128" height="80" viewBox="0 0 128 80">
                                  <rect width="128" height="80" fill="#f3f4f6"/>
                                  <text x="64" y="45" font-family="Arial" font-size="12" text-anchor="middle" fill="#6b7280">🎵</text>
                                </svg>
                              `)}`;
                            }}
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <Volume2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informations de l'espèce */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {speciesItem.commonName}
                            </h3>
                            <p className="text-sm text-gray-600 italic">
                              {speciesItem.scientificName}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {speciesItem.audioUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePlayAudio(speciesItem.audioUrl!, speciesItem.id)}
                                className="flex items-center gap-1"
                              >
                                {playingAudio === speciesItem.id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                {playingAudio === speciesItem.id ? 'Pause' : 'Écouter'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Informations sur l'observateur */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Observé par {attribution.observerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{attribution.locationName}</span>
                          </div>
                          <div>{attribution.date}</div>
                        </div>

                        {/* Liens externes */}
                        <div className="flex items-center gap-2 mt-2">
                          {attribution.originalUrl && (
                            <a
                              href={attribution.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors border border-blue-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Voir sur {apiSource === 'ebird' ? 'eBird' : 'iNaturalist'}
                            </a>
                          )}
                          {speciesItem.audioUrl && (
                            <a
                              href={speciesItem.audioUrl.replace('https:', 'https://xeno-canto.org')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 rounded transition-colors border border-orange-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                              xeno-canto
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};