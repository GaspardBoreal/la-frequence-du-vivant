import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, Volume2, Music, Camera, Eye, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';
import { MiniSpectrogramPreview } from './MiniSpectrogramPreview';
import { SpeciesTranslation } from '@/hooks/useSpeciesTranslation';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { SpeciesName } from '@/components/species/SpeciesName';
import { useSpeciesPhotoMode } from '@/contexts/SpeciesPhotoModeContext';

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

  // Toujours résoudre la photo de référence iNaturalist (taxa API) — elle
  // remplace systématiquement la 1re photo d'observation iNat, qui peut être
  // une photo d'habitat non pertinente (ex. Pic épeiche identifié au chant).
  const { data: fetchedPhotoData } = useSpeciesPhoto(species.scientificName);

  const taxonRefPhoto = fetchedPhotoData?.photos?.[0]
    ? { url: fetchedPhotoData.photos[0], source: 'inaturalist' as const, attribution: '' }
    : null;

  // Global toggle Photos marcheurs ↔ iNaturalist (no-op hors provider).
  // On NE passe PAS `species.photoData` comme fallback : seul une vraie photo
  // marcheur (ou la ref taxon) est légitime pour la vignette.
  const { mode, getPreferredPhoto } = useSpeciesPhotoMode();
  const preferred = getPreferredPhoto(species.scientificName, taxonRefPhoto?.url);
  const isFieldPhoto = preferred?.source === 'marcheur' || preferred?.source === 'citizen';

  const effectivePhoto = isFieldPhoto && preferred
    ? { url: preferred.url, source: preferred.source, attribution: '' }
    : taxonRefPhoto;
  const isFieldFallback = isFieldPhoto ? false : (preferred?.isFallback === true);

  // Reset image error when the photo URL changes (toggle marcheur ↔ inat)
  useEffect(() => {
    setImageError(false);
  }, [effectivePhoto?.url]);

  // Use the prop translation directly — auto-fill is handled centrally
  // by useFrenchSpeciesNamesAuto via the parent batch hook.
  const translation = propTranslation;

  const hasAudio = species.xenoCantoRecordings && species.xenoCantoRecordings.length > 0;
  const hasPhoto = !!effectivePhoto && !imageError;
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

  const displayTitle = translation?.commonName || species.commonName || species.scientificName;
  const chatBadges = [
    species.source,
    hasAudio ? 'audio' : null,
    hasPhoto ? 'photo' : null,
  ].filter(Boolean).join(',');

  return (
    <Card 
      className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onSpeciesClick(species)}
      data-chat-card=""
      data-chat-title={displayTitle}
      data-chat-subtitle={species.scientificName}
      data-chat-badges={chatBadges}
    >
      <div className="flex items-center space-x-3">
        {/* Image/Spectrogram Container */}
        <div
          className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 ${
            isFieldPhoto ? 'ring-1 ring-emerald-400/50' : ''
          } ${
            isFieldFallback ? 'ring-1 ring-dashed ring-amber-300/60' : ''
          }`}
        >
          {showSpectrogram && hasAudio ? (
            <MiniSpectrogramPreview 
              recording={species.xenoCantoRecordings![0]}
              className="w-full h-full"
            />
          ) : (
            <>
              {effectivePhoto && !imageError ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={effectivePhoto.url}
                    src={effectivePhoto.url}
                    alt={translation?.commonName || species.commonName}
                    className="w-full h-full object-cover absolute inset-0"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    onError={() => setImageError(true)}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary/40" />
                </div>
              )}

              {/* Source badge bottom-right — discret, pleinement visible au hover */}
              {effectivePhoto && !imageError && hasPhoto && (
                <div className="absolute bottom-0.5 right-0.5 z-10 pointer-events-none">
                  <span
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-semibold backdrop-blur shadow ${
                      isFieldFallback
                        ? 'bg-amber-500/85 text-white'
                        : isFieldPhoto
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-sky-500/85 text-white'
                    }`}
                    title={
                      isFieldFallback
                        ? 'Pas encore de photo marcheur — affiche iNaturalist'
                        : isFieldPhoto
                          ? `Photo marcheur${preferred?.observerName ? ' · ' + preferred.observerName : ''}`
                          : 'Photo iNaturalist'
                    }
                  >
                    {isFieldFallback ? (
                      <Camera className="h-2 w-2" />
                    ) : isFieldPhoto ? (
                      <Camera className="h-2 w-2" />
                    ) : (
                      <Sparkles className="h-2 w-2" />
                    )}
                  </span>
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
            <SpeciesName
              scientificName={species.scientificName}
              commonName={translation?.commonName || species.commonName}
              size="sm"
              truncate
              className="font-medium leading-tight"
            />
            
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
          
          <div className="flex items-center gap-1 mt-1 flex-wrap overflow-hidden max-h-[3.5rem]">
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