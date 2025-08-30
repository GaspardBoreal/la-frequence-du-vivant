import React, { useState } from 'react';
import { Play, Pause, Volume2, Music, Camera, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';
import { MiniSpectrogramPreview } from './MiniSpectrogramPreview';
import { useSpeciesTranslation, SpeciesTranslation } from '@/hooks/useSpeciesTranslation';

interface EnhancedSpeciesCardProps {
  species: BiodiversitySpecies;
  onSpeciesClick: (species: BiodiversitySpecies) => void;
  translation?: SpeciesTranslation; // Optional pre-fetched translation
}

export const EnhancedSpeciesCard: React.FC<EnhancedSpeciesCardProps> = ({ 
  species, 
  onSpeciesClick, 
  translation: propTranslation 
}) => {
  const [showSpectrogram, setShowSpectrogram] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { playRecording, pause, currentRecording, isPlaying } = useGlobalAudioPlayer();
  
  // Debug logs
  console.log('🔧 EnhancedSpeciesCard debug:', {
    scientificName: species.scientificName,
    propTranslation: propTranslation,
    propSource: propTranslation?.source,
    propConfidence: propTranslation?.confidence
  });

  // Call edge function if we don't have a good French translation
  const shouldCallEdgeFunction = !propTranslation || 
    (propTranslation.source === 'fallback' && propTranslation.confidence === 'low');
  
  const { data: fetchedTranslation, isLoading: isTranslating } = useSpeciesTranslation(
    shouldCallEdgeFunction ? species.scientificName : '', 
    shouldCallEdgeFunction ? species.commonName : ''
  );
  
  // Use fetched translation if available and better than prop, otherwise use prop
  const translation = (fetchedTranslation && fetchedTranslation.source !== 'fallback') 
    ? fetchedTranslation 
    : (propTranslation || fetchedTranslation);

  console.log('🔧 Translation result:', {
    final: translation,
    fetched: fetchedTranslation,
    isTranslating,
    shouldCallEdgeFunction
  });

  const hasAudio = species.xenoCantoRecordings && species.xenoCantoRecordings.length > 0;
  const hasPhoto = species.photoData && species.photoData.source !== 'placeholder';
  const isCurrentlyPlaying = isPlaying && currentRecording?.id === species.xenoCantoRecordings?.[0]?.id;

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAudio) return;
    
    const bestRecording = species.xenoCantoRecordings![0];
    if (isCurrentlyPlaying) {
      pause();
    } else {
      playRecording(bestRecording);
    }
  };

  const handleToggleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAudio) {
      setShowSpectrogram(!showSpectrogram);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-lime-100 text-lime-800 border-lime-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'E': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card 
      className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onSpeciesClick(species)}
    >
      <div className="flex items-center space-x-3">
        {/* Image/Spectrogram Container */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          {showSpectrogram && hasAudio ? (
            <MiniSpectrogramPreview 
              recording={species.xenoCantoRecordings![0]}
              className="w-full h-full"
            />
          ) : (
            <>
              {species.photoData && !imageError ? (
                <img
                  src={species.photoData.url}
                  alt={translation?.commonName || species.commonName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary/40" />
                </div>
              )}
              
              {/* Photo attribution overlay */}
              {species.photoData && !imageError && hasPhoto && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end opacity-0 group-hover:opacity-100">
                  <div className="text-xs text-white p-1 bg-black/50 w-full">
                    {species.photoData.source === 'inaturalist' ? 'iNat' : 
                     species.photoData.source === 'flickr' ? 'Flickr' : 'Photo'}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Audio Quality Badge */}
          {hasAudio && (
            <div className="absolute top-1 right-1">
              <Badge 
                className={`text-xs px-1 py-0.5 ${getQualityColor(species.recordingQuality || 'C')}`}
              >
                {isCurrentlyPlaying ? (
                  <Volume2 className="h-2 w-2 animate-pulse" />
                ) : (
                  <Music className="h-2 w-2" />
                )}
              </Badge>
            </div>
          )}

          {/* Toggle View Button */}
          {hasAudio && (
            <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                size="sm"
                variant="secondary"
                className="h-5 w-5 p-0"
                onClick={handleToggleView}
              >
                <Eye className="h-2 w-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm leading-tight truncate">
              {translation?.commonName || species.commonName}
            </h3>
            
            {/* Audio Controls */}
            {hasAudio && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleAudioClick}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground italic truncate">
            {species.scientificName}
          </p>
          
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {species.source}
            </Badge>
            
            {hasAudio && (
              <Badge variant="outline" className="text-xs">
                Audio {species.recordingQuality}
              </Badge>
            )}
            
            {hasPhoto && (
              <Badge variant="outline" className="text-xs">
                Photo
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            {species.observations} obs • {new Date(species.lastSeen).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </Card>
  );
};