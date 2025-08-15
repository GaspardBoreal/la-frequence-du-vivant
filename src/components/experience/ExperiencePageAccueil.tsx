import React from 'react';
import { Button } from '@/components/ui/button';
import DecorativeParticles from '@/components/DecorativeParticles';
import type { ExplorationPage } from '@/hooks/useExplorationPages';

interface Props {
  page: ExplorationPage;
  onContinue?: () => void;
}

const ExperiencePageAccueil: React.FC<Props> = ({ page, onContinue }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/10 p-8">
      <DecorativeParticles />
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          {page.nom}
        </h1>
        

        <div className="mt-8">
          <Button onClick={onContinue} size="lg">
            Commencer l'exploration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExperiencePageAccueil;