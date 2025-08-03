import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Sparkles, Eye, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface PoeticSatelliteHeroProps {
  satelliteImage?: {
    imageUrl: string;
    metadata: {
      date: string;
      cloudCover: number;
      resolution: string;
      visualizationType: string;
    };
  };
  isLoading: boolean;
  currentNDVI?: number;
  haiku?: string;
  onRefresh: () => void;
  className?: string;
}

const PoeticSatelliteHero: React.FC<PoeticSatelliteHeroProps> = ({
  satelliteImage,
  isLoading,
  currentNDVI,
  haiku,
  onRefresh,
  className = ""
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showHaiku, setShowHaiku] = useState(false);

  useEffect(() => {
    if (satelliteImage) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = satelliteImage.imageUrl;
    }
  }, [satelliteImage]);

  useEffect(() => {
    if (haiku && imageLoaded) {
      const timer = setTimeout(() => setShowHaiku(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [haiku, imageLoaded]);

  const getVisualizationLabel = (type: string) => {
    switch (type) {
      case 'trueColor': return 'Vision Terrestre';
      case 'ndvi': return 'Indice Végétal';
      case 'ndviColorized': return 'Palette Chlorophylle';
      default: return 'Vue Satellite';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 ${className}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Satellite Image Container */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-[500px]">
        {/* Left Side - Satellite Image */}
        <div className="flex-1 relative p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-full min-h-[300px]"
          >
            {isLoading ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-800/50 to-purple-800/50 rounded-2xl border-2 border-white/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-white/60"
                >
                  <Satellite className="h-12 w-12" />
                </motion.div>
              </div>
            ) : satelliteImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: imageLoaded ? 1 : 0.5, scale: imageLoaded ? 1 : 0.9 }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl"
              >
                <img
                  src={satelliteImage.imageUrl}
                  alt="Vue satellite"
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
                
                {/* Image Overlay Info */}
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge className="bg-black/60 text-white border-white/20">
                    {getVisualizationLabel(satelliteImage.metadata.visualizationType)}
                  </Badge>
                  <Badge className="bg-black/60 text-white border-white/20">
                    {satelliteImage.metadata.resolution}
                  </Badge>
                </div>

                {currentNDVI !== undefined && (
                  <div className="absolute bottom-4 left-4">
                    <Badge className={`${
                      currentNDVI > 0.6 
                        ? 'bg-green-600/80 text-white' 
                        : currentNDVI > 0.3 
                          ? 'bg-yellow-600/80 text-white'
                          : 'bg-orange-600/80 text-white'
                    } border-white/20`}>
                      NDVI: {currentNDVI.toFixed(3)}
                    </Badge>
                  </div>
                )}

                {/* Download Button */}
                <div className="absolute bottom-4 right-4">
                  <Button
                    size="sm"
                    className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
                    onClick={() => window.open(satelliteImage.imageUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-800/30 to-purple-800/30 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white/60">
                <Eye className="h-12 w-12" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Side - Poetic Content */}
        <div className="flex-1 p-8 flex flex-col justify-center text-white">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="space-y-6"
          >
            {/* Title */}
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mb-4"
              >
                <Satellite className="h-8 w-8 text-white" />
              </motion.div>
              
              <h1 className="text-4xl font-crimson font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                L'Observatoire Vivant
              </h1>
              
              <p className="text-xl text-blue-100">
                de Gaspard Boréal
              </p>
            </div>

            {/* Metadata */}
            {satelliteImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-2 text-sm text-blue-200"
              >
                <p>Acquisition satellite: {formatDate(satelliteImage.metadata.date)}</p>
                <p>Couverture nuageuse: {satelliteImage.metadata.cloudCover.toFixed(1)}%</p>
                <p>Résolution: {satelliteImage.metadata.resolution}</p>
              </motion.div>
            )}

            {/* Haiku */}
            <AnimatePresence>
              {showHaiku && haiku && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border border-white/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm font-medium text-blue-200">Haiku Satellite</span>
                  </div>
                  
                  <div className="text-white font-crimson text-lg leading-relaxed whitespace-pre-line italic">
                    {haiku}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Refresh Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                onClick={onRefresh}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                disabled={isLoading}
              >
                <Satellite className="h-4 w-4 mr-2" />
                Actualiser l'Observatoire
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PoeticSatelliteHero;