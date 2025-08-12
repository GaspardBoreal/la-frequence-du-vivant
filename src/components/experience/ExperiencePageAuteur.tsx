import React from 'react';
import { Button } from '@/components/ui/button';
import DecorativeParticles from '@/components/DecorativeParticles';
import type { ExplorationPage } from '@/hooks/useExplorationPages';

interface Props {
  page: ExplorationPage;
  onContinue?: () => void;
}

const ExperiencePageAuteur: React.FC<Props> = ({ page, onContinue }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/10 p-8">
      <DecorativeParticles />
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          {page.nom}
        </h1>
        
        {page.description && (
          <div className="prose prose-lg max-w-none text-foreground/80 mb-8">
            <p>{page.description}</p>
          </div>
        )}

        <div className="mt-8">
          <Button onClick={onContinue} size="lg">
            Continuer l'exploration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExperiencePageAuteur;