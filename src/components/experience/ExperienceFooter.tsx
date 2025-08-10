import React from 'react';

const ExperienceFooter: React.FC = () => {
  return (
    <footer className="mt-8 border-t">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground/80">
        <span className="font-crimson text-xl text-white font-medium">Une Création Gaspard Boréal</span>
        <nav className="flex items-center gap-4">
          <a
            href="https://www.gaspardboreal.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="story-link"
          >
            Découvrir l'auteur
          </a>
          <a
            href="https://www.gaspardboreal.com/conferences"
            target="_blank"
            rel="noopener noreferrer"
            className="story-link"
          >
            Conférences et formation IA
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default ExperienceFooter;
