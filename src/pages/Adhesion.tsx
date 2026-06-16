import React from 'react';
import { Sparkles, Users, Building2, Heart } from 'lucide-react';
import { AdhesionForm } from '@/components/adhesion/AdhesionDialog';
import SEOHead from '@/components/SEOHead';
import PublicTopBar from '@/components/layout/PublicTopBar';

const Adhesion: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Adhérer à La Fréquence du Vivant — Association"
        description="Rejoignez l'association La Fréquence du Vivant : marcheurs, partenaires, mécènes et fondateurs. Trois collèges pour faire vibrer le vivant ensemble."
        canonical="https://la-frequence-du-vivant.com/adhesion"
      />
      <PublicTopBar />
      <main className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/30 dark:from-emerald-950 dark:to-emerald-950/80">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <header className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Association loi 1901
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
              Devenez marcheur de la <span className="text-emerald-600 dark:text-emerald-300">Fréquence</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Une association qui relie marcheurs, scientifiques, artistes, agriculteurs et territoires
              autour d’une même attention au vivant. Trois collèges, une même résonance.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <CollegeCard
              icon={<Heart className="w-5 h-5" />}
              title="Fondateurs"
              desc="Membres fondateurs initiaux. Veillent à la cohérence de la mission."
            />
            <CollegeCard
              icon={<Users className="w-5 h-5" />}
              title="Adhérents Actifs"
              desc="Marcheurs, contributeurs, organisateurs. Vous faites vivre les marches."
              highlighted
            />
            <CollegeCard
              icon={<Building2 className="w-5 h-5" />}
              title="Partenaires & Mécènes"
              desc="Entreprises, fondations, structures soutenant la Fréquence."
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-emerald-950/60 border border-stone-200 dark:border-emerald-500/20 p-5 sm:p-8 shadow-sm">
            <AdhesionForm source="page_adhesion" />
          </div>
        </section>
      </main>
    </>
  );
};

const CollegeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlighted?: boolean;
}> = ({ icon, title, desc, highlighted }) => (
  <div
    className={`rounded-2xl p-5 border ${
      highlighted
        ? 'border-emerald-400/60 bg-emerald-50/80 dark:bg-emerald-500/10'
        : 'border-stone-200 dark:border-emerald-500/20 bg-white/70 dark:bg-emerald-950/40'
    }`}
  >
    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

export default Adhesion;
