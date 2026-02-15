import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Camera, Leaf } from 'lucide-react';
import BotanicalLeaf from './BotanicalLeaf';

interface CarnetTerrainHeroProps {
  totalMarches: number;
  totalSpecies: number;
  totalPhotos: number;
}

const CounterBadge = ({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.4 }}
    className="flex flex-col items-center gap-1"
  >
    <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-emerald-400/20 rounded-full px-4 py-2">
      <Icon className="w-4 h-4 text-emerald-400" />
      <span className="text-xl font-semibold text-foreground">{value.toLocaleString('fr-FR')}</span>
    </div>
    <span className="text-xs text-muted-foreground tracking-wide uppercase">{label}</span>
  </motion.div>
);

const CarnetTerrainHero: React.FC<CarnetTerrainHeroProps> = ({ totalMarches, totalSpecies, totalPhotos }) => {
  return (
    <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 px-6 text-center overflow-hidden">
      {/* Botanical ornaments */}
      <BotanicalLeaf className="absolute top-8 left-4 md:left-16 w-20 md:w-28 text-emerald-700" />
      <BotanicalLeaf className="absolute top-12 right-4 md:right-16 w-16 md:w-24 text-emerald-700" flip />

      {/* Soft radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(16,185,129,0.12) 0%, transparent 70%)'
      }} />

      <div className="relative max-w-3xl mx-auto">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-emerald-400/80 text-sm tracking-[0.25em] uppercase mb-4 font-sans"
        >
          Les Marches du Vivant
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-crimson text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6"
        >
          Carnets de Terrain
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10 font-serif italic text-center"
        >
          Chaque marche est un acte de présence au vivant.
          <br />
          Voici les traces de ceux qui ont écouté.
        </motion.p>

        {/* Counters */}
        <div className="flex justify-center gap-6 md:gap-10 flex-wrap">
          <CounterBadge icon={BookOpen} value={totalMarches} label="carnets" />
          <CounterBadge icon={Leaf} value={totalSpecies} label="espèces" />
          <CounterBadge icon={Camera} value={totalPhotos} label="photos" />
        </div>
      </div>
    </section>
  );
};

export default CarnetTerrainHero;
