// Phase 2.1: Component for "Ecouter" mode - Continuous audio playback

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useExploration } from '@/hooks/useExplorations';
import { useExplorationPages } from '@/hooks/useExplorationPages';
import { useExplorationContext } from '@/contexts/ExplorationContext';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Clock,
  List,
  ArrowLeft
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Link } from 'react-router-dom';
import type { ExplorationAudioTrack } from '@/types/exploration';
import type { XenoCantoRecording } from '@/types/biodiversity';

// Helper function to convert ExplorationAudioTrack to XenoCantoRecording
const trackToXenoCantoRecording = (track: ExplorationAudioTrack): XenoCantoRecording => ({
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

export default function ExperienceAudioContinue() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: pages, isLoading: pagesLoading } = useExplorationPages(exploration?.id || '');
  const { state, setAudioPlaylist, setCurrentMode } = useExplorationContext();
  const { 
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    volume,
    playRecording,
    pause,
    setVolume 
  } = useGlobalAudioPlayer();
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Find Audio Page content
  const audioPage = pages?.find(page => page.type === 'audio');
  const audioPageText = audioPage?.description || '';

  // Set current mode
  useEffect(() => {
    setCurrentMode('ecouter');
  }, [setCurrentMode]);

  // Load audio playlist from marches
  useEffect(() => {
    if (!state.audioPlaylist.length && exploration) {
      // This would be populated by the parent component with march audio data
      // For now, we'll handle the structure
    }
  }, [exploration, state.audioPlaylist, setAudioPlaylist]);

  const currentTrack = state.audioPlaylist[currentTrackIndex];

  const handlePlayPause = () => {
    if (!currentTrack) return;

    if (currentRecording?.url === currentTrack.url && isPlaying) {
      pause();
    } else {
      playRecording(trackToXenoCantoRecording(currentTrack));
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < state.audioPlaylist.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      const nextTrack = state.audioPlaylist[nextIndex];
      playRecording(trackToXenoCantoRecording(nextTrack));
    }
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      const prevTrack = state.audioPlaylist[prevIndex];
      playRecording(trackToXenoCantoRecording(prevTrack));
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (explorationLoading || pagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Exploration non trouvée</h2>
          <Link to="/galerie-fleuve">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Link to={`/galerie-fleuve/exploration/${slug}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'exploration
              </Button>
            </Link>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {state.audioPlaylist.length} pistes
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">{exploration.name}</h1>
          <h2 className="text-xl text-muted-foreground flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Écoute Continue
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Audio Player */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lecteur Audio</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPlaylist(!showPlaylist)}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Playlist
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Current Track Info */}
                {currentTrack && (
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">{currentTrack.title}</h3>
                    {currentTrack.marcheName && (
                      <p className="text-muted-foreground">{currentTrack.marcheName}</p>
                    )}
                    {currentTrack.description && (
                      <p className="text-sm text-muted-foreground">{currentTrack.description}</p>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={duration > 0 ? (currentTime / duration) * 100 : 0} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousTrack}
                    disabled={currentTrackIndex === 0}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={handlePlayPause}
                    disabled={!currentTrack}
                    className="h-12 w-12 rounded-full"
                  >
                    {isPlaying && currentRecording?.url === currentTrack?.url ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextTrack}
                    disabled={currentTrackIndex >= state.audioPlaylist.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-4">
                  <Volume2 className="h-4 w-4" />
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audio Page Content */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Texte d'accompagnement</CardTitle>
              </CardHeader>
              <CardContent>
                {audioPageText ? (
                  <div 
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: audioPageText }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">
                    Aucun texte d'accompagnement configuré pour cette exploration.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Playlist */}
        {showPlaylist && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Playlist complète</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.audioPlaylist.map((track, index) => (
                    <div
                      key={track.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        index === currentTrackIndex 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        playRecording(trackToXenoCantoRecording(track));
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{track.title}</h4>
                          {track.marcheName && (
                            <p className="text-sm text-muted-foreground">{track.marcheName}</p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {track.duration && formatTime(track.duration)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}