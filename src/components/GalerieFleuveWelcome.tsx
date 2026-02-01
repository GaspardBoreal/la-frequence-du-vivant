import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Camera, MapPin, Clock, Stars, Waves, Grid3x3, Eye, Heart, Leaf, Flower2 as Flower, Grape } from 'lucide-react';
import { ExplorationTheme } from '@/utils/explorationThemes';
import EbookSelectorDialog from './EbookSelectorDialog';
import { useIsMobile } from '@/hooks/use-mobile';

// Mapping des icônes string vers composants
const iconMap = {
  Stars,
  Waves,
  Grid3x3,
  Eye,
  Heart,
  Palette,
  Leaf,
  Flower,
  Grape
};
interface GalerieFluveWelcomeProps {
  title: string;
  description?: string;
  stats: {
    marches: number;
    photos: number;
    regions: number;
  };
  theme?: ExplorationTheme;
  onStart?: () => void;
  explorationSlug?: string;
}
const GalerieFleuveWelcome: React.FC<GalerieFluveWelcomeProps> = ({
  title,
  description,
  stats,
  theme,
  onStart,
  explorationSlug
}) => {
  const isMobile = useIsMobile();
  const handleStart = () => {
    const galerieElement = document.getElementById('galerie');
    if (galerieElement) {
      galerieElement.scrollIntoView({
        behavior: 'smooth'
      });
    }
    onStart?.();
  };
  const handleModeClick = (modeLabel: string) => {
    if (modeLabel === 'Voir') {
      handleStart(); // Same action as "Commencer l'exploration" (formerly "Galerie")
    } else if (modeLabel === 'Ecouter') {
      // Navigate to audio/bioacoustic experience
      if (explorationSlug) {
        window.location.href = `/galerie-fleuve/exploration/${explorationSlug}/ecouter`;
      }
    } else if (modeLabel === 'Lire') {
      // Navigate to revolutionary reading experience
      if (explorationSlug) {
        window.location.href = `/galerie-fleuve/exploration/${explorationSlug}/lire`;
      }
    } else if (modeLabel === 'Préfigurer') {
      // Navigate to immersive prefiguration experience
      if (explorationSlug) {
        window.location.href = `/galerie-fleuve/exploration/${explorationSlug}/prefigurer`;
      }
    }
  };
  const handleSwipe = (event: any, info: any) => {
    // Swipe left (deltaX < -50) triggers start
    if (info.offset.x < -50) {
      handleStart();
    }
  };

  // Particules adaptées au thème
  const renderParticles = () => {
    const particleType = theme?.particles.type || 'water';
    const particleCount = theme?.particles.count || 25;
    const particleClass = particleType === 'leaves' ? 'bg-amber-400/30 rounded-sm transform rotate-12' : 'bg-white/20 rounded-full';
    return [...Array(particleCount)].map((_, i) => <motion.div key={i} className={`absolute w-2 h-2 ${particleClass}`} style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`
    }} animate={particleType === 'leaves' ? {
      y: [-20, 20, -20],
      x: [-5, 5, -5],
      rotate: [0, 360],
      opacity: [0.2, 0.6, 0.2]
    } : {
      y: [-20, 20, -20],
      opacity: [0.3, 0.8, 0.3]
    }} transition={{
      duration: particleType === 'leaves' ? 4 + Math.random() * 2 : 3 + Math.random() * 2,
      repeat: Infinity,
      delay: Math.random() * 2
    }} />);
  };

  // Modes d'immersion principaux - retrait de "Préfigurer" - Ordre: Écouter, Voir, Lire
  const immersionModes = theme?.immersionModes?.filter(mode => mode.label !== 'Suivre' && mode.label !== 'Préfigurer') || [{
    icon: 'Heart',
    label: 'Ecouter',
    desc: 'Paysages sonores'
  }, {
    icon: 'Eye',
    label: 'Voir',
    desc: 'Navigation spatiale des souvenirs'
  }, {
    icon: 'Stars',
    label: 'Lire',
    desc: 'Récits poétiques'
  }];
  const gradientClass = theme?.colors.gradient ? `bg-gradient-to-br ${theme.colors.gradient.from} ${theme.colors.gradient.via || ''} ${theme.colors.gradient.to}` : 'bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/70';
  const textClass = theme?.colors.text || 'text-primary-foreground';
  const badgeClass = theme?.colors.badge || 'bg-white/20 text-primary-foreground border-white/30';
  return <motion.section className={`relative overflow-hidden ${gradientClass} ${textClass} min-h-[100svh] md:min-h-screen flex flex-col`} initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.8
  }}>
      {/* Particules décoratives adaptées */}
      <div className="absolute inset-0 overflow-hidden">
        {renderParticles()}
      </div>

        <motion.div className={`relative container mx-auto px-4 ${isMobile ? 'pt-20 pb-4' : 'py-12'} flex-1 flex flex-col justify-between`} onPanEnd={handleSwipe}>
        <div className={isMobile ? 'space-y-4' : 'space-y-8'}>
          {/* Badge */}
          <div className="flex justify-end items-start">
            
          </div>

          {/* Titre principal */}
          <motion.div initial={{
          y: 30,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.2
        }} className={isMobile ? 'mt-24' : ''}>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-6xl text-center'} font-bold ${isMobile ? 'mb-2' : 'mb-4'} leading-tight`}>
              {(theme?.title.main || title).replace(/\s*—\s*atlas des vivants/i, '')}
            </h1>
            {isMobile && <p className="text-sm italic opacity-70 mt-2">08.2025</p>}
            {!isMobile && <>
                {(theme?.description || description) && <p className={`${isMobile ? 'text-base' : 'text-lg'} opacity-70 max-w-2xl mx-auto text-center`}>
                    {(theme?.description || description)?.replace(/<br\s*\/?>(\n)?/gi, ' ')}
                  </p>}
              </>}
          </motion.div>

        </div>

        {/* Zone centrale - stats + boutons */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Statistiques */}
          <motion.div data-gf-indicators className={`grid grid-cols-3 place-items-center ${isMobile ? 'gap-3' : 'gap-6'} max-w-lg mx-auto`} initial={{
          y: 30,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.4
        }}>
            <div className="text-center w-full flex flex-col items-center">
              <div className={`flex items-center justify-center ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <MapPin className={`${isMobile ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} />
                <span className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>{stats.marches}</span>
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80 text-center`}>
                {stats.marches > 1 ? 'Marches' : 'Marche'}
              </p>
            </div>
            <div className="text-center w-full flex flex-col items-center">
              <div className={`flex items-center justify-center ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <Camera className={`${isMobile ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} />
                <span className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>{stats.photos}</span>
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80 text-center`}>
                {isMobile ? 'Observations' : 'Photos'}
              </p>
            </div>
            <div className="text-center w-full flex flex-col items-center">
              <div className={`flex items-center justify-center ${isMobile ? 'mb-1' : 'mb-2'}`}>
                <Clock className={`${isMobile ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} />
                <span className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>
                  {isMobile ? '480' : stats.regions}
                </span>
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80 text-center`}>
                {isMobile ? 'Km' : stats.regions > 1 ? 'Régions' : 'Région'}
              </p>
            </div>
          </motion.div>

          {/* Modes d'immersion */}
          <motion.div className="mt-6" initial={{
          y: 30,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.6
        }}>
            {!isMobile && <h3 className="text-lg font-semibold mb-4 opacity-90 text-center">Modes d'immersion disponibles</h3>}
            <div className={`${isMobile ? 'flex flex-col gap-3 items-center' : 'flex flex-wrap gap-5 justify-center'}`}>
              {immersionModes.map((mode, index) => {
              const IconComponent = iconMap[mode.icon as keyof typeof iconMap] || Heart;
              return (
                <motion.button 
                  key={index} 
                  onClick={() => handleModeClick(mode.label)} 
                  className={`
                    group relative flex items-center overflow-hidden
                    ${isMobile ? 'space-x-2 px-4 py-2.5 justify-center min-w-[140px]' : 'space-x-3 px-5 py-3'} 
                    bg-white/10 rounded-xl backdrop-blur-md border border-white/20 
                    ${isMobile ? '' : 'whitespace-nowrap'} cursor-pointer 
                    ${mode.label === 'Voir' ? 'ring-2 ring-white/50 bg-white/15' : ''}
                    focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent
                    transition-all duration-300 ease-out
                  `}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 40px -10px rgba(255,255,255,0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.7 + index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                  
                  {/* Icon with animation */}
                  <motion.div
                    className="relative z-10"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300`} />
                  </motion.div>
                  
                  {/* Label */}
                  <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold relative z-10 group-hover:tracking-wider transition-all duration-300`}>
                    {mode.label}
                  </span>
                  
                  {/* Glow effect for active button */}
                  {mode.label === 'Voir' && (
                    <motion.div 
                      className="absolute inset-0 rounded-xl bg-white/10"
                      animate={{ 
                        boxShadow: ["0 0 15px rgba(255,255,255,0.2)", "0 0 25px rgba(255,255,255,0.4)", "0 0 15px rgba(255,255,255,0.2)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              );
            })}
            </div>
          </motion.div>
        </div>

        {/* Footer ancré en bas */}
        <div className={`w-full ${isMobile ? 'pb-4' : 'pb-6'}`}>
          {/* Trait séparateur */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.9
        }} className="w-full h-px bg-white/30" />

          {/* Gaspard Boréal */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 1.0
        }} className={`${isMobile ? 'flex flex-col space-y-2 text-center mt-4' : 'flex justify-between items-center mt-6'} w-full`}>
            <div className="font-crimson text-white">
              <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium`}>Gaspard Boréal</div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80`}>Poète des Mondes Hybrides</div>
            </div>
            
             <div className={`${isMobile ? 'flex flex-col space-y-1' : 'flex items-center space-x-6'}`}>
               <a href="https://www.gaspardboreal.com/" target="_blank" rel="noopener noreferrer" className={`text-white/80 hover:text-white transition-colors ${isMobile ? 'text-sm' : 'text-base'} hover:underline`}>
                 Découvrir l'auteur
               </a>
               <a href="https://www.gaspardboreal.com/conferences" target="_blank" rel="noopener noreferrer" className={`text-white/80 hover:text-white transition-colors ${isMobile ? 'text-sm' : 'text-base'} hover:underline`}>
                 Conférences et formation IA
               </a>
               <EbookSelectorDialog trigger={
                 <button className={`text-white/60 hover:text-white/90 transition-colors ${isMobile ? 'text-sm' : 'text-base'} italic`}>
                   Livre Vivant
                 </button>
               } />
             </div>
          </motion.div>
        </div>
        </motion.div>
    </motion.section>;
};
export default GalerieFleuveWelcome;