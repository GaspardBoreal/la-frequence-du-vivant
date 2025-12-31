// Playlist Selection View - Filter audio by literary types with shareable URLs
import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Clock, Share2, Check, Music, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getAvailableTypesFromTracks, 
  getLiteraryTypeBadge,
  type AvailableLiteraryType 
} from '@/utils/audioLiteraryTypeDetection';
import type { TextType } from '@/types/textTypes';
import type { AudioTrackEnhanced } from '@/hooks/useExplorationAudioPlaylist';

interface PlaylistSelectionViewProps {
  tracks: AudioTrackEnhanced[];
  selectedTypes: Set<TextType>;
  onTypesChange: (types: Set<TextType>) => void;
  onPlaySelection: () => void;
  onTrackSelect: (index: number) => void;
  currentTrackIndex: number;
  formatTime: (seconds: number) => string;
  explorationSlug: string;
}

export default function PlaylistSelectionView({
  tracks,
  selectedTypes,
  onTypesChange,
  onPlaySelection,
  onTrackSelect,
  currentTrackIndex,
  formatTime,
  explorationSlug
}: PlaylistSelectionViewProps) {
  // Get available types from tracks
  const availableTypes = useMemo(() => 
    getAvailableTypesFromTracks(tracks),
    [tracks]
  );

  // Filter tracks based on selected types
  const filteredTracks = useMemo(() => {
    if (selectedTypes.size === 0) return [];
    
    return tracks
      .map((track, index) => ({ ...track, globalIndex: index }))
      .filter(track => {
        const badge = getLiteraryTypeBadge(track.title);
        // Include tracks whose detected type is in selectedTypes
        // Also check if 'all' types are effectively selected by having all available types selected
        const detectedType = badge.label !== 'Audio' ? 
          availableTypes.find(t => t.info.label === badge.label)?.type : null;
        return detectedType && selectedTypes.has(detectedType);
      });
  }, [tracks, selectedTypes, availableTypes]);

  // Calculate total duration of filtered selection
  const totalFilteredDuration = useMemo(() => 
    filteredTracks.reduce((sum, t) => sum + (t.duration || 0), 0),
    [filteredTracks]
  );

  // Toggle type selection
  const handleTypeToggle = useCallback((type: TextType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    onTypesChange(newSet);
  }, [selectedTypes, onTypesChange]);

  // Select all types
  const handleSelectAll = useCallback(() => {
    const allTypes = new Set(availableTypes.map(t => t.type));
    onTypesChange(allTypes);
  }, [availableTypes, onTypesChange]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    onTypesChange(new Set());
  }, [onTypesChange]);

  // Generate and share URL
  const handleShareSelection = useCallback(async () => {
    if (selectedTypes.size === 0) {
      toast.error('Sélectionnez au moins un type littéraire');
      return;
    }

    const typesParam = Array.from(selectedTypes).join(',');
    const url = `${window.location.origin}/galerie-fleuve/exploration/${explorationSlug}/ecouter?types=${typesParam}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Sélection audio - Galerie Fleuve',
          text: `Écoutez cette sélection : ${Array.from(selectedTypes).map(t => 
            availableTypes.find(at => at.type === t)?.info.label
          ).filter(Boolean).join(', ')}`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié !', {
          description: 'Partagez ce lien pour écouter cette sélection'
        });
      }
    } catch (err) {
      // User cancelled share or error occurred
      if ((err as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié !');
      }
    }
  }, [selectedTypes, explorationSlug, availableTypes]);

  if (availableTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Music className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun type littéraire détecté</p>
        <p className="text-xs mt-2">Les titres des audios ne contiennent pas de mots-clés reconnus</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Filtrer par type</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs h-7 px-2"
          >
            Tout
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-xs h-7 px-2"
          >
            Aucun
          </Button>
        </div>
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((typeInfo) => {
          const isSelected = selectedTypes.has(typeInfo.type);
          
          return (
            <motion.button
              key={typeInfo.type}
              onClick={() => handleTypeToggle(typeInfo.type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
                isSelected
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-muted bg-muted/30 text-muted-foreground hover:border-muted-foreground/50"
              )}
            >
              <span className="text-lg">{typeInfo.info.icon}</span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{typeInfo.info.label}</span>
                <span className="text-xs opacity-70">
                  {typeInfo.count} audio{typeInfo.count > 1 ? 's' : ''} · {formatTime(typeInfo.totalDuration)}
                </span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 ml-1" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection summary & actions */}
      <AnimatePresence mode="wait">
        {selectedTypes.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent/10 rounded-xl p-4 space-y-3 border border-accent/20"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-accent">
                  {filteredTracks.length} audio{filteredTracks.length > 1 ? 's' : ''} sélectionné{filteredTracks.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Durée totale : {formatTime(totalFilteredDuration)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareSelection}
                  className="gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Partager</span>
                </Button>
                <Button
                  size="sm"
                  onClick={onPlaySelection}
                  disabled={filteredTracks.length === 0}
                  className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Écouter
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator className="my-2" />

      {/* Filtered tracks list */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground mb-2">
          {selectedTypes.size === 0 
            ? 'Sélectionnez un ou plusieurs types pour voir les audios correspondants'
            : `${filteredTracks.length} résultat${filteredTracks.length > 1 ? 's' : ''}`
          }
        </p>
        
        <AnimatePresence>
          {filteredTracks.map((track, idx) => {
            const badge = getLiteraryTypeBadge(track.title);
            const isCurrentTrack = track.globalIndex === currentTrackIndex;
            
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => onTrackSelect(track.globalIndex)}
                  className={cn(
                    "w-full justify-start text-left p-3 h-auto rounded-lg transition-all",
                    isCurrentTrack 
                      ? "bg-accent/15 border border-accent/25" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Play indicator or index */}
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      {isCurrentTrack ? (
                        <Play className="h-4 w-4 text-accent fill-accent" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    
                    {/* Track info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className={cn(
                        "font-medium truncate text-sm block",
                        isCurrentTrack ? "text-accent" : "text-foreground"
                      )}>
                        {track.title}
                      </span>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-5 gap-1",
                            badge.color
                          )}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </Badge>
                        
                        {track.marcheName && (
                          <span className="text-xs text-muted-foreground">
                            {track.marcheName}
                          </span>
                        )}
                        
                        {track.duration && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(track.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
