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
}

const ExperienceWelcome: React.FC<Props> = ({ exploration, settings, onStart }) => {
  const subtitle = [
    settings.welcome_tones?.length ? settings.welcome_tones.join(' · ') : undefined,
    settings.welcome_forms?.length ? settings.welcome_forms[0] : undefined,
    settings.welcome_povs?.length ? `Point de vue: ${settings.welcome_povs[0]}` : undefined,
  ].filter(Boolean).join(' — ');

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/10 p-8">
      <DecorativeParticles />
      <div className="relative">
        <h1 className="text-3xl md:text-4xl font-bold">
          {settings.welcome_template || `Bienvenue dans « ${exploration.name} »`}
        </h1>
        {subtitle && (
          <p className="mt-2 text-foreground/80">
            {subtitle}
          </p>
        )}
        {exploration.description && (
          <div className="mt-4 max-w-3xl text-foreground/80 prose prose-lg prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: exploration.description }}>
          </div>
        )}
        <div className="mt-6">
          <Button onClick={onStart}>Entrer dans l'expérience</Button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceWelcome;
