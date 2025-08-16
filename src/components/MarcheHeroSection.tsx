
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import { useIsMobile } from '@/hooks/use-mobile';

interface MarcheHeroSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
  onBack: () => void;
  previousMarche?: MarcheTechnoSensible | null;
  nextMarche?: MarcheTechnoSensible | null;
  onNavigateToPrevious?: () => void;
  onNavigateToNext?: () => void;
  isModal?: boolean;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

const MarcheHeroSection: React.FC<MarcheHeroSectionProps> = ({
  marche,
  theme,
  onBack,
  previousMarche,
  nextMarche,
  onNavigateToPrevious,
  onNavigateToNext,
  isModal = false,
  canNavigatePrev = false,
  canNavigateNext = false
}) => {
  const isMobile = useIsMobile();
  const firstPhoto = marche.photos?.[0];

  return (
    <div className={`relative overflow-hidden ${isModal ? 'h-[80vh]' : 'h-[400px]'}`}>
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
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
      <div className={`relative z-10 flex flex-col px-6 ${isModal ? 'h-[80vh]' : 'h-[400px]'}`}>
        {/* Top Section - Centered Navigation Bar */}
        <div className="flex justify-center items-center pt-8">
          <div className="flex items-center space-x-6 bg-black/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">

            {/* Previous Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToPrevious}
                disabled={!canNavigatePrev || !onNavigateToPrevious}
                className={`backdrop-blur-md border p-3 rounded-xl transition-all duration-300 ${
                  canNavigatePrev && onNavigateToPrevious
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-400/30 hover:to-pink-400/30 text-white border-purple-400/30 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20'
                    : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                }`}
                title={previousMarche ? `Marche précédente: ${previousMarche.nomMarche || previousMarche.ville}` : 'Aucune marche précédente'}
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
                onClick={onNavigateToNext}
                disabled={!canNavigateNext || !onNavigateToNext}
                className={`backdrop-blur-md border p-3 rounded-xl transition-all duration-300 ${
                  canNavigateNext && onNavigateToNext
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-400/30 hover:to-pink-400/30 text-white border-purple-400/30 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20'
                    : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                }`}
                title={nextMarche ? `Marche suivante: ${nextMarche.nomMarche || nextMarche.ville}` : 'Aucune marche suivante'}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Main Content - Centered in remaining space */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <motion.div 
            className="text-center space-y-6 max-w-5xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl px-8 py-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-crimson font-bold text-white leading-tight">
                {marche.nomMarche || marche.ville}
              </h1>
            </div>
            
            
            <div className="bg-black/10 backdrop-blur-sm rounded-lg px-6 py-3 inline-block">
              <div className="flex flex-wrap justify-center gap-6 text-white/90 text-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{marche.ville}, {marche.departement}</span>
                </div>
                {marche.date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>
                      {(() => {
                        // Handle both yyyy-mm-dd and dd/mm/yyyy formats
                        if (marche.date.includes('-')) {
                          // Format: yyyy-mm-dd -> dd-mm-yyyy
                          const [year, month, day] = marche.date.split('-');
                          return `${day.padStart(2, '0')} - ${month.padStart(2, '0')} - ${year}`;
                        } else if (marche.date.includes('/')) {
                          // Format: dd/mm/yyyy -> dd-mm-yyyy
                          return marche.date.split('/').join(' - ');
                        }
                        return marche.date;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section with Fixed Height for Progress Indicator */}
        <div className="relative h-24 flex-shrink-0 flex items-end justify-center pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="flex space-x-3">
              {['visuel', 'audio', 'poétique', 'social'].map((section, index) => (
                <div key={section} className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      delay: 1.5 + index * 0.2,
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
    </div>
  );
};

export default MarcheHeroSection;
