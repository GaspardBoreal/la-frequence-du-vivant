import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  Grape,
  Settings
} from 'lucide-react';
import { ExplorationTheme } from '@/utils/explorationThemes';
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
  const isMobile = useIsMobile();
  const handleStart = () => {
    const galerieElement = document.getElementById('galerie');
    if (galerieElement) {
      galerieElement.scrollIntoView({ behavior: 'smooth' });
    }
    onStart?.();
  };

  const handleModeClick = (modeLabel: string) => {
    if (modeLabel === 'Galerie') {
      handleStart(); // Same action as "Commencer l'exploration"
    }
    // TODO: Add other mode handlers later
  };

  const handleSwipe = (event: any, info: any) => {
    // Swipe left (deltaX < -50) triggers start
    if (info.offset.x < -50) {
      handleStart();
    }
  };

  // Tuning panel for testing positions
  const [showTuning] = React.useState(() => new URLSearchParams(window.location.search).get('tune') === '1');
  const [indicatorPosition, setIndicatorPosition] = React.useState(() => {
    const saved = localStorage.getItem('tune-indicator-position');
    return saved ? parseInt(saved) : 36;
  });
  const [buttonOffset, setButtonOffset] = React.useState(() => {
    const saved = localStorage.getItem('tune-button-offset');
    return saved ? parseInt(saved) : 15;
  });

  // Mobile: positionner les indicateurs selon le réglage
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [mobileStatsMargin, setMobileStatsMargin] = React.useState<number | undefined>(undefined);

  React.useLayoutEffect(() => {
    if (!isMobile) return;
    const compute = () => {
      const headerH = headerRef.current?.getBoundingClientRect().height ?? 0;
      const targetTop = Math.round(window.innerHeight * (indicatorPosition / 100));
      const margin = Math.max(0, targetTop - headerH);
      setMobileStatsMargin(margin);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isMobile, indicatorPosition]);

  const handleIndicatorChange = (value: number) => {
    setIndicatorPosition(value);
    localStorage.setItem('tune-indicator-position', value.toString());
  };

  const handleButtonChange = (value: number) => {
    setButtonOffset(value);
    localStorage.setItem('tune-button-offset', value.toString());
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
    { icon: 'Stars', label: 'Galerie', desc: 'Navigation spatiale des souvenirs' },
    { icon: 'Waves', label: 'Fleuve temporel', desc: 'Chronologie du périple' },
    { icon: 'Grid3x3', label: 'Mosaïque vivante', desc: 'Composition visuelle' },
    { icon: 'Eye', label: 'Ecoute contemplative', desc: 'Plongée photographique' }
  ];

  const gradientClass = theme?.colors.gradient 
    ? `bg-gradient-to-br ${theme.colors.gradient.from} ${theme.colors.gradient.via || ''} ${theme.colors.gradient.to}` 
    : 'bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/70';
  
  const textClass = theme?.colors.text || 'text-primary-foreground';
  const badgeClass = theme?.colors.badge || 'bg-white/20 text-primary-foreground border-white/30';

  return (
    <motion.section 
      className={`relative overflow-hidden ${gradientClass} ${textClass} min-h-[100svh] md:min-h-screen flex flex-col`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Particules décoratives adaptées */}
      <div className="absolute inset-0 overflow-hidden">
        {renderParticles()}
      </div>

        <motion.div 
          className="relative container mx-auto px-4 py-4 md:py-12 flex-1 flex flex-col justify-between"
          onPanEnd={handleSwipe}
        >
        <div ref={headerRef} className="space-y-3 md:space-y-8">
          {/* Badge */}
          <div className="flex justify-end items-start">
            <Badge className={`${badgeClass} ${isMobile ? 'px-2 py-1 text-xs' : ''}`}>
              {React.createElement(iconMap[theme?.badge.icon as keyof typeof iconMap] || Palette, { className: `${isMobile ? 'h-2 w-2 mr-1' : 'h-3 w-3 mr-1'}` })}
              <span className={isMobile ? 'text-xs' : ''}>{theme?.badge.text || 'Galerie Fleuve'}</span>
            </Badge>
          </div>

          {/* Titre principal */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-6xl'} font-bold ${isMobile ? 'mb-2' : 'mb-4'} leading-tight`}>
              {theme?.title.main || title}
            </h1>
            {isMobile && (
              <p className="text-sm italic opacity-70 mt-2">08.2025</p>
            )}
            {!isMobile && (
              <>
                {(theme?.description || description) && (
                  <p className={`${isMobile ? 'text-base' : 'text-lg'} opacity-70 max-w-2xl`}>
                    {(theme?.description || description)?.replace(/<br\s*\/?>(\n)?/gi, ' ')}
                  </p>
                )}
                {description && description !== theme?.description && (
                  <div 
                    className="mt-4 text-base opacity-80 max-w-3xl prose prose-lg prose-invert" 
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                )}
              </>
            )}
          </motion.div>

        </div>

        {/* Contenu principal centré */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          {/* Statistiques - position mobile ajustée */}
          <motion.div 
            data-gf-indicators
            className={`grid grid-cols-3 place-items-center ${isMobile ? 'gap-3' : 'gap-6'} max-w-lg mx-auto`}
            style={isMobile ? { position: 'absolute', top: `${indicatorPosition}svh`, left: 0, right: 0, marginTop: 0 } : undefined}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
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
                {isMobile ? 'Km' : (stats.regions > 1 ? 'Régions' : 'Région')}
              </p>
            </div>
          </motion.div>

          {/* Modes d'immersion - disposition mobile 2x2 */}
          <motion.div 
            className={`${isMobile ? 'mt-6' : 'mt-6'}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {!isMobile && (
              <h3 className={`text-lg font-semibold mb-4 opacity-90`}>Modes d'immersion disponibles</h3>
            )}
            <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-4'}`}>
              {immersionModes.map((mode, index) => {
                const IconComponent = iconMap[mode.icon as keyof typeof iconMap] || Heart;
                return (
                  <button 
                    key={index}
                    onClick={() => handleModeClick(mode.label)}
                    className={`flex items-center ${isMobile ? 'space-x-1 px-2 py-1 justify-center' : 'space-x-2 px-3 py-2'} bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 ${isMobile ? '' : 'whitespace-nowrap'} cursor-pointer hover:bg-white/20 transition-colors ${mode.label === 'Galerie' ? 'ring-1 ring-white/40' : ''}`}
                  >
                    <IconComponent className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Bouton d'action - en bas pour mobile */}
          <motion.div
            className={`${isMobile ? 'mt-8' : ''}`}
            style={isMobile ? { marginTop: `${buttonOffset}px` } : undefined}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              onClick={handleStart}
              size={isMobile ? "default" : "lg"}
              className={`bg-white text-primary hover:bg-white/90 font-semibold ${isMobile ? 'px-6 py-2 text-sm w-full' : 'px-8 py-3'}`}
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
          className={`self-end text-right mt-auto ${isMobile ? 'pt-3 pb-4' : 'pt-8 pb-8'}`}
        >
          <div className="text-white/80">
            <div className={`font-libre ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{theme?.signature.author || 'Gaspard Boréal'}</div>
            <div className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} opacity-70`}>{theme?.signature.title || 'Poète des Mondes Hybrides'}</div>
          </div>
        </motion.div>
        </motion.div>

      {/* Tuning Panel - Only visible when ?tune=1 */}
      {showTuning && (
        <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/20 z-50 text-white min-w-[280px]">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4" />
            <h3 className="font-semibold">Réglage Position</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Hauteur indicateurs: {indicatorPosition}svh
              </label>
              <Slider
                value={[indicatorPosition]}
                onValueChange={(value) => handleIndicatorChange(value[0])}
                min={5}
                max={85}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Décalage bouton: {buttonOffset}px
              </label>
              <Slider
                value={[buttonOffset]}
                onValueChange={(value) => handleButtonChange(value[0])}
                min={-40}
                max={120}
                step={5}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="mt-4 text-xs text-white/60">
            URL: ?tune=1<br/>
            DevTools: F12 → Toggle device toolbar → iPhone 13
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default GalerieFleuveWelcome;