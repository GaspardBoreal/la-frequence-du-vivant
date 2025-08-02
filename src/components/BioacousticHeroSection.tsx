
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowLeft, Satellite, Compass } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface BioacousticHeroSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
  onBack: () => void;
}

const BioacousticHeroSection: React.FC<BioacousticHeroSectionProps> = ({
  marche,
  theme,
  onBack
}) => {
  const firstPhoto = marche.photos?.[0];

  return (
    <div className="relative h-[45vh] overflow-hidden">
      {/* Hexagonal Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="text-gray-200">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="50" height="43.3" patternUnits="userSpaceOnUse">
              <polygon fill="currentColor" points="25,0 43.3,12.5 43.3,30.8 25,43.3 6.7,30.8 6.7,12.5" stroke="currentColor" strokeWidth="0.5" fillOpacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)"/>
        </svg>
      </div>

      {/* Background Image with Subtle Overlay */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {firstPhoto ? (
          <div className="absolute inset-0">
            <img 
              src={firstPhoto} 
              alt={marche.nomMarche || marche.ville} 
              className="w-full h-full object-cover" 
              crossOrigin="anonymous" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-teal-800/50 to-green-700/60" />
          </div>
        ) : (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-700 to-green-600"
          />
        )}
      </motion.div>

      {/* Floating Code Lines Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-300/20 font-mono text-xs"
            style={{
              left: `${20 + i * 30}%`,
              top: `${15 + i * 20}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {i === 0 && "// bioacoustique.poetry()"}
            {i === 1 && "const sound = capture(nature)"}
            {i === 2 && "write(silence.between.words)"}
          </motion.div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full px-6">
        {/* Top Section */}
        <div className="flex justify-between items-start pt-6">
          {/* Back Button */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Carte
            </Button>
          </motion.div>

          {/* Vue Badge */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Badge 
              variant="outline" 
              className="bg-amber-500/20 backdrop-blur-md text-amber-100 border-amber-400/30 px-3 py-1 font-medium"
            >
              Vue 2025-2037
            </Badge>
          </motion.div>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <motion.div 
            className="text-center space-y-4 max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {/* Title with Digital Manuscript Effect */}
            <div className="bg-black/15 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/10">
              <h1 className="text-4xl md:text-5xl font-crimson font-bold text-white leading-tight tracking-wide">
                {marche.nomMarche || marche.ville}
              </h1>
            </div>
          </motion.div>
        </div>

        {/* Bottom Metadata Section */}
        <div className="pb-6">
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {/* GPS Coordinates - Left */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-3">
                <Satellite className="h-4 w-4 text-green-300" />
                <div className="text-sm">
                  <div className="text-white/70 text-xs uppercase tracking-wider">Géolocalisation Poétique</div>
                  <div className="font-mono text-green-200">
                    {marche.latitude.toFixed(6)}°N, {marche.longitude.toFixed(6)}°E
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-300" />
                <span className="text-sm">{marche.ville}, {marche.departement}</span>
              </div>
            </div>

            {/* Date - Right */}
            {marche.date && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-300" />
                  <span className="text-sm">{marche.date}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BioacousticHeroSection;
