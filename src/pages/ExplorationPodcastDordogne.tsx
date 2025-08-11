import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shuffle, SkipBack, SkipForward, Play, Pause, ArrowLeft, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { useAudioPlaylist, PlayMode, Track } from '@/hooks/useAudioPlaylist';
import { AudioProvider } from '@/contexts/AudioContext';
import { FloatingAudioPlayer } from '@/components/audio/FloatingAudioPlayer';

const PodcastView: React.FC = () => {
  const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
  const navigate = useNavigate();
  const { data: exploration } = useExploration(slug || '');
  const { data: marches = [] } = useExplorationMarches(exploration?.id || '');
  const [mode, setMode] = useState<PlayMode>('order');

  const tracks: Track[] = useMemo(() => {
    // For now, return an empty array as the audio structure needs to be clarified
    // This prevents build errors while maintaining the Dordogne design
    return [];
  }, [marches]);

  const playlist = useAudioPlaylist(tracks, mode);

  if (!exploration) return null;

  const metaTitle = `Podcast — ${exploration.name}`;
  const canonical = `${window.location.origin}/explorations/${exploration.slug}/experience/${sessionId}/podcast`;

  return (
    <div className="dordogne-experience min-h-screen relative overflow-hidden">
      <SEOHead
        title={metaTitle}
        description={`Écoutez les enregistrements audio de ${exploration.name} en mode podcast`}
        canonicalUrl={canonical}
      />

      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="wave-animation absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-indigo-400/20 to-transparent animate-wave-slow"></div>
          <div className="wave-animation absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-purple-400/15 to-transparent animate-wave-medium" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => navigate(`/explorations/${slug}/experience/${sessionId}`)}
            variant="ghost"
            className="text-indigo-200 hover:text-white hover:bg-indigo-800/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'expérience
          </Button>
          <h1 className="text-xl font-semibold text-white">Mode Podcast</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-20 container mx-auto px-4 py-8">
        {/* Player Card */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">{exploration.name}</CardTitle>
            <p className="text-indigo-200/80">
              {tracks.length} enregistrement{tracks.length > 1 ? 's' : ''} audio
            </p>
          </CardHeader>
          <CardContent>
            {/* Current track info */}
            {playlist.currentTrack && (
              <div className="text-center mb-6 p-4 bg-white/5 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-1">
                  {playlist.currentTrack.title}
                </h3>
                <p className="text-indigo-200/60 text-sm">
                  Marche: {playlist.currentTrack.marche}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Button
                onClick={playlist.prev}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                disabled={playlist.currentIndex === 0}
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                onClick={playlist.toggle}
                size="lg"
                className="btn-glow bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 w-16 h-16 rounded-full"
              >
                {playlist.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>

              <Button
                onClick={playlist.next}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                disabled={playlist.currentIndex === playlist.list.length - 1}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Mode toggle */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  const newMode = playlist.mode === 'order' ? 'shuffle' : 'order';
                  setMode(newMode);
                  playlist.setMode(newMode);
                }}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                {playlist.mode === 'order' ? 'Lecture séquentielle' : 'Lecture aléatoire'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Track List */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <List className="w-5 h-5 mr-2" />
              Liste des enregistrements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playlist.list.map((track, index) => (
                <div
                  key={track.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    playlist.currentIndex === index
                      ? 'bg-indigo-500/20 border border-indigo-400/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => playlist.playIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        {track.title}
                      </h4>
                      <p className="text-indigo-200/60 text-sm">
                        {track.marche}
                      </p>
                    </div>
                    <div className="text-indigo-200/40 text-sm">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <FloatingAudioPlayer />
    </div>
  );
};

const ExplorationPodcastDordogne: React.FC = () => {
  return (
    <AudioProvider>
      <PodcastView />
    </AudioProvider>
  );
};

export default ExplorationPodcastDordogne;