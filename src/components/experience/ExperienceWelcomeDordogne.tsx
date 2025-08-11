import React from 'react';
import DecorativeParticles from '@/components/DecorativeParticles';
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

// Dedicated welcome for the Dordogne exploration only
const ExperienceWelcomeDordogne: React.FC<Props> = ({ exploration, settings, onStart, onStartPodcast }) => {
  const subtitle = [
    settings.welcome_tones?.length ? settings.welcome_tones.join(' · ') : undefined,
    settings.welcome_forms?.length ? settings.welcome_forms[0] : undefined,
    settings.welcome_povs?.length ? `Point de vue: ${settings.welcome_povs[0]}` : undefined,
  ].filter(Boolean).join(' — ');

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 p-8">
      <DecorativeParticles />
      <div className="relative">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {settings.welcome_template || `Bienvenue dans « ${exploration.name} »`}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm md:text-base text-foreground/80">
            {subtitle}
          </p>
        )}
        {exploration.description && (
          <p className="mt-4 max-w-3xl text-foreground/80">
            {exploration.description}
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button onClick={onStart} variant="hero" className="hover-scale">
            Entrer dans l'expérience
          </Button>
          {onStartPodcast && (
            <Button onClick={onStartPodcast} variant="glass" className="hover-scale" aria-label="Écouter le podcast">
              Écouter le podcast
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperienceWelcomeDordogne;
