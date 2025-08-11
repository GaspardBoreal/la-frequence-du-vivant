import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { AudioProvider } from '@/contexts/AudioContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Shuffle, ArrowRight, Waves } from 'lucide-react';
import { FloatingAudioPlayer } from '@/components/audio/FloatingAudioPlayer';
import { useAudioPlaylist, Track } from '@/hooks/useAudioPlaylist';
import PodcastNavigationHeader from '@/components/experience/PodcastNavigationHeader';
import FloatingReturnButton from '@/components/experience/FloatingReturnButton';
import Footer from '@/components/Footer';

interface PodcastViewProps {
  explorationSlug: string;
  sessionId: string;
}

// Helper function to convert seconds to MM:SS format
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PodcastView: React.FC<PodcastViewProps> = ({ explorationSlug, sessionId }) => {
  const { data: exploration } = useExploration(explorationSlug);
  const { data: marches } = useExplorationMarches(exploration?.id || '');

  // Transform march data into tracks for the audio player
  const tracks: Track[] = useMemo(() => {
    if (!marches) return [];
    
    return marches.flatMap((marchData, marcheIndex) => {
      if (!marchData.marche?.audio) return [];
      
      return marchData.marche.audio.map((audio: any, audioIndex: number) => ({
        id: `${marchData.id}-${audioIndex}`,
        url: audio.url_supabase || '',
        title: audio.titre || audio.nom_fichier || `Audio ${audioIndex + 1}`,
        marche: marchData.marche?.nom_marche || marchData.marche?.ville || 'Marche',
        marcheIndex: marcheIndex + 1,
        marcheTitle: `${marchData.marche?.nom_marche || 'Marche'} - ${marchData.marche?.ville || ''}`,
        description: audio.description || `Capture sonore lors de la marche à ${marchData.marche?.ville}`,
        location: marchData.marche?.ville || 'Localisation inconnue',
        duration: audio.duree_secondes ? formatDuration(audio.duree_secondes) : '0:00',
        species: ''
      }));
    });
  }, [marches]);

  const {
    currentTrack,
    isPlaying,
    mode,
    setMode,
    toggle
  } = useAudioPlaylist(tracks, 'order');

  if (!exploration) {
    return (
      <div className="dordogne-experience min-h-screen flex items-center justify-center">
        <div className="text-emerald-200 text-xl">Chargement de l'exploration...</div>
      </div>
    );
  }

  const handleSequentialMode = () => {
    setMode('order');
    toggle();
  };

  const handleRandomMode = () => {
    setMode('shuffle');
    toggle();
  };

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="dordogne-title text-6xl md:text-7xl mb-8 bg-gradient-to-r from-emerald-200 via-yellow-200 to-green-300 bg-clip-text text-transparent">
              Écoute Contemplative
            </h1>
            <div className="poetic-container p-8 rounded-3xl max-w-3xl mx-auto">
              <h2 className="dordogne-body text-2xl text-emerald-100/90 mb-4">{exploration.name}</h2>
            </div>
          </div>


          {/* Two Listening Modes */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Sequential Mode */}
            <Card className="poetic-container border-emerald-400/30 group hover:border-emerald-400/60 transition-all duration-500 cursor-pointer" onClick={handleSequentialMode}>
              <CardHeader className="text-center pb-4">
                <div className="mb-6">
                  <ArrowRight className="h-12 w-12 text-emerald-300 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <CardTitle className="dordogne-title text-2xl text-emerald-200 mb-2">
                    Écouter la remontée Dordogne
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <p className="dordogne-body text-emerald-300/80 text-lg mb-6">
                  Suivez le cours naturel de l'exploration, d'amont en aval, 
                  dans l'ordre de notre parcours contemplatif.
                </p>
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    className={mode === 'order' ? "bg-white text-emerald-600 border-white" : "bg-emerald-900/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-800/30 group-hover:border-emerald-400/80"}
                  >
                    Commencer l'écoute séquentielle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Random Mode */}
            <Card className="poetic-container border-emerald-400/30 group hover:border-emerald-400/60 transition-all duration-500 cursor-pointer" onClick={handleRandomMode}>
              <CardHeader className="text-center pb-4">
                <div className="mb-6">
                  <Shuffle className="h-12 w-12 text-emerald-300 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <CardTitle className="dordogne-title text-2xl text-emerald-200 mb-2">
                    Laisser le hasard raconter
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <p className="dordogne-body text-emerald-300/80 text-lg mb-6">
                  Abandonnez-vous à l'imprévu sonore. 
                  Que la rivière choisisse elle-même son récit.
                </p>
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    className={mode === 'shuffle' ? "bg-white text-emerald-600 border-white" : "bg-emerald-900/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-800/30 group-hover:border-emerald-400/80"}
                  >
                    Laisser faire le hasard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>


        </div>
      </div>

      <FloatingAudioPlayer />
      <FloatingReturnButton />
      <Footer />
    </div>
  );
};

const ExplorationPodcastDordogne: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const explorationSlug = 'remontee-dordogne-atlas-eaux-vivantes-2050-2100';

  if (!sessionId) {
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