// Playlist Parcours View - Groups audio tracks by marche with literary type badges
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, Clock, ChevronDown, Play, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLiteraryTypeBadge } from '@/utils/audioLiteraryTypeDetection';
import type { AudioTrackEnhanced } from '@/hooks/useExplorationAudioPlaylist';

interface PlaylistParcoursViewProps {
  tracks: AudioTrackEnhanced[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  formatTime: (seconds: number) => string;
}

interface MarcheGroup {
  marcheIndex: number;
  marcheName: string;
  marcheLocation?: string;
  tracks: Array<AudioTrackEnhanced & { globalIndex: number }>;
  totalDuration: number;
}

export default function PlaylistParcoursView({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  formatTime
}: PlaylistParcoursViewProps) {
  // Group tracks by marche
  const marcheGroups = useMemo((): MarcheGroup[] => {
    const groups: Map<number, MarcheGroup> = new Map();
    
    tracks.forEach((track, globalIndex) => {
      const key = track.marcheIndex;
      
      if (!groups.has(key)) {
        groups.set(key, {
          marcheIndex: key,
          marcheName: track.marcheName,
          marcheLocation: track.marcheLocation,
          tracks: [],
          totalDuration: 0
        });
      }
      
      const group = groups.get(key)!;
      group.tracks.push({ ...track, globalIndex });
      group.totalDuration += track.duration || 0;
    });
    
    // Sort by marche index
    return Array.from(groups.values()).sort((a, b) => a.marcheIndex - b.marcheIndex);
  }, [tracks]);

  // Find which marche contains the current track
  const currentMarcheIndex = useMemo(() => {
    const currentTrack = tracks[currentTrackIndex];
    return currentTrack?.marcheIndex ?? -1;
  }, [tracks, currentTrackIndex]);

  // Default open state: only current marche is open
  const [openMarches, setOpenMarches] = React.useState<Set<number>>(() => {
    return new Set(currentMarcheIndex >= 0 ? [currentMarcheIndex] : [0]);
  });

  // Update open state when current track changes
  React.useEffect(() => {
    if (currentMarcheIndex >= 0) {
      setOpenMarches(prev => new Set([...prev, currentMarcheIndex]));
    }
  }, [currentMarcheIndex]);

  const toggleMarche = (marcheIndex: number) => {
    setOpenMarches(prev => {
      const next = new Set(prev);
      if (next.has(marcheIndex)) {
        next.delete(marcheIndex);
      } else {
        next.add(marcheIndex);
      }
      return next;
    });
  };

  if (marcheGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Music className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun audio disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {marcheGroups.map((group) => {
        const isCurrentMarche = group.marcheIndex === currentMarcheIndex;
        const isOpen = openMarches.has(group.marcheIndex);
        
        return (
          <Collapsible
            key={group.marcheIndex}
            open={isOpen}
            onOpenChange={() => toggleMarche(group.marcheIndex)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between p-4 h-auto rounded-xl transition-all",
                  isCurrentMarche 
                    ? "bg-accent/20 border border-accent/30 hover:bg-accent/30" 
                    : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                )}
              >
                <div className="flex flex-col items-start gap-1 text-left">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={isCurrentMarche ? "default" : "outline"} 
                      className="text-xs px-2 py-0.5"
                    >
                      Marche {group.marcheIndex + 1}
                    </Badge>
                    {isCurrentMarche && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-accent animate-pulse"
                      />
                    )}
                  </div>
                  <span className="font-semibold text-foreground">
                    {group.marcheName}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {group.marcheLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {group.marcheLocation}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {group.tracks.length} audio{group.tracks.length > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(group.totalDuration)}
                    </span>
                  </div>
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} 
                />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 pr-2 py-2 space-y-1"
                >
                  {group.tracks.map((track, idx) => {
                    const isCurrentTrack = track.globalIndex === currentTrackIndex;
                    const badge = getLiteraryTypeBadge(track.title);
                    
                    return (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
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
                          <div className="flex items-start gap-3 w-full">
                            {/* Play indicator or track number */}
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "font-medium truncate text-sm",
                                  isCurrentTrack ? "text-accent" : "text-foreground"
                                )}>
                                  {track.title}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Literary type badge */}
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 h-5 gap-1",
                                    badge.color
                                  )}
                                >
                                  <span>{badge.icon}</span>
                                  <span className="hidden sm:inline">{badge.label}</span>
                                </Badge>
                                
                                {/* Duration */}
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
                </motion.div>
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
