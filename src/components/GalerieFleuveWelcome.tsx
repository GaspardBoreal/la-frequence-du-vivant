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
  Heart
} from 'lucide-react';

interface GalerieFleuveWelcomeProps {
  title: string;
  description?: string;
  stats: {
    marches: number;
    photos: number;
    regions: number;
  };
  onStart?: () => void;
}

const GalerieFleuveWelcome: React.FC<GalerieFleuveWelcomeProps> = ({
  title,
  description,
  stats,
  onStart
}) => {
  const handleStart = () => {
    const galerieElement = document.getElementById('galerie');
    if (galerieElement) {
      galerieElement.scrollIntoView({ behavior: 'smooth' });
    }
    onStart?.();
  };

  const immersionModes = [
    { icon: Stars, label: 'Constellation', desc: 'Navigation spatiale des souvenirs' },
    { icon: Waves, label: 'Fleuve temporel', desc: 'Chronologie du périple' },
    { icon: Grid3x3, label: 'Mosaïque vivante', desc: 'Composition visuelle' },
    { icon: Eye, label: 'Immersion totale', desc: 'Plongée photographique' },
    { icon: Heart, label: 'Filtrage émotions', desc: 'Exploration thématique' }
  ];

  return (
    <motion.section 
      className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/70 text-primary-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Particules décoratives */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-16">
        {/* Badge */}
        <div className="flex justify-end items-start mb-8">
          <Badge className="bg-white/20 text-primary-foreground border-white/30">
            <Palette className="h-3 w-3 mr-1" />
            Galerie Fleuve
          </Badge>
        </div>

        {/* Titre principal */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="block">Fréquences de la rivière</span>
            <span className="block opacity-90">Dordogne</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-80 mb-4">
            Atlas des vivants — Remontée techno-sensible
          </p>
          <p className="text-lg opacity-70 max-w-2xl">
            Un périple de 480 kilomètres à travers 6 départements, où la technologie révèle 
            les fréquences secrètes du vivant le long des eaux de la Dordogne.
          </p>
          {description && (
            <div 
              className="mt-4 text-base opacity-80 max-w-3xl prose prose-lg prose-invert" 
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </motion.div>

        {/* Statistiques */}
        <motion.div 
          className="grid grid-cols-3 gap-6 max-w-lg mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="text-3xl font-bold">{stats.marches}</span>
            </div>
            <p className="text-sm opacity-80">
              {stats.marches > 1 ? 'Marches' : 'Marche'}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Camera className="h-5 w-5 mr-2" />
              <span className="text-3xl font-bold">{stats.photos}</span>
            </div>
            <p className="text-sm opacity-80">Visuels</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 mr-2" />
              <span className="text-3xl font-bold">{stats.regions}</span>
            </div>
            <p className="text-sm opacity-80">
              {stats.regions > 1 ? 'Régions' : 'Région'}
            </p>
          </div>
        </motion.div>

        {/* Mini-menu des modes d'immersion */}
        <motion.div 
          className="mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold mb-4 opacity-90">Modes d'immersion disponibles</h3>
          <div className="flex flex-wrap gap-4">
            {immersionModes.map((mode, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/20"
              >
                <mode.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{mode.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bouton d'action */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <Button 
            onClick={handleStart}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3"
          >
            Commencer l'exploration
          </Button>
        </motion.div>

        {/* Signature Gaspard Boréal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="absolute bottom-4 right-4 text-right"
        >
          <div className="text-white/80">
            <div className="font-libre text-lg font-bold">Gaspard Boréal</div>
            <div className="font-mono text-sm opacity-70">Poète des Mondes Hybrides</div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default GalerieFleuveWelcome;