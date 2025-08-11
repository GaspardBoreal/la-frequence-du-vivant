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
      {/* Animated background waves */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="wave-animation absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-blue-400/20 to-transparent animate-wave-slow"></div>
          <div className="wave-animation absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-cyan-400/15 to-transparent animate-wave-medium" style={{ animationDelay: '1s' }}></div>
          <div className="wave-animation absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-teal-400/10 to-transparent animate-wave-fast" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-gentle-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 8}s`
            }}
          >
            <div className="w-2 h-2 bg-blue-300 rounded-full blur-sm"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block px-6 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full mb-6">
              <span className="text-blue-200 font-medium">Exploration Bioacoustique</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 bg-clip-text text-transparent leading-tight">
              {exploration.name}
            </h1>
            
            {exploration.description && (
              <p className="text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
                {exploration.description}
              </p>
            )}
          </div>

          {/* Audio wave visualization */}
          <div className="my-12 relative">
            <div className="flex justify-center items-end space-x-1 h-32">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-blue-400 to-cyan-300 rounded-full animate-soft-pulse"
                  style={{
                    width: '8px',
                    height: `${20 + Math.random() * 80}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onStart}
              className="btn-glow px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              🎧 Commencer l'expérience
            </Button>
            
            {onStartPodcast && (
              <Button 
                onClick={onStartPodcast}
                variant="outline"
                className="px-6 py-4 text-lg bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                📻 Mode Podcast
              </Button>
            )}
          </div>

          {/* Settings info */}
          {settings.welcome_tones?.length && (
            <div className="mt-8 text-blue-200/60 text-sm">
              {settings.welcome_tones.join(' • ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperienceWelcomeDordogne;