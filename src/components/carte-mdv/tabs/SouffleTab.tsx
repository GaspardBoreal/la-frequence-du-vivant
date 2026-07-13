import React from 'react';
import CarteMdVHero from '@/components/carte-mdv/CarteMdVHero';

const SouffleTab: React.FC = () => (
  <div>
    <div className="container mx-auto px-4 pt-8 sm:pt-10">
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-medium">
          Le Souffle du Vivant
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-serif tracking-tight">
          Ce que nos marches racontent, en chiffres vivants.
        </h2>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          Chaque nombre est une trace : un pas posé, un regard échangé, une espèce reconnue.
        </p>
      </div>
    </div>
    <CarteMdVHero />
  </div>
);

export default SouffleTab;
