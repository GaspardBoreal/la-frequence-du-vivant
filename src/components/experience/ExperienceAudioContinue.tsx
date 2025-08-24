// "Wahouhh" Experience Audio Continue - Beautiful immersive audio player

import React, { useEffect, useState, useCallback } from 'react';
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

  // Find Audio Page content - try both 'audio' and 'Audio' types
  const audioPage = pages?.find(page => 
    page.type === 'audio' || page.type === 'Audio' || page.nom?.toLowerCase().includes('audio')
  );
  const audioPageText = audioPage?.description || '';

  // Current track logic
  const currentTrack = audioPlaylist[currentTrackIndex];
  const canGoNext = currentTrackIndex < audioPlaylist.length - 1;
  const canGoPrevious = currentTrackIndex > 0;

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

  // Initialize first track
  useEffect(() => {
    if (audioPlaylist.length > 0 && !currentRecording) {
      const firstTrack = audioPlaylist[0];
      if (firstTrack) {
        setCurrentTrackIndex(0);
      }
    }
  }, [audioPlaylist, currentRecording]);

  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;

    if (currentRecording?.url === currentTrack.url && isPlaying) {
      pause();
    } else {
      playRecording(trackToXenoCantoRecording(currentTrack));
    }
  }, [currentTrack, currentRecording, isPlaying, pause, playRecording]);

  const handleNextTrack = useCallback(() => {
    if (canGoNext) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      const nextTrack = audioPlaylist[nextIndex];
      if (nextTrack) {
        playRecording(trackToXenoCantoRecording(nextTrack));
      }
    }
  }, [currentTrackIndex, canGoNext, audioPlaylist, playRecording]);

  const handlePreviousTrack = useCallback(() => {
    if (canGoPrevious) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      const prevTrack = audioPlaylist[prevIndex];
      if (prevTrack) {
        playRecording(trackToXenoCantoRecording(prevTrack));
      }
    }
  }, [currentTrackIndex, canGoPrevious, audioPlaylist, playRecording]);

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
          <p className="text-muted-foreground dordogne-body">
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
          <Music className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-3xl font-bold text-accent dordogne-title">Aucun contenu audio</h2>
          <p className="text-muted-foreground dordogne-body max-w-md">
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
    <div className="min-h-screen dordogne-experience">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-emerald-900/10 to-amber-950/20" />
        {/* Animated river waves */}
        <div className="absolute bottom-0 left-0 w-full h-32 river-wave river-wave-1" />
        <div className="absolute bottom-0 left-1/4 w-3/4 h-24 river-wave river-wave-2" />
        <div className="absolute bottom-0 right-0 w-1/2 h-16 river-wave river-wave-3" />
        
        {/* Floating particles */}
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 water-bubble"
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
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-4 mb-6">
              <Link to={`/galerie-fleuve/exploration/${slug}`} className="self-start">
                <Button variant="outline" size={isMobile ? "default" : "lg"} className="btn-nature">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à l'exploration
                </Button>
              </Link>
              
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-4'} items-start ${isMobile ? '' : 'justify-end'}`}>
                <Badge variant="secondary" className={`flex items-center gap-2 ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}>
                  <Clock className="h-3 w-3" />
                  {Math.floor(totalDuration / 60)}min d'écoute
                </Badge>
                <Badge variant="outline" className={`flex items-center gap-2 ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}>
                  <MapPin className="h-3 w-3" />
                  {totalMarches} marches
                </Badge>
                <Badge variant="outline" className={`flex items-center gap-2 ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}>
                  <Music className="h-3 w-3" />
                  {totalTracks} pistes
                </Badge>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <motion.h1 
                className={`${isMobile ? 'text-3xl' : 'text-6xl'} font-bold text-accent dordogne-title`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {exploration.name}
              </motion.h1>
              
              <motion.div 
                className={`flex items-center justify-center gap-3 ${isMobile ? 'text-lg' : 'text-2xl'} text-muted-foreground`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Waves className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-accent animate-gentle-float`} />
                <span className="dordogne-signature">Écoute Continue</span>
                <Volume2 className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-accent animate-gentle-float`} />
              </motion.div>
            </div>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Main Audio Player - Full Width */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="backdrop-blur-md bg-card/70 border-accent/20 shadow-2xl">
                <CardContent className="p-8 space-y-8">
                  
                  {/* Current Track Info */}
                  <AnimatePresence mode="wait">
                    {currentTrack && (
                      <motion.div 
                        className="text-center space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        key={currentTrack.id}
                      >
                        <div className="space-y-3">
                          <h3 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-accent dordogne-title`}>
                            {currentTrack.title}
                          </h3>
                          <div className="flex items-center justify-center gap-4">
                            {currentTrack.marcheName && (
                              <Badge variant="outline" className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {currentTrack.marcheName}
                              </Badge>
                            )}
                            {currentTrack.marcheLocation && (
                              <Badge variant="secondary" className="flex items-center gap-2">
                                {currentTrack.marcheLocation}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              Piste {currentTrackIndex + 1}/{totalTracks}
                            </Badge>
                          </div>
                          {currentTrack.description && (
                            <p className="text-muted-foreground max-w-2xl mx-auto dordogne-body">
                              {currentTrack.description}
                            </p>
                          )}
                        </div>

                        {/* Audio Visualizer */}
                        <div className="flex justify-center py-6">
                          <EcoAudioVisualizer
                            isPlaying={isPlaying && currentRecording?.url === currentTrack.url}
                            currentTime={currentTime}
                            duration={duration}
                            className="w-full max-w-md"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Interactive Progress Slider */}
                  <div className="space-y-3">
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleProgressChange}
                      max={duration || 1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground dordogne-body">
                      <span>{formatTime(currentTime)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-center space-x-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handlePreviousTrack}
                      disabled={!canGoPrevious}
                      className="h-14 w-14 rounded-full btn-nature"
                    >
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={handlePlayPause}
                      disabled={!currentTrack}
                      className="h-20 w-20 rounded-full btn-nature text-xl shadow-2xl"
                    >
                      {isPlaying && currentRecording?.url === currentTrack?.url ? (
                        <Pause className="h-10 w-10" />
                      ) : (
                        <Play className="h-10 w-10" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleNextTrack}
                      disabled={!canGoNext}
                      className="h-14 w-14 rounded-full btn-nature"
                    >
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Secondary Controls */}
                  <div className="flex items-center justify-between pt-4">
                    {/* Volume Control */}
                    <div className="flex items-center space-x-3 flex-1 max-w-xs">
                      <Volume2 className="h-5 w-5 text-accent" />
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12 dordogne-body">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>

                    {/* Playlist Toggle */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          className="btn-nature"
                        >
                          <List className="h-4 w-4 mr-2" />
                          Playlist ({totalTracks})
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh] bg-card/95 backdrop-blur-md">
                        <SheetHeader className="pb-4">
                          <SheetTitle className="text-accent dordogne-title">
                            Playlist Complète
                          </SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-full">
                          <div className="space-y-1 pr-4">
                            {audioPlaylist.map((track, index) => (
                              <motion.div
                                key={track.id}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                                  index === currentTrackIndex 
                                    ? 'bg-accent/20 border-2 border-accent/40 shadow-lg' 
                                    : 'hover:bg-accent/5 border-2 border-transparent hover:border-accent/20'
                                }`}
                                onClick={() => handleTrackSelect(index)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      index === currentTrackIndex ? 'bg-accent text-background' : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {index === currentTrackIndex && isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <h4 className="font-semibold text-accent dordogne-title truncate">
                                        {track.title}
                                      </h4>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        {track.marcheName && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {track.marcheName}
                                          </span>
                                        )}
                                        {track.marcheLocation && (
                                          <span>{track.marcheLocation}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {track.audioIndex + 1}/{track.totalTracksInMarche}
                                    </Badge>
                                    <span className="font-mono">
                                      {formatTime(track.duration || 0)}
                                    </span>
                                  </div>
                                </div>
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