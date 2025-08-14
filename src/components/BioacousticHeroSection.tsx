
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowLeft, Satellite, Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface BioacousticHeroSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
  onBack: () => void;
  previousMarche?: MarcheTechnoSensible | null;
  nextMarche?: MarcheTechnoSensible | null;
  onNavigateToMarche?: (marche: MarcheTechnoSensible) => void;
}

const BioacousticHeroSection: React.FC<BioacousticHeroSectionProps> = ({
  marche,
  theme,
  onBack,
  previousMarche,
  nextMarche,
  onNavigateToMarche
}) => {
  const firstPhoto = marche.photos?.[0];

  const handleCopyCoordinate = async (coordinate: string, type: 'latitude' | 'longitude') => {
    try {
      await navigator.clipboard.writeText(coordinate);
      console.log(`${type} copiée: ${coordinate}`);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

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
        {/* Top Section - Centered Navigation Bar */}
        <div className="flex justify-center items-center pt-6">
          <div className="flex items-center space-x-6 bg-white/5 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/10">
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
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-white/20 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Carte
              </Button>
            </motion.div>

            {/* Previous Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => previousMarche && onNavigateToMarche && onNavigateToMarche(previousMarche)}
                disabled={!previousMarche || !onNavigateToMarche}
                className={`backdrop-blur-md border p-3 rounded-xl transition-all duration-300 ${
                  previousMarche && onNavigateToMarche
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-400/30 hover:to-teal-400/30 text-white border-emerald-400/30 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/20'
                    : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                }`}
                title={previousMarche ? `Expérience précédente: ${previousMarche.nomMarche || previousMarche.ville}` : 'Aucune expérience précédente'}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20"></div>

            {/* Next Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nextMarche && onNavigateToMarche && onNavigateToMarche(nextMarche)}
                disabled={!nextMarche || !onNavigateToMarche}
                className={`backdrop-blur-md border p-3 rounded-xl transition-all duration-300 ${
                  nextMarche && onNavigateToMarche
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-400/30 hover:to-teal-400/30 text-white border-emerald-400/30 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/20'
                    : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                }`}
                title={nextMarche ? `Expérience suivante: ${nextMarche.nomMarche || nextMarche.ville}` : 'Aucune expérience suivante'}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20"></div>

            {/* Vue Badge */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge 
                variant="outline" 
                className="bg-amber-500/20 backdrop-blur-md text-amber-100 border-amber-400/30 px-4 py-2 font-medium transition-all duration-200 hover:bg-amber-400/30 hover:scale-105"
              >
                Vue 2025-2037
              </Badge>
            </motion.div>
          </div>
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
              <h1 className="text-4xl md:text-5xl font-crimson font-bold bg-gradient-to-br from-emerald-200 via-white to-green-200 bg-clip-text text-transparent leading-tight tracking-wide drop-shadow-lg">
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
            {/* GPS Coordinates - Separate clickable blocks */}
            <div className="flex items-center gap-4">
              <div 
                className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors group"
                onClick={() => handleCopyCoordinate(marche.latitude.toFixed(6), 'latitude')}
                title="Cliquer pour copier la latitude"
              >
                <div className="flex items-center space-x-2">
                  <Satellite className="h-3 w-3 text-green-300" />
                  <div className="text-xs">
                    <div className="text-white/70 text-xs uppercase tracking-wider">Lat</div>
                    <div className="font-mono text-green-200 group-hover:text-green-100">
                      {marche.latitude.toFixed(6)}°N
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors group"
                onClick={() => handleCopyCoordinate(marche.longitude.toFixed(6), 'longitude')}
                title="Cliquer pour copier la longitude"
              >
                <div className="flex items-center space-x-2">
                  <Compass className="h-3 w-3 text-blue-300" />
                  <div className="text-xs">
                    <div className="text-white/70 text-xs uppercase tracking-wider">Lng</div>
                    <div className="font-mono text-blue-200 group-hover:text-blue-100">
                      {marche.longitude.toFixed(6)}°E
                    </div>
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
                  <span className="text-sm">{marche.date.split('-').reverse().join('-')}</span>
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
