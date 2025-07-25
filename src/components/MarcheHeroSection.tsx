
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface MarcheHeroSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
  onBack: () => void;
}

const MarcheHeroSection: React.FC<MarcheHeroSectionProps> = ({
  marche,
  theme,
  onBack
}) => {
  const firstPhoto = marche.photos?.[0];

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {firstPhoto ? (
          <div className="absolute inset-0">
            <img
              src={firstPhoto}
              alt={marche.nomMarche || marche.ville}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
          </div>
        ) : (
          <div 
            className="absolute inset-0 bg-gradient-to-br"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}40)`
            }}
          />
        )}
      </motion.div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col justify-center items-center min-h-[70vh] px-6">
        {/* Back Button */}
        <motion.div
          className="absolute top-8 left-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la carte
          </Button>
        </motion.div>

        {/* Region Badge */}
        <motion.div
          className="absolute top-8 right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Badge 
            variant="outline" 
            className="bg-white/20 backdrop-blur-sm text-white border-white/30 flex items-center space-x-2"
          >
            <MapPin className="h-3 w-3" />
            <span>{marche.region}</span>
          </Badge>
        </motion.div>

        {/* Main Title */}
        <motion.div
          className="text-center space-y-4 max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-crimson font-bold text-white leading-tight">
            {marche.nomMarche || marche.ville}
          </h1>
          
          {marche.descriptifCourt && (
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              {marche.descriptifCourt}
            </p>
          )}
          
          <div className="flex flex-wrap justify-center gap-4 text-white/80 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{marche.ville}, {marche.departement}</span>
            </div>
            {marche.theme && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{marche.theme}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="flex space-x-2">
            {['visuel', 'audio', 'poétique', 'social'].map((section, index) => (
              <div
                key={section}
                className="w-8 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ 
                    delay: 1.5 + (index * 0.2), 
                    duration: 0.8, 
                    ease: "easeOut" 
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MarcheHeroSection;
