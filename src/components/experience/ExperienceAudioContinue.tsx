// "Wahouhh" Experience Audio Continue - Beautiful immersive audio player

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useExploration } from '@/hooks/useExplorations';
import { useExplorationPages } from '@/hooks/useExplorationPages';
import { useExplorationAudioPlaylist } from '@/hooks/useExplorationAudioPlaylist';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Clock,
  List,
  ArrowLeft,
  Shuffle,
  Repeat,
  MapPin,
  Music,
  Waves
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import EcoAudioVisualizer from '@/components/audio/EcoAudioVisualizer';
import ExperienceFooter from '@/components/experience/ExperienceFooter';
import type { XenoCantoRecording } from '@/types/biodiversity';
import type { AudioTrackEnhanced } from '@/hooks/useExplorationAudioPlaylist';
import PodcastNavigationHeader from '@/components/experience/PodcastNavigationHeader';
import type { AudioType } from '@/components/audio/AudioTypeSelector';

// Helper function to convert AudioTrackEnhanced to XenoCantoRecording
const trackToXenoCantoRecording = (track: AudioTrackEnhanced): XenoCantoRecording => ({
  id: track.id,
  file: track.url,
  url: track.url,
  fileName: `${track.title}.mp3`,
  sono: { small: '', med: '', large: '', full: '' },
  osci: { small: '', med: '', large: '' },
  quality: 'A',
  length: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00',
  type: 'song',
  sex: '',
  stage: '',
  method: '',
  recordist: '',
  date: '',
  time: '',
  location: track.marcheName || '',
  latitude: '',
  longitude: '',
  altitude: '',
  license: ''
});

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function ExperienceAudioContinue() {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();
  
  // Data fetching
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: pages, isLoading: pagesLoading } = useExplorationPages(exploration?.id || '');
  const { 
    audioPlaylist, 
    totalDuration, 
    totalMarches, 
    totalTracks,
    isLoading: playlistLoading,
    isEmpty 
  } = useExplorationAudioPlaylist(exploration?.id || '');

  // Audio player
  const { 
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    volume,
    audioRef,
    playRecording,
    pause,
    setVolume,
    seekTo
  } = useGlobalAudioPlayer();
  
  // State management
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playMode, setPlayMode] = useState<'order' | 'shuffle' | 'repeat'>('order');
  const [selectedAudioType, setSelectedAudioType] = useState<AudioType | 'all'>('all');
  
  // Deep link modal state
  const [pendingAudioId, setPendingAudioId] = useState<string | null>(null);
  const [showDeepLinkModal, setShowDeepLinkModal] = useState(false);

  // Find Audio Page content - try both 'audio' and 'Audio' types
  const audioPage = pages?.find(page => 
    page.type === 'audio' || page.type === 'Audio' || page.nom?.toLowerCase().includes('audio')
  );
  const audioPageText = audioPage?.description || '';

  // Classification function for audio type
  const classifyTrack = useCallback((t: AudioTrackEnhanced): AudioType => {
    // Priorité au type stocké en base
    if (t.type_audio) {
      return t.type_audio as AudioType;
    }
    // Fallback: classification par mots-clés
    const text = `${t.title} ${t.description || ''} ${t.marcheName || ''}`.toLowerCase();
    if (text.includes('dordogne')) return 'dordogne';
    if (text.includes('gaspard') || text.includes('parle')) return 'gaspard';
    return 'sounds';
  }, []);

  // Filtered playlist based on selected audio type
  const filteredPlaylist = useMemo(() => {
    if (selectedAudioType === 'all') return audioPlaylist;
    return audioPlaylist.filter(track => classifyTrack(track) === selectedAudioType);
  }, [audioPlaylist, selectedAudioType, classifyTrack]);

  // Calculate total duration for the filtered playlist
  const totalDurationSeconds = useMemo(() => 
    filteredPlaylist.reduce((sum, t) => sum + (t.duration || 0), 0), 
    [filteredPlaylist]
  );

  // Current track logic - based on filtered playlist
  const currentTrack = audioPlaylist[currentTrackIndex];
  const currentFilteredIndex = useMemo(() => {
    if (!currentTrack) return -1;
    return filteredPlaylist.findIndex(t => t.id === currentTrack.id);
  }, [filteredPlaylist, currentTrack]);

  // Smart duration: use database duration as fallback when player hasn't loaded yet
  const currentTrackDuration = useMemo(() => {
    return currentTrack?.duration || 0;
  }, [currentTrack]);

  // Display duration: prefer player duration if available, else use database duration
  const displayDuration = duration > 0 ? duration : currentTrackDuration;
  
  // Calculate remaining duration (must be after currentTrack definition)
  const remainingDurationSeconds = useMemo(() => {
    if (currentFilteredIndex < 0) return totalDurationSeconds;
    return filteredPlaylist
      .slice(currentFilteredIndex)
      .reduce((sum, t) => sum + (t.duration || 0), 0);
  }, [filteredPlaylist, currentFilteredIndex, totalDurationSeconds]);

  const canGoNext = currentFilteredIndex < filteredPlaylist.length - 1 && currentFilteredIndex >= 0;
  const canGoPrevious = currentFilteredIndex > 0;

  // Build header tracks with audio type classification
  const headerTracks = useMemo(() => {
    return audioPlaylist.map(t => ({
      id: t.id,
      title: t.title,
      marche: t.marcheName,
      type: classifyTrack(t)
    }));
  }, [audioPlaylist, classifyTrack]);

  // Auto-advance to next track when current ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (canGoNext) {
        handleNextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioRef, canGoNext, currentTrackIndex]);

  // Initialize first track or handle deep link to specific audio
  useEffect(() => {
    if (audioPlaylist.length === 0) return;
    
    // Check for audio deep link parameter
    const urlParams = new URLSearchParams(window.location.search);
    const audioId = urlParams.get('audio');
    
    if (audioId) {
      const trackIndex = audioPlaylist.findIndex(t => t.id === audioId);
      if (trackIndex >= 0) {
        setCurrentTrackIndex(trackIndex);
        setPendingAudioId(audioId);
        setShowDeepLinkModal(true); // Show modal instead of auto-playing
        
        // Clean up URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('audio');
        window.history.replaceState(null, '', cleanUrl.toString());
        return;
      }
    }
    
    // Default: initialize first track if no recording is playing
    if (!currentRecording) {
      const firstTrack = audioPlaylist[0];
      if (firstTrack) {
        setCurrentTrackIndex(0);
      }
    }
  }, [audioPlaylist, currentRecording]);

  // Handler to start shared audio on user click
  const handleStartSharedAudio = useCallback(() => {
    if (pendingAudioId && currentTrack) {
      playRecording(trackToXenoCantoRecording(currentTrack));
      setShowDeepLinkModal(false);
      setPendingAudioId(null);
    }
  }, [pendingAudioId, currentTrack, playRecording]);

  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;

    if (currentRecording?.url === currentTrack.url && isPlaying) {
      pause();
    } else {
      playRecording(trackToXenoCantoRecording(currentTrack));
    }
  }, [currentTrack, currentRecording, isPlaying, pause, playRecording]);

  const handleNextTrack = useCallback(() => {
    if (canGoNext && currentFilteredIndex >= 0) {
      // Get next track from filtered playlist
      const nextFilteredTrack = filteredPlaylist[currentFilteredIndex + 1];
      if (nextFilteredTrack) {
        // Find global index for state management
        const nextGlobalIndex = audioPlaylist.findIndex(t => t.id === nextFilteredTrack.id);
        setCurrentTrackIndex(nextGlobalIndex);
        playRecording(trackToXenoCantoRecording(nextFilteredTrack));
      }
    }
  }, [currentFilteredIndex, canGoNext, filteredPlaylist, audioPlaylist, playRecording]);

  const handlePreviousTrack = useCallback(() => {
    if (canGoPrevious && currentFilteredIndex > 0) {
      // Get previous track from filtered playlist
      const prevFilteredTrack = filteredPlaylist[currentFilteredIndex - 1];
      if (prevFilteredTrack) {
        // Find global index for state management
        const prevGlobalIndex = audioPlaylist.findIndex(t => t.id === prevFilteredTrack.id);
        setCurrentTrackIndex(prevGlobalIndex);
        playRecording(trackToXenoCantoRecording(prevFilteredTrack));
      }
    }
  }, [currentFilteredIndex, canGoPrevious, filteredPlaylist, audioPlaylist, playRecording]);

  // Handle audio type change - reset to first track of that type
  const handleAudioTypeChange = useCallback((type: AudioType | 'all') => {
    setSelectedAudioType(type);
    // Find first track of the new type
    const newFilteredPlaylist = type === 'all' 
      ? audioPlaylist 
      : audioPlaylist.filter(track => classifyTrack(track) === type);
    
    if (newFilteredPlaylist.length > 0) {
      const firstTrack = newFilteredPlaylist[0];
      const globalIndex = audioPlaylist.findIndex(t => t.id === firstTrack.id);
      setCurrentTrackIndex(globalIndex);
      playRecording(trackToXenoCantoRecording(firstTrack));
    }
  }, [audioPlaylist, classifyTrack, playRecording]);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    setVolume(newVolume[0]);
  }, [setVolume]);

  const handleProgressChange = useCallback((newTime: number[]) => {
    const time = newTime[0];
    seekTo(time);
  }, [seekTo]);

  const handleTrackSelect = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    const track = audioPlaylist[index];
    if (track) {
      playRecording(trackToXenoCantoRecording(track));
    }
    setShowPlaylist(false);
  }, [audioPlaylist, playRecording]);

  if (explorationLoading || pagesLoading || playlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dordogne-experience">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent/30 border-t-accent mx-auto"></div>
            <Waves className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-accent" />
          </div>
          <p className="text-accent dordogne-body">Chargement de l'expérience sonore...</p>
        </motion.div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center dordogne-experience">
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-bold text-accent dordogne-title">Exploration introuvable</h2>
          <p className="text-emerald-800 dark:text-muted-foreground dordogne-body">
            Cette exploration sonore n'existe pas ou n'est plus disponible.
          </p>
          <Link to="/galerie-fleuve">
            <Button variant="outline" size="lg" className="btn-nature">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen flex items-center justify-center dordogne-experience">
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Music className="h-16 w-16 text-emerald-700 dark:text-muted-foreground mx-auto" />
          <h2 className="text-3xl font-bold text-accent dordogne-title">Aucun contenu audio</h2>
          <p className="text-emerald-800 dark:text-muted-foreground dordogne-body max-w-md">
            Cette exploration ne contient pas encore de contenu audio. 
            Les enregistrements seront bientôt disponibles.
          </p>
          <Link to={`/galerie-fleuve/exploration/${slug}`}>
            <Button variant="outline" size="lg" className="btn-nature">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour à l'exploration
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-gradient-to-br dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 dordogne-experience">
      
      {/* Deep Link Welcome Modal */}
      <AnimatePresence>
        {showDeepLinkModal && currentTrack && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-emerald-900 rounded-2xl p-8 max-w-md mx-4 text-center space-y-6 shadow-2xl border border-slate-200 dark:border-accent/30"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                <Waves className="h-10 w-10 text-accent animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">On vous a partagé cet audio</p>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-accent">{currentTrack.title}</h3>
                {currentTrack.marcheName && (
                  <Badge variant="outline" className="mt-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {currentTrack.marcheName}
                  </Badge>
                )}
              </div>
              
              <Button 
                size="lg" 
                onClick={handleStartSharedAudio}
                className="w-full bg-accent hover:bg-accent/90 text-white gap-2"
              >
                <Play className="h-5 w-5" />
                Lancer l'écoute
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-emerald-950/30 via-emerald-900/20 to-emerald-800/10" />
        {/* Animated river waves - only in dark mode */}
        <div className="absolute bottom-0 left-0 w-full h-32 hidden dark:block river-wave river-wave-1" />
        <div className="absolute bottom-0 left-1/4 w-3/4 h-24 hidden dark:block river-wave river-wave-2" />
        <div className="absolute bottom-0 right-0 w-1/2 h-16 hidden dark:block river-wave river-wave-3" />
        
        {/* Floating particles - only in dark mode */}
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 hidden dark:block water-bubble"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: i * 0.2 }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <PodcastNavigationHeader
            explorationName={exploration.name}
            currentTrackIndex={currentFilteredIndex >= 0 ? currentFilteredIndex : 0}
            totalTracks={filteredPlaylist.length}
            tracks={headerTracks}
            onTrackSelect={handleTrackSelect}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            slug={slug}
            selectedAudioType={selectedAudioType}
            onAudioTypeChange={handleAudioTypeChange}
            totalDurationSeconds={totalDurationSeconds}
            remainingDurationSeconds={remainingDurationSeconds}
            currentTrackId={currentTrack?.id}
          />

          <div className="max-w-5xl mx-auto mt-6">
            {/* Main Audio Player - Full Width */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="bg-white border border-slate-200 shadow-2xl dark:backdrop-blur-md dark:bg-card/70 dark:border-accent/20">
                <CardContent className="p-3 space-y-2">
                  
                  {/* Current Track Info */}
                  <AnimatePresence mode="wait">
                    {currentTrack && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        key={currentTrack.id}
                      >
                        <div className="text-center space-y-1">
                          <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-emerald-900 dark:text-accent dordogne-title`}>
                            {currentTrack.title}
                          </h3>
                          <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center justify-center gap-3'} text-sm`}>
                            {currentTrack.marcheName && (
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                <MapPin className="h-3 w-3" />
                                {currentTrack.marcheName}
                              </Badge>
                            )}
                            {currentTrack.marcheLocation && (
                              <Badge variant="secondary" className="text-xs">
                                {currentTrack.marcheLocation}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Piste {currentFilteredIndex >= 0 ? currentFilteredIndex + 1 : 1}/{filteredPlaylist.length}
                            </Badge>
                          </div>
                        </div>

                        {/* Compact Audio Visualizer */}
                        <div className="flex justify-center py-1">
                          <EcoAudioVisualizer
                            isPlaying={isPlaying && currentRecording?.url === currentTrack.url}
                            currentTime={currentTime}
                            duration={duration}
                            className={`w-full ${isMobile ? 'max-w-xs' : 'max-w-sm'} h-8`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Compact Progress Slider */}
                  <div className="space-y-1">
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleProgressChange}
                      max={displayDuration || 1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-emerald-800 dark:text-muted-foreground dordogne-body">
                      <span>{formatTime(currentTime)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(displayDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Compact Main Controls */}
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant="outline"
                      size={isMobile ? "default" : "lg"}
                      onClick={handlePreviousTrack}
                      disabled={!canGoPrevious}
                      className={`${isMobile ? 'h-9 w-9' : 'h-10 w-10'} rounded-full btn-nature`}
                    >
                      <SkipBack className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </Button>
                    
                    <Button
                      size={isMobile ? "default" : "lg"}
                      onClick={handlePlayPause}
                      disabled={!currentTrack}
                      className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} rounded-full btn-nature shadow-xl`}
                    >
                      {isPlaying && currentRecording?.url === currentTrack?.url ? (
                        <Pause className={`${isMobile ? 'h-5 w-5' : 'h-7 w-7'}`} />
                      ) : (
                        <Play className={`${isMobile ? 'h-5 w-5' : 'h-7 w-7'}`} />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size={isMobile ? "default" : "lg"}
                      onClick={handleNextTrack}
                      disabled={!canGoNext}
                      className={`${isMobile ? 'h-9 w-9' : 'h-10 w-10'} rounded-full btn-nature`}
                    >
                      <SkipForward className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </Button>
                  </div>

                  {/* Compact Bottom Controls Row */}
                  <div className="flex items-center justify-between pt-0">
                    {/* Volume Control - Compact */}
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4 text-emerald-800 dark:text-muted-foreground" />
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        step={0.1}
                        className={`${isMobile ? 'w-16' : 'w-20'}`}
                      />
                      <span className="text-xs text-emerald-800 dark:text-muted-foreground min-w-[2rem]">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>

                    {/* Playlist Button - Compact */}
                    <Sheet open={showPlaylist} onOpenChange={setShowPlaylist}>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="btn-nature text-xs h-8"
                        >
                          <List className="h-3 w-3 mr-1" />
                          Playlist ({audioPlaylist.length})
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-lg bg-card/95 backdrop-blur-xl border-accent/20">
                        <SheetHeader>
                          <SheetTitle className="text-accent dordogne-title">
                            Playlist Audio - {exploration.name}
                          </SheetTitle>
                        </SheetHeader>
                        
                        <ScrollArea className="h-full mt-6">
                          <div className="space-y-2">
                            {audioPlaylist.map((track, index) => (
                              <motion.div
                                key={track.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button
                                  variant={index === currentTrackIndex ? "default" : "ghost"}
                                  onClick={() => handleTrackSelect(index)}
                                  className="w-full justify-start text-left p-4 h-auto btn-nature"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-emerald-700 dark:text-muted-foreground">
                                        {String(index + 1).padStart(2, '0')}
                                      </span>
                                      <span className="font-medium truncate">
                                        {track.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-muted-foreground">
                                      {track.marcheName && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {track.marcheName}
                                        </span>
                                      )}
                                      {track.duration && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatTime(track.duration)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Footer */}
          <ExperienceFooter />
        </div>
      </div>
    </div>
  );
}