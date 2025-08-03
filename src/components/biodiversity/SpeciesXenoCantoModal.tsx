import React, { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, ExternalLink, Volume2, Search, Clock, MapPin, User, Mic, Camera, FileAudio } from 'lucide-react';
import { BiodiversitySpecies, XenoCantoRecording } from '@/types/biodiversity';

interface SpeciesXenoCantoModalProps {
  isOpen: boolean;
  onClose: () => void;
  species: BiodiversitySpecies[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export const SpeciesXenoCantoModal: React.FC<SpeciesXenoCantoModalProps> = ({
  isOpen,
  onClose,
  species,
  searchTerm,
  onSearchTermChange
}) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [selectedSonogramSize, setSelectedSonogramSize] = useState<'small' | 'med' | 'large' | 'full'>('med');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSpeciesWithXenoCanto = useMemo(() => {
    return species.filter(s => 
      s.xenoCantoRecordings && 
      s.xenoCantoRecordings.length > 0 &&
      (searchTerm === '' || 
       s.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       s.scientificName.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
      // Trier par qualité d'enregistrement
      const qualityOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
      const aQuality = qualityOrder[a.recordingQuality as keyof typeof qualityOrder] || 0;
      const bQuality = qualityOrder[b.recordingQuality as keyof typeof qualityOrder] || 0;
      return bQuality - aQuality;
    });
  }, [species, searchTerm]);

  const handlePlayAudio = (audioUrl: string, recordingId: string) => {
    if (playingAudio === recordingId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(recordingId);
      }
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-lime-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Enregistrements Xeno-Canto
          </DialogTitle>
          <DialogDescription>
            {filteredSpeciesWithXenoCanto.length} espèces avec enregistrements audio haute qualité
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une espèce..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contrôles de spectrogramme */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium">Taille spectrogramme:</span>
            {(['small', 'med', 'large', 'full'] as const).map((size) => (
              <Button
                key={size}
                variant={selectedSonogramSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSonogramSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>

          {/* Liste des espèces */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {filteredSpeciesWithXenoCanto.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileAudio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune espèce trouvée avec des enregistrements Xeno-Canto</p>
              </div>
            ) : (
              filteredSpeciesWithXenoCanto.map((speciesItem) => (
                <Card key={speciesItem.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Spectrogramme */}
                      <div className="flex-shrink-0">
                        {speciesItem.xenoCantoRecordings?.[0]?.sono?.[selectedSonogramSize] ? (
                          <img
                            src={speciesItem.xenoCantoRecordings[0].sono[selectedSonogramSize]}
                            alt={`Spectrogramme de ${speciesItem.commonName}`}
                            className="w-full lg:w-48 h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full lg:w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
                            <Volume2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Informations */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{speciesItem.commonName}</h3>
                          <p className="text-muted-foreground italic">{speciesItem.scientificName}</p>
                        </div>

                        {/* Badges de qualité et type */}
                        <div className="flex gap-2 flex-wrap">
                          {speciesItem.recordingQuality && (
                            <Badge className={`${getQualityColor(speciesItem.recordingQuality)} text-white`}>
                              Qualité {speciesItem.recordingQuality}
                            </Badge>
                          )}
                          {speciesItem.soundType && (
                            <Badge variant="outline">
                              {speciesItem.soundType}
                            </Badge>
                          )}
                          {speciesItem.behavioralInfo?.sex && (
                            <Badge variant="secondary">
                              {speciesItem.behavioralInfo.sex}
                            </Badge>
                          )}
                        </div>

                        {/* Métadonnées */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {speciesItem.xenoCantoRecordings?.[0] && (
                            <>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {speciesItem.xenoCantoRecordings[0].recordist}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {speciesItem.xenoCantoRecordings[0].length}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {speciesItem.xenoCantoRecordings[0].location}
                              </div>
                              {speciesItem.recordingContext?.equipment && (
                                <div className="flex items-center gap-2">
                                  <Mic className="h-4 w-4" />
                                  {speciesItem.recordingContext.equipment}
                                </div>
                              )}
                              {speciesItem.behavioralInfo?.animalSeen && (
                                <div className="flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  Animal observé
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Contrôles audio */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handlePlayAudio(
                              speciesItem.xenoCantoRecordings?.[0]?.file || '',
                              speciesItem.xenoCantoRecordings?.[0]?.id || ''
                            )}
                            disabled={!speciesItem.xenoCantoRecordings?.[0]?.file}
                            size="sm"
                          >
                            {playingAudio === speciesItem.xenoCantoRecordings?.[0]?.id ? (
                              <Pause className="h-4 w-4 mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            {playingAudio === speciesItem.xenoCantoRecordings?.[0]?.id ? 'Pause' : 'Écouter'}
                          </Button>
                          
                          {speciesItem.xenoCantoRecordings?.[0]?.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(speciesItem.xenoCantoRecordings?.[0]?.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Xeno-Canto
                            </Button>
                          )}
                        </div>

                        {/* Remarques */}
                        {speciesItem.xenoCantoRecordings?.[0]?.remarks && (
                          <p className="text-sm text-muted-foreground italic">
                            "{speciesItem.xenoCantoRecordings[0].remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      </DialogContent>
    </Dialog>
  );
};