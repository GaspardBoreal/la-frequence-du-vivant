import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { AudioIndicator } from './AudioIndicator';
import { MiniSpectrogramPreview } from './MiniSpectrogramPreview';
import { Play, Pause, Loader2 } from 'lucide-react';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';

interface AudioSpeciesCardProps {
  species: BiodiversitySpecies;
  onSpeciesClick: (species: BiodiversitySpecies) => void;
  photoUrl: string;
  hasPhoto: boolean;
  children?: React.ReactNode;
}

export const AudioSpeciesCard = ({ 
  species, 
  onSpeciesClick, 
  photoUrl, 
  hasPhoto, 
  children 
}: AudioSpeciesCardProps) => {
  const { playRecording, pause, currentRecording, isPlaying, isLoading } = useGlobalAudioPlayer();
  const [showSpectrogram, setShowSpectrogram] = useState(false);
  
  const hasAudio = species.source === 'ebird' && species.xenoCantoRecordings && species.xenoCantoRecordings.length > 0;
  const bestRecording = hasAudio ? species.xenoCantoRecordings?.[0] : null;
  const isCurrentlyPlaying = currentRecording?.id === bestRecording?.id && isPlaying;

  const handleAudioClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bestRecording) return;

    if (isCurrentlyPlaying) {
      pause();
    } else {
      await playRecording(bestRecording);
    }
  };

  const handleSpectrogramToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSpectrogram(!showSpectrogram);
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-border/50 hover:border-primary/30 backdrop-blur-sm bg-card/80"
      onClick={() => onSpeciesClick(species)}
    >
      <CardContent className="p-0">
        <div className="relative">
          {/* Image ou Spectrogramme */}
          <div className="relative h-32 overflow-hidden rounded-t-lg">
            {hasAudio && showSpectrogram && bestRecording ? (
              <MiniSpectrogramPreview 
                recording={bestRecording}
                className="w-full h-full"
              />
            ) : (
              <img
                src={photoUrl}
                alt={species.commonName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            
            {/* Overlay audio pour eBird */}
            {hasAudio && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAudioClick}
                    className="bg-white/90 hover:bg-white text-primary border-0 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentlyPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSpectrogramToggle}
                    className="bg-white/90 hover:bg-white text-primary border-0 shadow-lg text-xs"
                  >
                    {showSpectrogram ? 'Photo' : 'Spectro'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Contenu */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors duration-200">
                {species.commonName}
              </h3>
              {children}
            </div>
            
            <p className="text-xs text-muted-foreground italic truncate mb-3">
              {species.scientificName}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge 
                variant={species.source === 'ebird' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {species.source}
              </Badge>
              
              {hasPhoto && (
                <Badge variant="outline" className="text-xs">
                  Photo
                </Badge>
              )}
              
              {hasAudio && (
                <AudioIndicator 
                  recordings={species.xenoCantoRecordings}
                  isPlaying={isCurrentlyPlaying}
                />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {species.observations} obs. • {species.lastSeen}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};