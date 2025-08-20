import React from 'react';
import { Button } from '@/components/ui/button';
import DecorativeParticles from '@/components/DecorativeParticles';
import type { ExplorationPage } from '@/hooks/useExplorationPages';
import { createSafeHtmlWithLineBreaks } from '@/utils/htmlSanitizer';

interface Props {
  page: ExplorationPage;
  onBack?: () => void;
}

const ExperiencePageFeedback: React.FC<Props> = ({ page, onBack }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/10 p-8">
      <DecorativeParticles />
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          {page.nom}
        </h1>
        
        {page.description && (
          <div className="prose prose-lg max-w-none text-foreground/80 mb-8" dangerouslySetInnerHTML={createSafeHtmlWithLineBreaks(page.description)} />
        )}

        {page.config?.audioUrl && (
          <div className="mb-6">
            <audio controls className="w-full max-w-md mx-auto">
              <source src={page.config.audioUrl} type="audio/mpeg" />
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
          </div>
        )}

        <div className="mt-8">
          <Button onClick={onBack} variant="outline">
            Retour à l'exploration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExperiencePageFeedback;