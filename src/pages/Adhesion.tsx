import React from 'react';
import { Sparkles } from 'lucide-react';
import { AdhesionForm } from '@/components/adhesion/AdhesionDialog';
import SEOHead from '@/components/SEOHead';
import PublicTopBar from '@/components/layout/PublicTopBar';

const Adhesion: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Adhérer à La Fréquence du Vivant — Association"
        description="Rejoignez l'association La Fréquence du Vivant : marcheurs, partenaires, mécènes et fondateurs. Trois collèges pour faire vibrer le vivant ensemble."
        canonicalUrl="https://la-frequence-du-vivant.com/adhesion"
      />
      <PublicTopBar />
      <main className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/30 dark:from-emerald-950 dark:to-emerald-950/80">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <header className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Association loi 1901
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
              Rejoindre l'<span className="text-emerald-600 dark:text-emerald-300">association</span> la Fréquence du Vivant
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Une association qui relie marcheurs, scientifiques, artistes, agriculteurs et territoires
              autour d’une même attention au vivant.
            </p>
          </header>

          <div className="rounded-2xl bg-white dark:bg-emerald-950/60 border border-stone-200 dark:border-emerald-500/20 p-4 sm:p-8 shadow-sm">
            <AdhesionForm source="page_adhesion" />
          </div>
        </section>
      </main>
    </>
  );
};

export default Adhesion;
