import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Medal, Play, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TopSpecies {
  name: string;
  scientificName: string;
  count: number;
  kingdom: string;
  photos?: string[];
}

interface BiodiversityTop10PodiumProps {
  species: TopSpecies[];
}

const BiodiversityTop10Podium: React.FC<BiodiversityTop10PodiumProps> = ({ species }) => {
  const [selectedSpecies, setSelectedSpecies] = useState<TopSpecies | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getKingdomColor = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return 'from-sky-500 to-cyan-600';
      case 'Plantae': return 'from-emerald-500 to-green-600';
      case 'Fungi': return 'from-violet-500 to-purple-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getKingdomEmoji = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return '🐦';
      case 'Plantae': return '🌿';
      case 'Fungi': return '🍄';
      default: return '🔬';
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />;
    if (index === 1) return <Medal className="h-4 w-4 md:h-5 md:w-5 text-gray-300" />;
    if (index === 2) return <Medal className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />;
    return <span className="text-base md:text-lg font-bold text-white/60">#{index + 1}</span>;
  };

  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = species.length >= 3 
    ? [species[1], species[0], species[2]]
    : species.slice(0, 3);

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            🏆 Top 10 des espèces emblématiques
          </h2>
          <p className="text-base md:text-lg text-slate-400">
            Les espèces les plus fréquemment observées le long du fleuve
          </p>
        </motion.div>

        {/* Podium - Top 3 - Responsive */}
        <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8 md:mb-12">
          {podiumOrder.map((sp, displayIndex) => {
            const actualIndex = displayIndex === 1 ? 0 : displayIndex === 0 ? 1 : 2;
            const heightClass = actualIndex === 0 
              ? 'h-36 sm:h-44 md:h-48' 
              : actualIndex === 1 
                ? 'h-28 sm:h-36 md:h-40' 
                : 'h-24 sm:h-32 md:h-36';
            const scaleClass = actualIndex === 0 ? 'z-20' : actualIndex === 1 ? 'z-10' : 'z-0';
            
            return (
              <motion.div
                key={sp.name}
                className={`relative ${heightClass} w-24 sm:w-36 md:w-48 ${scaleClass}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: actualIndex * 0.2 }}
                onHoverStart={() => setHoveredIndex(actualIndex)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <motion.div
                  className={`h-full bg-gradient-to-t ${getKingdomColor(sp.kingdom)} rounded-t-xl md:rounded-t-2xl cursor-pointer
                    flex flex-col items-center justify-end p-2 sm:p-3 md:p-4 shadow-2xl`}
                  animate={{ 
                    scale: hoveredIndex === actualIndex ? 1.05 : 1 
                  }}
                  onClick={() => setSelectedSpecies(sp)}
                >
                  {/* Rank icon */}
                  <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-slate-900 rounded-full p-1.5 md:p-2 border border-slate-700">
                    {getRankIcon(actualIndex)}
                  </div>
                  
                  {/* Species photo or emoji */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center mb-2 md:mb-3 overflow-hidden">
                    {sp.photos?.[0] ? (
                      <img 
                        src={sp.photos[0]} 
                        alt={sp.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl md:text-3xl">{getKingdomEmoji(sp.kingdom)}</span>
                    )}
                  </div>
                  
                  {/* Species name */}
                  <div className="text-center">
                    <div className="font-bold text-white text-xs sm:text-sm md:text-base truncate max-w-full px-1">
                      {sp.name}
                    </div>
                    <div className="text-white/70 text-[10px] sm:text-xs italic truncate max-w-full px-1 hidden sm:block">
                      {sp.scientificName}
                    </div>
                    <Badge className="mt-1 md:mt-2 bg-white/20 text-white text-[10px] md:text-xs">
                      {sp.count} obs.
                    </Badge>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Remaining species (4-10) - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
          {species.slice(3).map((sp, index) => (
            <motion.div
              key={sp.name}
              className={`bg-gradient-to-br ${getKingdomColor(sp.kingdom)} rounded-lg md:rounded-xl p-2 md:p-3 cursor-pointer
                hover:scale-105 transition-transform shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index + 3) * 0.05 }}
              onClick={() => setSelectedSpecies(sp)}
            >
              <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                <span className="text-white/60 font-bold text-xs md:text-sm">#{index + 4}</span>
                <span className="text-sm md:text-lg">{getKingdomEmoji(sp.kingdom)}</span>
              </div>
              <div className="text-white font-medium text-xs md:text-sm truncate">{sp.name}</div>
              <div className="text-white/60 text-[10px] md:text-xs">{sp.count} obs.</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSpecies && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSpecies(null)}
          >
            <motion.div
              className={`bg-gradient-to-br ${getKingdomColor(selectedSpecies.kingdom)} rounded-2xl p-4 md:p-6 max-w-md w-full shadow-2xl relative`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setSelectedSpecies(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Photo */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                {selectedSpecies.photos?.[0] ? (
                  <img 
                    src={selectedSpecies.photos[0]} 
                    alt={selectedSpecies.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl md:text-6xl">{getKingdomEmoji(selectedSpecies.kingdom)}</span>
                )}
              </div>

              <div className="text-center text-white">
                <h3 className="text-xl md:text-2xl font-bold mb-1">{selectedSpecies.name}</h3>
                <p className="text-white/70 italic mb-4">{selectedSpecies.scientificName}</p>
                
                <div className="flex justify-center gap-3 md:gap-4 mb-6 flex-wrap">
                  <Badge className="bg-white/20 text-white">
                    {selectedSpecies.count} observations
                  </Badge>
                  <Badge className="bg-white/20 text-white">
                    {selectedSpecies.kingdom === 'Animalia' ? 'Faune' : 
                     selectedSpecies.kingdom === 'Plantae' ? 'Flore' :
                     selectedSpecies.kingdom === 'Fungi' ? 'Champignon' : 'Autre'}
                  </Badge>
                </div>

                <Button variant="secondary" size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Écouter sur Xeno-Canto
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BiodiversityTop10Podium;
