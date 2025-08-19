import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Camera, 
  MapPin, 
  Clock,
  Stars,
  Waves,
  Grid3x3,
  Eye,
  Heart,
  Leaf,
  Flower2 as Flower,
  Grape
} from 'lucide-react';
import { ExplorationTheme } from '@/utils/explorationThemes';

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
  Grape,
};

interface GalerieFleuveWelcomeProps {
  title: string;
  description?: string;
  stats: {
    marches: number;
    photos: number;
    regions: number;
  };
  theme?: ExplorationTheme;
  onStart?: () => void;
}

const GalerieFleuveWelcome: React.FC<GalerieFleuveWelcomeProps> = ({
  title,
  description,
  stats,
  theme,
  onStart
}) => {
  const handleStart = () => {
    const galerieElement = document.getElementById('galerie');
    if (galerieElement) {
      galerieElement.scrollIntoView({ behavior: 'smooth' });
    }
    onStart?.();
  };

  // Particules adaptées au thème
  const renderParticles = () => {
    const particleType = theme?.particles.type || 'water';
    const particleCount = theme?.particles.count || 25;
    
    const particleClass = particleType === 'leaves' 
      ? 'bg-amber-400/30 rounded-sm transform rotate-12' 
      : 'bg-white/20 rounded-full';

    return [...Array(particleCount)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute w-2 h-2 ${particleClass}`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={
          particleType === 'leaves'
            ? {
                y: [-20, 20, -20],
                x: [-5, 5, -5],
                rotate: [0, 360],
                opacity: [0.2, 0.6, 0.2],
              }
            : {
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
              }
        }
        transition={{
          duration: particleType === 'leaves' ? 4 + Math.random() * 2 : 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ));
  };

  // Modes d'immersion adaptés
  const immersionModes = theme?.immersionModes || [
    { icon: 'Stars', label: 'Constellation', desc: 'Navigation spatiale des souvenirs' },
    { icon: 'Waves', label: 'Fleuve temporel', desc: 'Chronologie du périple' },
    { icon: 'Grid3x3', label: 'Mosaïque vivante', desc: 'Composition visuelle' },
    { icon: 'Eye', label: 'Immersion totale', desc: 'Plongée photographique' },
    { icon: 'Heart', label: 'Filtrage émotions', desc: 'Exploration thématique' }
  ];

  const gradientClass = theme?.colors.gradient 
    ? `bg-gradient-to-br ${theme.colors.gradient.from} ${theme.colors.gradient.via || ''} ${theme.colors.gradient.to}` 
    : 'bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/70';
  
  const textClass = theme?.colors.text || 'text-primary-foreground';
  const badgeClass = theme?.colors.badge || 'bg-white/20 text-primary-foreground border-white/30';

  return (
    <motion.section 
      className={`relative overflow-hidden ${gradientClass} ${textClass} min-h-screen flex flex-col`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Particules décoratives adaptées */}
      <div className="absolute inset-0 overflow-hidden">
        {renderParticles()}
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col justify-between">
        <div className="space-y-6 md:space-y-8">
          {/* Badge */}
          <div className="flex justify-end items-start">
            <Badge className={badgeClass}>
              {React.createElement(iconMap[theme?.badge.icon as keyof typeof iconMap] || Palette, { className: 'h-3 w-3 mr-1' })}
              {theme?.badge.text || 'Galerie Fleuve'}
            </Badge>
          </div>

          {/* Titre principal */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {theme?.title.main || title}
              {theme?.title.subtitle && (
                <span className="opacity-90">{window.innerWidth < 768 ? ` ${theme.title.subtitle}` : ` ${theme.title.subtitle}`}</span>
              )}
            </h1>
            <p className="text-lg opacity-70 max-w-2xl">
              {theme?.description || description || 'Découvrez cette exploration immersive à travers ses visuels et récits.'}
            </p>
            {description && description !== theme?.description && (
              <div 
                className="mt-4 text-base opacity-80 max-w-3xl prose prose-lg prose-invert" 
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </motion.div>

          {/* Statistiques */}
          <motion.div 
            className="grid grid-cols-3 gap-6 max-w-lg"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-3xl font-bold">{window.innerWidth < 768 ? 6 : stats.marches}</span>
              </div>
              <p className="text-sm opacity-80">
                {window.innerWidth < 768 ? 'Départements' : (stats.marches > 1 ? 'Marches' : 'Marche')}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Camera className="h-5 w-5 mr-2" />
                <span className="text-3xl font-bold">{window.innerWidth < 768 ? 18 : stats.photos}</span>
              </div>
              <p className="text-sm opacity-80">{window.innerWidth < 768 ? 'Marches' : 'Visuels'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-3xl font-bold">{window.innerWidth < 768 ? 480 : stats.regions}</span>
              </div>
              <p className="text-sm opacity-80">
                {window.innerWidth < 768 ? 'km' : (stats.regions > 1 ? 'Régions' : 'Région')}
              </p>
            </div>
          </motion.div>

          {/* Mini-menu des modes d'immersion */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold mb-4 opacity-90">Modes d'immersion disponibles</h3>
            <div className="flex flex-wrap gap-4">
              {immersionModes.map((mode, index) => {
                const IconComponent = iconMap[mode.icon as keyof typeof iconMap] || Heart;
                return (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/20"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Bouton d'action */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              onClick={handleStart}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3"
            >
              Commencer l'exploration
            </Button>
          </motion.div>
        </div>

        {/* Signature adaptée */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="self-end text-right mt-auto pt-8"
        >
          <div className="text-white/80">
            <div className="font-libre text-lg font-bold">{theme?.signature.author || 'Gaspard Boréal'}</div>
            <div className="font-mono text-sm opacity-70">{theme?.signature.title || 'Poète des Mondes Hybrides'}</div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default GalerieFleuveWelcome;