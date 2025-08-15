import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import ExperienceFooter from './ExperienceFooter';
import { FloatingAudioPlayer } from '@/components/audio/FloatingAudioPlayer';
import { useExplorationMarches } from '@/hooks/useExplorations';
import { useAudioPlaylist, Track } from '@/hooks/useAudioPlaylist';
import type { Exploration } from '@/hooks/useExplorations';

interface Props {
  exploration: Exploration;
  settings: {
    welcome_tones?: string[];
    welcome_forms?: string[];
    welcome_povs?: string[];
    welcome_senses?: string[];
    welcome_timeframes?: string[];
    welcome_template?: string | null;
  };
  onStart?: () => void;
  onStartPodcast?: () => void;
}

const ExperienceWelcomeDordogne: React.FC<Props> = ({ exploration, settings, onStart, onStartPodcast }) => {
  console.log('🌊 ExperienceWelcomeDordogne - Rendering with exploration:', exploration.name);
  
  // Récupérer les marches de l'exploration pour la playlist audio
  const { data: marches = [] } = useExplorationMarches(exploration.id);
  
  // Transformer les marches en tracks pour l'audio
  const tracks = useMemo((): Track[] => {
    return marches
      .filter(em => em.marche?.audio && em.marche.audio.length > 0)
      .flatMap(em => 
        em.marche!.audio!.map((audio, audioIndex) => ({
          id: `${em.marche!.id}-${audioIndex}`,
          url: audio.url_supabase,
          title: audio.titre || `Audio ${audioIndex + 1}`,
          marche: em.marche!.nom_marche,
          marcheIndex: em.ordre || 0,
          marcheTitle: em.marche!.nom_marche,
          description: em.marche!.descriptif_court || '',
          location: em.marche!.ville,
          species: null,
        }))
      )
      .sort((a, b) => (a.marcheIndex || 0) - (b.marcheIndex || 0));
  }, [marches]);
  
  // Hook pour gérer la playlist audio
  const playlist = useAudioPlaylist(tracks, 'order');
  
  // Fonction pour démarrer la lecture contemplative
  const handleStartPodcast = async () => {
    if (tracks.length > 0) {
      await playlist.play();
    } else if (onStartPodcast) {
      onStartPodcast();
    }
  };
  return (
    <div className="dordogne-experience min-h-screen relative">
      {/* Living Waters Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-green-800"></div>
        <div className="absolute inset-0">
          <div className="river-wave river-wave-1 absolute bottom-0 left-0 w-full h-80"></div>
          <div className="river-wave river-wave-2 absolute bottom-0 left-0 w-full h-60" style={{ animationDelay: '1.5s' }}></div>
          <div className="river-wave river-wave-3 absolute bottom-0 left-0 w-full h-40" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>

      {/* Living Water Particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {/* Water Bubbles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`bubble-${i}`}
            className="water-bubble absolute"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${12 + Math.random() * 8}s`
            }}
          />
        ))}
        
        {/* Sediment Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`sediment-${i}`}
            className="sediment-particle absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${6 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="poetic-container inline-block px-8 py-3 rounded-full mb-8 border">
              <span className="text-emerald-200 font-medium tracking-wide">🎧 Exploration Écoacoustique</span>
            </div>
            
            <h1 className="dordogne-title text-4xl md:text-5xl mb-8 bg-gradient-to-r from-emerald-200 via-yellow-200 to-green-300 bg-clip-text text-transparent leading-tight">
              {exploration.name}
            </h1>
          </div>

          {/* Écoacoustic Spectrogram */}
          <div className="my-4 relative">
            <div className="poetic-container p-8 rounded-3xl">
              <h3 className="dordogne-title text-2xl text-emerald-200 mb-6 text-center">
                Poèmes et Signatures Sonores de la Dordogne
              </h3>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                <Button 
                  onClick={onStart}
                  className="btn-nature px-10 py-5 text-xl text-white border-0 rounded-2xl transform transition-all duration-400"
                >
                  🌊 Plonger dans l'expérience
                </Button>
                
                {onStartPodcast && (
                  <Button 
                    onClick={handleStartPodcast}
                    variant="outline"
                    className="px-8 py-5 text-xl bg-emerald-900/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-800/30 backdrop-blur-sm rounded-2xl transition-all duration-300"
                  >
                    🎙️ Écoute contemplative
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Audio Player flottant */}
      {playlist.isPlaying && (
        <div className="fixed bottom-4 right-4 z-50">
          <FloatingAudioPlayer />
        </div>
      )}
      
      {/* Footer avec z-index élevé */}
      <div className="relative z-30">
        <ExperienceFooter />
      </div>
    </div>
  );
};

export default ExperienceWelcomeDordogne;