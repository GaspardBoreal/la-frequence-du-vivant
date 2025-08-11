import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { AudioProvider } from '@/contexts/AudioContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, SkipBack, Shuffle, List, MapPin, Clock, Waves } from 'lucide-react';
import { FloatingAudioPlayer } from '@/components/audio/FloatingAudioPlayer';
import { useAudioPlaylist, Track } from '@/hooks/useAudioPlaylist';
import PodcastNavigationHeader from '@/components/experience/PodcastNavigationHeader';
import FloatingReturnButton from '@/components/experience/FloatingReturnButton';

interface PodcastViewProps {
  explorationSlug: string;
  sessionId: string;
}

const PodcastView: React.FC<PodcastViewProps> = ({ explorationSlug, sessionId }) => {
  console.log('🎙️ PodcastView - explorationSlug:', explorationSlug, 'sessionId:', sessionId);
  const { data: exploration } = useExploration(explorationSlug);
  const { data: marches } = useExplorationMarches(exploration?.id || '');
  console.log('🎙️ PodcastView - exploration:', exploration);
  console.log('🎙️ PodcastView - marches:', marches);

  // Extract audio tracks from marches
  const tracks: Track[] = useMemo(() => {
    console.log('🎵 Creating tracks from marches:', marches);
    if (!marches) return [];
    
    return marches.flatMap((marchData, marcheIndex) => {
      if (!marchData.marche?.audio) return [];
      
      return marchData.marche.audio.map((audio: any, audioIndex: number) => {
        // Special title for the first track
        let title = audio.fileName || `Enregistrement ${audioIndex + 1}`;
        if (marcheIndex === 0 && audioIndex === 0) {
          title = "Là où elle se jette, je me redresse à Bec d'Ambès - GAURIAC";
        }
        
        return {
          id: `${marchData.id}-${audioIndex}`,
          url: audio.url || audio.file,
          title,
          marche: marchData.marche?.nom_marche || marchData.marche?.ville || 'Marche',
          marcheIndex: marcheIndex + 1,
          marcheTitle: `${marchData.marche?.nom_marche || 'Marche'} - ${marchData.marche?.ville || ''}`,
          description: audio.fileName || `Capture sonore lors de la marche à ${marchData.marche?.ville}`,
          location: marchData.marche?.ville || 'Localisation inconnue',
          duration: audio.length || '00:00',
          species: audio.species || null
        };
      });
    });
  }, [marches]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    if (tracks.length === 0) return '00:00';
    
    let totalSeconds = 0;
    tracks.forEach(track => {
      const duration = track.duration || '00:00';
      const [minutes, seconds] = duration.split(':').map(Number);
      totalSeconds += (minutes || 0) * 60 + (seconds || 0);
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [tracks]);

  const {
    currentTrack,
    currentIndex,
    isPlaying,
    play,
    pause,
    toggle,
    playIndex,
    next,
    prev
  } = useAudioPlaylist(tracks);

  if (!exploration) {
    return (
      <div className="dordogne-experience min-h-screen flex items-center justify-center">
        <div className="text-emerald-200 text-xl">Chargement de l'exploration...</div>
      </div>
    );
  }

  return (
    <div className="dordogne-experience min-h-screen relative overflow-hidden">
      {/* Navigation Header */}
      <PodcastNavigationHeader explorationName={exploration.name} />
      
      {/* Living Waters Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-green-800"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="river-wave river-wave-1 absolute bottom-0 left-0 w-full h-60"></div>
          <div className="river-wave river-wave-2 absolute bottom-0 left-0 w-full h-40" style={{ animationDelay: '1s' }}></div>
          <div className="river-wave river-wave-3 absolute bottom-0 left-0 w-full h-20" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="water-bubble absolute"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${3 + Math.random() * 6}px`,
              height: `${3 + Math.random() * 6}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-20 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="dordogne-title text-5xl md:text-6xl mb-6 bg-gradient-to-r from-emerald-200 via-yellow-200 to-green-300 bg-clip-text text-transparent">
              Écoute Contemplative
            </h1>
            <div className="poetic-container p-6 rounded-2xl max-w-3xl mx-auto">
              <h2 className="dordogne-body text-xl text-emerald-100/90">{exploration.name}</h2>
            </div>
          </div>

          {/* Main Player Card */}
          <Card className="poetic-container border-emerald-400/30 mb-8">
            <CardHeader className="text-center">
              <div className="mb-4">
                <Waves className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                <CardTitle className="dordogne-title text-3xl text-emerald-200">
                  {currentTrack ? currentTrack.title : 'Signature Sonore de la Dordogne'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Current track info */}
              {currentTrack ? (
                <div className="mb-8 text-center">
                  <div className="poetic-container p-6 rounded-xl mb-6">
                    <h3 className="dordogne-body text-lg text-emerald-200 mb-2">{currentTrack.marcheTitle}</h3>
                    <div className="flex items-center justify-center space-x-4 text-emerald-300/80">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{currentTrack.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{currentTrack.duration}</span>
                      </div>
                    </div>
                    {currentTrack.species && (
                      <p className="dordogne-body text-emerald-300/70 text-sm mt-2 italic">
                        Espèce captée : {currentTrack.species}
                      </p>
                    )}
                  </div>

                  {/* Audio Wave Visualization */}
                  <div className="flex justify-center items-end space-x-1 h-20 mb-6">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="eco-audio-wave"
                        style={{
                          width: '4px',
                          height: `${10 + Math.random() * 50}px`,
                          animationDelay: `${i * 0.05}s`,
                          animationDuration: `${0.6 + Math.random() * 0.8}s`,
                          opacity: isPlaying ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-8 text-center">
                  <p className="dordogne-body text-emerald-300/70 text-lg">
                    {tracks.length === 0 
                      ? 'Préparation de l\'expérience sonore...' 
                      : 'Sélectionnez un enregistrement pour commencer l\'écoute'
                    }
                  </p>
                </div>
              )}

              {/* Playback controls */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentIndex === 0}
                  onClick={prev}
                  className="bg-emerald-900/20 border-emerald-400/40 text-emerald-200 h-12 w-12"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>
                
                <Button
                  size="icon"
                  disabled={tracks.length === 0}
                  onClick={toggle}
                  className="btn-nature h-16 w-16 text-white"
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentIndex >= tracks.length - 1}
                  onClick={next}
                  className="bg-emerald-900/20 border-emerald-400/40 text-emerald-200 h-12 w-12"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={true}
                  className="bg-emerald-900/20 border-emerald-400/40 text-emerald-200 h-12 w-12"
                >
                  <Shuffle className="h-6 w-6" />
                </Button>
              </div>

              {/* Track progress */}
              <div className="text-center">
                <p className="dordogne-body text-emerald-300/80">
                  {tracks.length > 0 ? `Piste ${currentIndex + 1} sur ${tracks.length}` : 'Aucune piste disponible'}
                </p>
                <p className="dordogne-body text-emerald-400/70 text-sm mt-1">
                  Durée totale: {totalDuration}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Track List */}
          <Card className="poetic-container border-emerald-400/30">
            <CardHeader>
              <CardTitle className="dordogne-title text-2xl text-emerald-200 text-center">
                Parcours Sonore de la Dordogne
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tracks.length === 0 ? (
                <div className="text-center py-12">
                  <Waves className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
                  <p className="dordogne-body text-emerald-300/70 text-lg">
                    Les enregistrements de cette exploration sont en cours de préparation.
                  </p>
                  <p className="dordogne-body text-emerald-400/60 text-sm mt-2">
                    Revenez bientôt pour découvrir la richesse acoustique de nos marches.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        currentIndex === index
                          ? 'bg-emerald-700/30 border border-emerald-400/50 transform scale-[1.02]'
                          : 'bg-emerald-900/20 hover:bg-emerald-800/30 border border-emerald-400/20'
                      }`}
                      onClick={() => playIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="secondary" className="bg-emerald-700/40 text-emerald-200 border-emerald-400/30">
                              Marche {track.marcheIndex}
                            </Badge>
                            {currentIndex === index && isPlaying && (
                              <div className="flex space-x-1">
                                {[...Array(3)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <h4 className="dordogne-body text-emerald-200 font-medium text-lg mb-1">{track.title}</h4>
                          <p className="dordogne-body text-emerald-300/70 text-sm">{track.description}</p>
                          {track.species && (
                            <p className="dordogne-body text-emerald-400/60 text-xs mt-1 italic">{track.species}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="border-emerald-400/40 text-emerald-300">
                            <Clock className="h-3 w-3 mr-1" />
                            {track.duration}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              playIndex(index);
                            }}
                          >
                            {currentIndex === index && isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gaspard Boréal Signature */}
          <div className="signature-section p-8 rounded-2xl mt-12">
            <div className="text-center">
              <h3 className="dordogne-signature text-3xl text-yellow-200 mb-2">
                Gaspard Boréal
              </h3>
              <p className="dordogne-body text-emerald-300/80 italic">
                Poète de l'écoute, arpenteur de fréquences, auteur en tension
              </p>
            </div>
          </div>
        </div>
      </div>

      <FloatingAudioPlayer />
      <FloatingReturnButton />
    </div>
  );
};

const ExplorationPodcastDordogne: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const explorationSlug = 'remontee-dordogne-atlas-eaux-vivantes-2050-2100'; // Hard-coded for Dordogne
  
  console.log('🎙️ ExplorationPodcastDordogne - params:', { explorationSlug, sessionId });

  if (!sessionId) {
    console.error('🎙️ Missing sessionId parameter');
    return (
      <div className="dordogne-experience min-h-screen flex items-center justify-center">
        <div className="text-emerald-200 text-xl">Session non trouvée</div>
      </div>
    );
  }

  return (
    <AudioProvider>
      <PodcastView explorationSlug={explorationSlug} sessionId={sessionId} />
    </AudioProvider>
  );
};

export default ExplorationPodcastDordogne;