import React from 'react';
import { Button } from '@/components/ui/button';
import { Headphones, Map } from 'lucide-react';
import AudioWave from './AudioWave';

interface Props {
  onExplore: () => void;
  onPodcast: () => void;
}

const BioacousticHero: React.FC<Props> = ({ onExplore, onPodcast }) => {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/40 to-background" />
      {/* Waves + particles */}
      <AudioWave />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
        <header className="text-center space-y-6 animate-fade-in">
          <p className="gaspard-category inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/30 bg-card/30 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Bioacoustique & Poésie</p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
            <span className="block">Dordogne —</span>
            <span className="text-accent">Vivant bioacoustique</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground hyphens-auto">
            Marches techno‑sensibles entre vivant, humain et machine. Écouter les rivières,
            cartographier des ondes. Poésie contemporaine de Gaspard Boréal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="hero"
              size="xl"
              onClick={onExplore}
              className="btn-glow"
              aria-label="Découvrir les marches"
            >
              <Map className="opacity-90" />
              Découvrir les marches
            </Button>
            <Button
              variant="glass"
              size="xl"
              onClick={onPodcast}
              className="hover-scale"
              aria-label="Écouter le podcast"
            >
              <Headphones />
              Écouter le podcast
            </Button>
          </div>
        </header>

        {/* Mini‑manifesto */}
        <div className="mt-14 md:mt-16 max-w-3xl mx-auto text-center">
          <div className="gaspard-glass rounded-xl p-6 md:p-7">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              Des spectres de sons et des cartes sensibles. Des espèces, des traces,
              des eaux en mouvement. Une écriture qui capte, puis dérive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BioacousticHero;
