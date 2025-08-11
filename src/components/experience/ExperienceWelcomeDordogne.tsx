import React from 'react';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="dordogne-experience min-h-screen relative overflow-hidden">
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
            
            {exploration.description && (
              <div className="poetic-container p-8 rounded-2xl max-w-4xl mx-auto">
                <p className="dordogne-body text-xl text-emerald-100/90 leading-relaxed">
                  {exploration.description}
                </p>
              </div>
            )}
          </div>

          {/* Écoacoustic Spectrogram */}
          <div className="my-4 relative">
            <div className="poetic-container p-8 rounded-3xl">
              <h3 className="dordogne-title text-2xl text-emerald-200 mb-6 text-center">
                Poèmes et Signatures Sonores de la Dordogne
              </h3>
              <div className="flex justify-center items-end space-x-2 h-40">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="eco-audio-wave"
                    style={{
                      width: '6px',
                      height: `${15 + Math.random() * 120}px`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: `${0.8 + Math.random() * 1.2}s`
                    }}
                  />
                ))}
              </div>
              <p className="dordogne-body text-sm text-emerald-300/70 text-center mt-4 italic">
                Fréquences captées le long de la rivière • Biodiversité acoustique en temps réel
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              onClick={onStart}
              className="btn-nature px-10 py-5 text-xl text-white border-0 rounded-2xl transform transition-all duration-400"
            >
              🌊 Plonger dans l'expérience
            </Button>
            
            {onStartPodcast && (
              <Button 
                onClick={onStartPodcast}
                variant="outline"
                className="px-8 py-5 text-xl bg-emerald-900/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-800/30 backdrop-blur-sm rounded-2xl transition-all duration-300"
              >
                🎙️ Écoute contemplative
              </Button>
            )}
          </div>

          {/* Poetic Settings */}
          {settings.welcome_tones?.length && (
            <div className="mt-12 poetic-container p-6 rounded-xl">
              <p className="dordogne-body text-emerald-300/80 text-center italic">
                {settings.welcome_tones.join(' • ')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-20 border-t border-emerald-400/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="signature-section p-6 rounded-xl max-w-2xl mx-auto">
              <h3 className="dordogne-signature text-2xl text-yellow-200 mb-2">
                Gaspard Boréal
              </h3>
              <p className="dordogne-body text-emerald-300/80 italic">
                Poète de l'écoute, arpenteur de fréquences, auteur en tension
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExperienceWelcomeDordogne;